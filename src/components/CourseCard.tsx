import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Course } from '../models/Course';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchCourseDetail } from '../api/courseApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { BookmarkService } from '../services/BookmarkService';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

interface CourseCardProps {
  course: Course;
  onPress: (course: Course) => void;
  onBookmarkToggle?: () => void;
}

const {width} = Dimensions.get('window');
const cardWidth = (width - 48) / 2; //putting 2 columns with margins

export const CourseCard: React.FC<CourseCardProps> = ({ course, onPress, onBookmarkToggle }) => {
  const [bookmarked, setBookmarked] = React.useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [progressPercent, setProgressPercent] = useState(0);
  const [imageError, setImageError] = useState(false);
  const isFocused = useIsFocused();
  useEffect(() => {
    let isMounted = true;
    const loadProgress = async () => {
      try {
        const totalLessonsKey = `course_total_lessons_${course.id}`;
        let total = 0;

        const cachedTotal = await AsyncStorage.getItem(totalLessonsKey);

        if (cachedTotal) {
          total = JSON.parse(cachedTotal);
        } else {
          const detail = await fetchCourseDetail(course.slug);
          if (isMounted && detail && detail.modules) {
            total = detail.modules.reduce((sum: number, m: any) => sum + (m.lessons ? m.lessons.length : 0), 0);
            //caching total lesson count
            if (total > 0) {
              await AsyncStorage.setItem(totalLessonsKey, JSON.stringify(total));
            }
          }
        }

        if (!isMounted || total === 0) {
          return;
        }
        
        const val = await AsyncStorage.getItem(`progress_${course.id}`);
        
        if (val) {
          const completed = JSON.parse(val);
          setProgressPercent(Math.round((completed.length / total) * 100));
        } else {
          setProgressPercent(0);
        }
      } catch (error) {
        console.error('Failed to load progress for course card:', error);
        setProgressPercent(0);
      }
    };
    if (isFocused) {
      loadProgress();
    }
    return () => { isMounted = false;};
  }, [course.id, course.slug, isFocused]);

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      const isBookmarked = await BookmarkService.isBookmarked(course.id);
      setBookmarked(isBookmarked);
    };
    if (isFocused) {
      checkBookmarkStatus();
    }
  }, [isFocused, course.id]);

  const handleBookmarkToggle = async () => {
    const action = bookmarked ? 'remove' : 'add';

    if (action === 'remove') {
      Alert.alert(
        'Remove Bookmark',
        'Are you sure you want to remove this course from your bookmarks?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            onPress: async () => {
              await BookmarkService.removeBookmark(course.id);
              setBookmarked(false);
              onBookmarkToggle?.();
            },
            style: 'destructive',
          },
        ]
      );
    } else {
      await BookmarkService.addBookmark(course.id);
      setBookmarked(true);
      onBookmarkToggle?.();
    }
  };

  const tutorName = Array.isArray(course.tutors) && course.tutors.length > 0 ? course.tutors[0].name : '';

  // extracting Vimeo video ID from URL
  function extractVimeoId(url: string): string | null {
    if (!url) return null;
    const patterns = [
      /vimeo\.com\/(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/,
      /vimeo\.com\/groups\/.*\/videos\/(\d+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  const videoUrl = course.thumbnail_video_url ? course.thumbnail_video_url.replace(/^http:\/\//, 'https://') : null;
  // NOTE: Using a public Vimeo video for now, as course video URLs are not public.
  // To use the real video, uncomment the line below and remove the sample ID.
  // const videoId = videoUrl ? extractVimeoId(videoUrl) : null;
  const sampleVimeoId = '76979871';
  const videoId = sampleVimeoId;

  const thumbnail = (() => {
    const url = (course.thumbnail_url || '').replace(/^http:\/\//, 'https://');
    if (url && url.trim() !== '') {
      return url;
    }
    return 'https://via.placeholder.com/300x200/cccccc/ffffff?text=No+Image';
  })();

  // playing overlay button
  const renderPlayOverlay = () => {
    const firstLessonId = Array.isArray(course.lessons) && course.lessons.length > 0 ? course.lessons[0].id : null;
    const completedLessons: string[] = [];
    const handlePlayPress = async () => {
      let lessonId = firstLessonId;
      if (!lessonId) {
        try {
          const detail = await fetchCourseDetail(course.slug);
          const firstModule = detail.modules && detail.modules.length > 0 ? detail.modules[0] : null;
          const firstLesson = firstModule && firstModule.lessons && firstModule.lessons.length > 0 ? firstModule.lessons[0] : null;
          lessonId = firstLesson ? firstLesson.id : null;
        } catch (e) {
          Alert.alert('Error', 'Could not load course details.');
          return;
        }
      }
      if (lessonId) {
        navigation.navigate('VideoPlayer', { courseId: course.id, lessonId, completedLessons });
      } else {
        // If no lessons, play preview video
        if (course.thumbnail_video_url && course.thumbnail_video_url.trim() !== '') {
          navigation.navigate('VideoPlayer', {
            courseId: course.id,
            lessonId: 'preview',
            isPreview: true,
            videoId: '76979871', // Using sample video ID since actual videos are not public
            completedLessons,
          });
        } else {
          Alert.alert('No Preview', 'No preview video available for this course.');
        }
      }
    };
    return (
      <TouchableOpacity
        style={styles.playOverlay}
        onPress={handlePlayPress}
        activeOpacity={0.7}
      >
        <Ionicons name="play-circle" size={48} color="#fff" style={{ opacity: 0.85 }} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {/* Completion badge */}
        {progressPercent === 100 && (
          <View style={styles.completionBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.completionBadgeText}>Completed</Text>
          </View>
        )}
        {/* Progress badge */}
        {progressPercent > 0 && progressPercent < 100 && (
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{progressPercent}%</Text>
          </View>
        )}
        {/* Always show the thumbnail image */}
        <Image
          source={{ uri: imageError ? 'https://via.placeholder.com/300x200/cccccc/ffffff?text=No+Image' : thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
        {/* Show play overlay only if video is available */}
        {videoId && renderPlayOverlay()}
        {/* Bookmark button */}
        <TouchableOpacity style={styles.bookmarkButton} onPress={handleBookmarkToggle}>
          <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={bookmarked ? '#007AFF' : '#fff'} />
        </TouchableOpacity>
        {/* Plan tag (Free, Standard, etc) */}
        {course.plan && (
          <View style={styles.planTag}>
            <Text style={styles.planTagText}>{course.plan}</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        {/* Course name */}
        <Text style={styles.title} numberOfLines={2}>{course.title}</Text>
        {/* Tutor row */}
        <View style={styles.rowBetween}>
          <Text style={styles.labelGrey}>Tutor</Text>
          <View style={styles.tutorNameContainer}>
            <Text style={styles.valueBlack} numberOfLines={1} ellipsizeMode="tail">{tutorName}</Text>
          </View>
        </View>
        {/* Level row */}
        <View style={styles.rowBetween}>
          <Text style={styles.labelGrey}>Level</Text>
          <Text style={styles.valueBlack}>{course.difficulty_level || ''}</Text>
        </View>
        {/* View Course button */}
        <TouchableOpacity style={styles.viewButton} onPress={() => onPress(course)}>
          <Text style={styles.viewButtonText}>View Course</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width:  cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
    lineHeight: 18,
  },
  bookmarkButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    padding: 4,
    zIndex: 2,
  },
  planTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 2,
  },
  planTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  labelGrey: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  valueBlack: {
    color: '#111',
    fontSize: 13,
    fontWeight: '600',
  },
  viewButton: {
    marginTop: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tutorNameContainer: {
    marginLeft: 8,
    flex: 1,
    maxWidth: '65%',
    alignItems: 'flex-end',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    zIndex: 2,
  },
  progressBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 2,
  },
  progressBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  completionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  completionBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
}); 