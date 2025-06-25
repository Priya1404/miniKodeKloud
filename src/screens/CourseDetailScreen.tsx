import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import {
  fetchCourseDetail,
  toggleCourseEnrollment,
} from '../store/courseSlice';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import RenderHtml from 'react-native-render-html';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckBox } from 'react-native-elements';
import { marked } from 'marked';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ProgressService } from '../services/ProgressService';

const { width } = Dimensions.get('window');

const BLUE = '#007AFF';
const LIGHT_BLUE = '#E3F2FD';

type Props = StackScreenProps<RootStackParamList, 'CourseDetail'>;

export const CourseDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const { slug } = route.params;
  const { courseDetail,
          courseDetailLoading,
          courseDetailError }: { 
            courseDetail: any, 
            courseDetailLoading: string, 
            courseDetailError: string | null 
          } = useAppSelector((state) => state.courses);
  
  const enrolled = courseDetail?.isEnrolled ?? false;
  const courseId = courseDetail?.id;

  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [expandAll, setExpandAll] = useState(true);
  const [expandedModules, setExpandedModules] = useState<{ [id: string]: boolean }>({});
  const [avatarError, setAvatarError] = useState(false);

  // initial fetch
  useEffect(() => {
    dispatch(fetchCourseDetail(slug));
  }, [slug]);

  // load progress from local storage
  useEffect(() => {
    if (!courseId) return;
    AsyncStorage.getItem(`progress_${courseId}`).then((val) => {
      if (val) {
        const arr = JSON.parse(val);
        setCompletedLessons(arr);
      }
    });
  }, [courseId]);

  // update progress bar
  useEffect(() => {
    if (!courseDetail) return;
    const total = courseDetail.modules.reduce((sum: number, m: any) => sum + m.lessons.length, 0);
    const percent = total > 0 ? Math.round((completedLessons.length / total) * 100) : 0;
    setProgressPercent(percent);
  }, [completedLessons, courseDetail]);

  // toggling enrollment and persist
  const toggleEnroll = async () => {
    if (!courseId || !courseDetail?.title) return;
    if (enrolled) {
      Alert.alert(
        'Unenroll?',
        'You`ll lose your progress!', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes', style: 'destructive', onPress: async () => {
              await ProgressService.clearCourseProgress(courseId);
              setCompletedLessons([]);
              setProgressPercent(0);
              dispatch(toggleCourseEnrollment({ courseId, courseTitle: courseDetail.title }));
            }
          }
        ]);
    } else {
      dispatch(toggleCourseEnrollment({ courseId, courseTitle: courseDetail.title }));
    }
  };

  const toggleLesson = async (lessonId: string) => {
    if (!courseId) return;
    setSyncing(true);

    const updated = completedLessons.includes(lessonId)
      ? completedLessons.filter(id => id !== lessonId)
      : [...completedLessons, lessonId];

    setCompletedLessons(updated);
    await AsyncStorage.setItem(`progress_${courseId}`, JSON.stringify(updated));
    setTimeout(() => setSyncing(false), 500);
  };

  const expandCollapseAll = () => {
    if (!courseDetail) return;
    const updated: { [id: string]: boolean } = {};
    courseDetail.modules.forEach((m: any) => {
      updated[m.id] = !expandAll;
    });
    setExpandedModules(updated);
    setExpandAll(!expandAll);
  };

  const toggleModule = (id: string) => {
      setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (!courseDetail) return;
    
    const defaults: { [id: string]: boolean } = {};
    courseDetail.modules.forEach((mod: any) => { defaults[mod.id] = true; });
    setExpandedModules(defaults);
    setExpandAll(true);
  }, [courseDetail?.modules]);

  if (courseDetailLoading === 'pending') {
    return <LoadingSpinner />;
  }

  if (courseDetailError) {
    return <ErrorMessage message={courseDetailError} onRetry={() => dispatch(fetchCourseDetail(slug))} />;
  }

  if (!courseDetail) {
    return <ErrorMessage message="Course not found" onRetry={() => dispatch(fetchCourseDetail(slug))} />;
  }

  // Calculating duration from includes_section.course_duration
  const durationMins = courseDetail.includes_section?.course_duration || 0;
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  const durationString = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const lessonsCount = courseDetail.includes_section?.lessons_count || 0;

  const tutor = courseDetail.tutors?.[0] || null;
  let avatarUrl = tutor?.avatar_url || '';
  if (avatarUrl.startsWith('http://')) {
    avatarUrl = avatarUrl.replace('http://', 'https://');
  }
  const tutorAvatar = !avatarError && avatarUrl ? avatarUrl : 'https://via.placeholder.com/80x80/cccccc/ffffff?text=No+Image';

  const level = courseDetail.difficulty_level || 'N/A';

  let descriptionHtml = marked.parse(courseDetail.description || '');
  if (typeof descriptionHtml !== 'string') descriptionHtml = String(descriptionHtml);

  const includes = [
    { icon: 'ribbon-outline', label: 'Course Certificate' },
    { icon: 'language-outline', label: 'Language - English' },
    { icon: 'list-outline', label: `${lessonsCount} lessons` },
    { icon: 'time-outline', label: `${durationString} of video` },
    { icon: 'chatbubbles-outline', label: 'Discord community support' },
    { icon: 'albums-outline', label: `${courseDetail.modules?.length || 0} module${courseDetail.modules?.length > 1 ? 's' : ''}` },
    { icon: 'construct-outline', label: `${courseDetail.includes_section?.lab_lesson_count || 0} labs` },
    { icon: 'people-outline', label: 'Community support' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Blue Container */}
      <View style={styles.blueContainer}>
        {/* Progress Bar */}
        {enrolled && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
              Progress: {progressPercent}%
            </Text>
            <View style={{ height: 8, backgroundColor: '#E3F2FD', borderRadius: 4, marginTop: 4 }}>
              <View style={{ width: `${progressPercent}%`, height: 8, backgroundColor: '#4CAF50', borderRadius: 4 }} />
            </View>
          </View>
        )}
        {/* Tags Row */}
        <View style={styles.tagsRow}>
          <View style={styles.typeTag}><Text style={styles.typeTagText}>{courseDetail.plan}</Text></View>
          {courseDetail.categories.map((cat: any) => (
            <View key={cat.id} style={styles.categoryTag}><Text style={styles.categoryTagText}>{cat.name}</Text></View>
          ))}
        </View>
        {/* Title */}
        <Text style={styles.detailTitle}>{courseDetail.title}</Text>
        {/* Level */}
        <Text style={styles.levelText}>Level: <Text style={styles.levelValue}>{level}</Text></Text>
        {/* Excerpt */}
        <Text style={styles.excerpt}>{courseDetail.excerpt || ''}</Text>
        {/* Duration */}
        <Text style={styles.durationText}>Course Duration: <Text style={styles.durationValue}>{durationString}</Text></Text>
        {/* Video */}
        <View style={styles.videoContainer}>
          <TouchableOpacity style={styles.thumbnailContainer} onPress={() => {
            // Always navigate to the video player with the sample video for preview
            navigation.navigate('VideoPlayer', {
              courseId: courseDetail.id,
              lessonId: 'preview',
              isPreview: true,
              videoId: '76979871', // Using sample video ID for preview
              completedLessons: [],
            });
          }}>
            <Image source={{ uri: (courseDetail.thumbnailUrl || '').replace(/^http:\/\//, 'https://') }} style={styles.thumbnail} />
            <View style={styles.playButton}>
              <Ionicons name="play-circle" size={60} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
        {/* Tutor Details */}
        {tutor && (
          <View style={styles.tutorRow}>
            <Image key={tutorAvatar} source={{ uri: tutorAvatar }} style={styles.tutorAvatar} onError={() => setAvatarError(true)} />
            <View style={styles.tutorInfo}>
              <Text style={styles.tutorName}>{tutor.name}</Text>
              <Text style={styles.tutorBio}>{tutor.bio}</Text>
            </View>
          </View>
        )}
      </View>
      {/* Enroll Button */}
      <TouchableOpacity
        style={[styles.enrollButton, enrolled && styles.enrolledButton]}
        onPress={toggleEnroll}
        disabled={courseDetailLoading === 'pending'}
      >
        <Text style={[styles.enrollButtonText, enrolled && styles.enrolledButtonText]}>
          {enrolled ? 'Enrolled (Tap to Unenroll)' : 'Enroll'}
        </Text>
      </TouchableOpacity>
      {/* Course Includes */}
      <View style={styles.includesContainer}>
        <Text style={styles.includesTitle}>Course Includes</Text>
        <View style={styles.includesList}>
          {includes.map((item, idx) => (
            <View key={idx} style={styles.includesItem}>
              <Ionicons name={item.icon} size={18} color="#007AFF" style={{ marginRight: 8 }} />
              <Text style={styles.includesLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
      {/* Description (HTML) */}
      <View style={styles.htmlContainer}>
        <RenderHtml
          contentWidth={width}
          source={{ html: descriptionHtml }}
          baseStyle={{ color: '#333', fontSize: 15, lineHeight: 22 }}
          tagsStyles={{ p: { marginBottom: 8 }, strong: { fontWeight: 'bold' }, li: { marginBottom: 4 } }}
          defaultWebViewProps={{ originWhitelist: ['*'] }}
          enableExperimentalMarginCollapsing={true}
          defaultTextProps={{ selectable: true }}
        />
      </View>
      {/* About the Instructor */}
      {tutor && (
        <View style={styles.instructorCard}>
          <Image key={tutorAvatar} source={{ uri: tutorAvatar }} style={styles.instructorAvatar} onError={() => setAvatarError(true)} />
          <Text style={styles.instructorName}>{tutor.name}</Text>
          <Text style={styles.instructorBio}>{tutor.bio}</Text>
          <Text style={styles.instructorDesc}>{tutor.description}</Text>
        </View>
      )}
      {/* Course Content */}
      <View style={styles.section}>
        <View style={styles.contentHeader}>
          <Text style={styles.sectionTitle}>Course Content</Text>
          <TouchableOpacity style={styles.expandAllBtn} onPress={expandCollapseAll}>
            <Ionicons name={expandAll ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color="#007AFF" />
            <Text style={styles.expandAllText}>{expandAll ? 'Collapse All' : 'Expand All'}</Text>
          </TouchableOpacity>
        </View>
        {courseDetail.modules.map((mod: any) => (
          <View key={mod.id} style={styles.moduleItem}>
            <TouchableOpacity style={styles.moduleHeader} onPress={() => toggleModule(mod.id)}>
              <Text style={styles.moduleTitle}>{mod.title}</Text>
              <Text style={styles.moduleLessonCount}>{mod.lessons.length} lessons</Text>
              <Ionicons name={expandedModules[mod.id] ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color="#007AFF" />
            </TouchableOpacity>
            {expandedModules[mod.id] && (
              <View style={styles.moduleContent}>
                <Text style={styles.moduleContentTitle}>Module Content</Text>
                <FlatList
                  data={mod.lessons}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.lessonItem}
                      onPress={() => navigation.navigate('VideoPlayer', {
                        courseId: courseDetail.id,
                        lessonId: item.id,
                        completedLessons,
                      })}
                      disabled={!enrolled}
                    >
                      <CheckBox
                        checked={completedLessons.includes(item.id)}
                        onPress={() => toggleLesson(item.id)}
                        checkedColor="#4CAF50"
                        containerStyle={{ padding: 0, margin: 0, marginRight: 8 }}
                        disabled={syncing || !enrolled}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.lessonTitle}>{item.title}</Text>
                        <Text style={styles.lessonType}>{item.type}</Text>
                      </View>
                      {completedLessons.includes(item.id) && (
                        <View style={styles.completedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                          <Text style={styles.completedBadgeText}>Completed</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                />
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  blueContainer: {
    backgroundColor: BLUE,
    borderRadius: 18,
    margin: 16,
    padding: 18,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  tagsRow: {
     flexDirection: 'row', 
     alignItems: 'center', 
     marginBottom: 10, 
     flexWrap: 'wrap' 
    },
  typeTag: {
     backgroundColor: '#fff',
      borderRadius: 12, 
      paddingHorizontal: 12, 
      paddingVertical: 4, 
      marginRight: 8 
    },
  typeTagText: { 
    color: BLUE, 
    fontWeight: 'bold', 
    fontSize: 13 
  },
  categoryTag: { 
    backgroundColor: LIGHT_BLUE, 
    borderRadius: 12, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    marginRight: 8, 
    marginBottom: 4 
  },
  categoryTagText: { 
    color: BLUE, 
    fontWeight: '600', 
    fontSize: 13 
  },
  detailTitle: { 
    color: '#fff', 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 8 
  },
  levelText: { 
    color: '#E3F2FD', 
    fontSize: 16, 
    marginBottom: 8 
  },
  levelValue: { 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  excerpt: { 
    color: '#E3F2FD', 
    fontSize: 16, 
    marginBottom: 8 
  },
  durationText: { 
    color: '#E3F2FD', 
    fontSize: 16, 
    marginBottom: 8 
  },
  durationValue: { 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  videoContainer: { 
    marginVertical: 16, 
    borderRadius: 12, 
    overflow: 'hidden', 
    backgroundColor: '#000', 
    height: 220 
  },
  thumbnailContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  thumbnail: { 
    width: '100%', 
    height: '100%' 
  },
  playButton: { 
    position: 'absolute' 
  },
  tutorRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10, 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 10, 
    padding: 10 
  },
  tutorAvatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    marginRight: 14, 
    backgroundColor: '#fff' 
  },
  tutorInfo: { 
    flex: 1 
  },
  tutorName: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginBottom: 2 
  },
  tutorBio: { 
    color: '#E3F2FD', 
    fontSize: 13 
  },
  enrollButton: { 
    backgroundColor: BLUE, 
    marginHorizontal: 32, 
    marginTop: 18, 
    borderRadius: 10, 
    paddingVertical: 14, 
    alignItems: 'center', 
    elevation: 2 
  },
  enrollButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 17 
  },
  htmlContainer: { 
    backgroundColor: '#fff', 
    margin: 16, 
    borderRadius: 12, 
    padding: 16, 
    marginTop: 18 
  },
  section: { 
    marginHorizontal: 16, 
    marginTop: 18, 
    marginBottom: 24 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: BLUE, 
    marginBottom: 10 
  },
  moduleItem: { 
    marginBottom: 12 
  },
  moduleTitle: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginBottom: 4, 
    color: '#333' 
  },
  lessonItem: { 
    paddingLeft: 12, 
    marginBottom: 2, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  lessonTitle: { 
    fontSize: 14, 
    color: '#222' 
  },
  lessonType: { 
    fontSize: 12, 
    color: '#888' 
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 'auto',
  },
  completedBadgeText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  enrolledButton: { 
    backgroundColor: '#4CAF50' 
  },
  enrolledButtonText: { 
    color: '#fff' 
  },
  includesContainer: { 
    backgroundColor: '#fff', 
    margin: 16, 
    borderRadius: 12, 
    padding: 16, 
    marginTop: 18 
  },
  includesTitle: { 
    fontSize: 17, 
    fontWeight: 'bold', 
    color: '#007AFF', 
    marginBottom: 10 
  },
  includesList: { 
    flexDirection: 'row', 
    flexWrap: 'wrap' 
  },
  includesItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginRight: 18, 
    marginBottom: 8 
  },
  includesLabel: { 
    color: '#333', 
    fontSize: 14 
  },
  instructorCard: { 
    backgroundColor: BLUE, 
    borderRadius: 16, 
    margin: 16, 
    padding: 18, 
    alignItems: 'center', 
    marginTop: 8 
  },
  instructorAvatar: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    marginBottom: 10, 
    backgroundColor: '#fff' 
  },
  instructorName: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 18, 
    marginBottom: 4 
  },
  instructorBio: { 
    color: '#E3F2FD', 
    fontSize: 14, 
    marginBottom: 6, 
    textAlign: 'center' 
  },
  instructorDesc: { 
    color: '#E3F2FD', 
    fontSize: 13, 
    textAlign: 'center' 
  },
  contentHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 8 
  },
  expandAllBtn: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  expandAllText: { 
    color: '#007AFF', 
    fontWeight: 'bold', 
    marginLeft: 4 
  },
  moduleHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#F0F4F8', 
    borderRadius: 8, 
    padding: 10, 
    marginBottom: 2 
  },
  moduleLessonCount: { 
    color: '#888', 
    fontSize: 13, 
    marginRight: 8 
  },
  moduleContent: { 
    backgroundColor: '#F8F9FA', 
    borderRadius: 8, 
    padding: 10, 
    marginTop: 2 
  },
  moduleContentTitle: { 
    color: '#007AFF', 
    fontWeight: 'bold', 
    marginBottom: 6 
  },
});

export default CourseDetailScreen; 