import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import {
  fetchCourses,
  fetchCategories,
  fetchTutors,
  clearCourseFilters,
  setCourses as setCoursesAction,
} from '../store/courseSlice';
import { CourseCard } from '../components/CourseCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Course } from '../models/Course';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { courseRepository } from '../services/CourseRepository';
import FilterBar from '../components/FilterBar';
import { useFocusEffect } from '@react-navigation/native';
import { VideoPlayerService } from '../services/VideoPlayerService';
import { BookmarkService } from '../services/BookmarkService';
import { VideoDownloadService, DownloadInfo } from '../services/VideoDownloadService';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface CourseListScreenProps {
  navigation: any;
}

export const CourseListScreen: React.FC<CourseListScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { courses, pagination, loading, error, filters } = useAppSelector((state) => state.courses);
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const [offlineCourses, setOfflineCourses] = useState<Course[] | null>(null);
  const [bookmarkedCourseIds, setBookmarkedCourseIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isListEnd = pagination.next_page === null;
  const [lastLesson, setLastLesson] = useState<{ course: Course, lessonId: string, lastUpdated: string } | null>(null);
  const [downloadedVideos, setDownloadedVideos] = useState<DownloadInfo[]>([]);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchTutors());
    dispatch(clearCourseFilters());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchCourses({ page: 1, limit: 10, refresh: true }));
  }, [dispatch, filters]);

  useEffect(() => {
    async function findLastLesson() {
        // finding the most recent last viewed lesson from all courses
      let mostRecent: { course: Course, lessonId: string, lastUpdated: string } | null = null;
      for (const course of courses) {
        const playback = await VideoPlayerService.getLastWatchedLesson(course.id);
        if (playback && (!mostRecent || new Date(playback.lastUpdated) > new Date(mostRecent.lastUpdated))) {
          mostRecent = { course, lessonId: playback.lessonId, lastUpdated: playback.lastUpdated };
        }
      }
      setLastLesson(mostRecent);
    }
    if (courses.length > 0) {
      findLastLesson();
    } else {
      setLastLesson(null);
    }
  }, [courses]);

  useEffect(() => {
    loadCourses(); // loading initial data
  }, [isConnected, isInternetReachable]);

  const loadCourses = useCallback(async () => {
    if (!isConnected) {
      // when offline, load from cache
      try {
        const cachedCourses = await courseRepository.getOfflineCourses();
        if (cachedCourses && cachedCourses.length > 0) {
          dispatch(setCoursesAction(cachedCourses));
          setOfflineError(null);
        } else {
          setOfflineError('No courses available offline.');
        }
      } catch (e) {
        setOfflineError('No courses available offline.');
      }
    } else {
      // when online, fetch from API
      setOfflineError(null);
      dispatch(fetchCourses({ page: 1, limit: 10, refresh: true }));
    }
  }, [dispatch, isConnected]);

  const handleLoadMore = () => {
    if (activeTab === 'All' && !isListEnd && loading !== 'pending' && pagination.next_page !== null) {
      dispatch(fetchCourses({ page: pagination.next_page, limit: 10 }));
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadCourses();
    setIsRefreshing(false);
  }, [loadCourses]);

  const handleCoursePress = useCallback((course: Course) => {
    // navigating to course detail screen
    navigation.navigate('CourseDetail', { slug: course.slug });
  }, [navigation]);

  const handleRetry = useCallback(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    async function loadOfflineCoursesList() {
      try {
          // to add a new effect to load offline courses
        const cached = await courseRepository.getLastAccessedOfflineCourse();
        setOfflineCourses(cached);
      } catch (e) {
        console.error('Error loading offline courses:', e);
        setOfflineCourses([]);
      }
    }
    loadOfflineCoursesList();
  }, []);

  const filteredCourses = (() => {
    switch (activeTab) {
      case 'Bookmarked':
        return courses.filter(course => bookmarkedCourseIds.includes(course.id));
      case 'Offline':
        // showing offline courses regardless of connection status
        return offlineCourses || [];
      default:
        return courses;
    }
  })();

  const handleBookmarkToggle = async () => {
    // re-fetching bookmarks after a toggle
    const ids = await BookmarkService.getBookmarkedCourseIds();
    setBookmarkedCourseIds(ids);
  };

  const renderCourseCard = useCallback(({ item }: { item: Course }) => (
    <CourseCard course={item} onPress={handleCoursePress} onBookmarkToggle={handleBookmarkToggle} />
  ), [handleCoursePress]);

  const renderFooter = useCallback(() => {
    // only showing loading spinner for All Courses tab when loading more pages
    if (!loading || pagination.page === 1 || activeTab !== 'All') return null;
    
    return (
      <View style={styles.footerLoader}>
        <LoadingSpinner size="small" />
      </View>
    );
  }, [loading, pagination.page, activeTab]);

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <ErrorMessage 
          message="No courses available at the moment." 
          onRetry={handleRetry}
        />
      </View>
    );
  }, [loading, handleRetry]);

  const renderHeader = useCallback(() => (
    <View style={styles.infoContainer}>
    </View>
  ), []);

  const planOptions = Array.from(new Set(courses.map((c) => c.plan))).filter(Boolean);

  // adding useFocusEffect to reload courses on focus
  useFocusEffect(
    useCallback(() => {
      loadCourses();
    }, [loadCourses])
  );

  // fetching bookmarked courses on focus
  useFocusEffect(
    useCallback(() => {
      async function loadBookmarks() {
        const ids = await BookmarkService.getBookmarkedCourseIds();
        setBookmarkedCourseIds(ids);
      }
      loadBookmarks();
    }, [])
  );

  useEffect(() => {
    async function loadDownloads() {
      const downloads = await VideoDownloadService.getAllDownloads();
      setDownloadedVideos(downloads.filter(d => d.status === 'completed'));
    }
    loadDownloads();
  }, [activeTab]);

  if (loading === 'pending' && courses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (!loading && courses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ErrorMessage message="No courses found for the selected filters." onRetry={handleRetry} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Last viewed lesson quick access */}
      {lastLesson && (
        <View style={styles.lastLessonCard}>
          <Text style={styles.lastLessonTitle}>Continue Last Lesson</Text>
          <Text style={styles.lastLessonCourse}>{lastLesson.course.title}</Text>
          <TouchableOpacity
            style={styles.lastLessonButton}
            onPress={() => {
              navigation.navigate('CourseDetail', { slug: lastLesson.course.slug });
            }}
          >
            <Text style={styles.lastLessonButtonText}>Resume</Text>
          </TouchableOpacity>
        </View>
      )}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>You are offline</Text>
        </View>
      )}
      <FilterBar planOptions={planOptions} />
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'All' && styles.activeTab]}
          onPress={() => setActiveTab('All')}
        >
          <Text style={styles.tabText}>All Courses</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Bookmarked' && styles.activeTab]}
          onPress={() => setActiveTab('Bookmarked')}
        >
          <Text style={styles.tabText}>Bookmarked</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Offline' && styles.activeTab]}
          onPress={() => setActiveTab('Offline')}
        >
          <Text style={styles.tabText}>Offline</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredCourses}
        renderItem={renderCourseCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        onEndReached={activeTab === 'All' ? handleLoadMore : undefined}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
      {activeTab === 'Offline' && downloadedVideos.length > 0 && (
        <View style={{ margin: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Downloaded Videos</Text>
          {downloadedVideos.map((video) => (
            <TouchableOpacity
              key={video.videoId + video.lessonId + video.courseId}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#fff', borderRadius: 8, padding: 10, elevation: 2 }}
              onPress={() => navigation.navigate('VideoPlayer', {
                courseId: video.courseId,
                lessonId: video.lessonId,
                completedLessons: [],
                setCompletedLessons: () => {},
                isOffline: true,
                localPath: video.localPath,
              })}
            >
              <Ionicons name="play-circle" size={36} color="#007AFF" style={{ marginRight: 12 }} />
              <View>
                <Text style={{ fontWeight: '600', fontSize: 15 }}>{video.fileName}</Text>
                <Text style={{ color: '#888', fontSize: 12 }}>{video.createdAt ? new Date(video.createdAt).toLocaleString() : ''}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    marginBottom: 20,
  },
  offlineBanner: {
    backgroundColor: '#FFCC00',
    padding: 8,
    alignItems: 'center',
  },
  offlineBannerText: {
    color: '#333',
    fontWeight: 'bold',
  },
  lastLessonCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  lastLessonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lastLessonCourse: {
    fontSize: 16,
    marginBottom: 16,
  },
  lastLessonButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  lastLessonButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontWeight: '600',
    color: '#333',
  },
}); 