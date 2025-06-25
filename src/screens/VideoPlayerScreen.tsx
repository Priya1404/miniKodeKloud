import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { VimeoVideoPlayer } from '../components/VimeoVideoPlayer';
import { VideoDownloadButton } from '../components/VideoDownloadButton';
import { VideoPlayerService } from '../services/VideoPlayerService';
import { fetchCourseDetail } from '../store/courseSlice';
import { CourseDetailLesson } from '../models/CourseDetail';
import { courseRepository } from '../services/CourseRepository';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface VideoPlayerScreenProps {
  navigation: any;
  route: {
    params: {
      lessonId: string;
      courseId: string;
      completedLessons?: string[];
      isPreview?: boolean;
      videoId?: string;
      resumePosition?: number;
    };
  };
}

export const VideoPlayerScreen: React.FC<VideoPlayerScreenProps> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
    const { courseDetail, courses } = useAppSelector((state) => state.courses);
    const { lessonId, courseId, completedLessons: initialCompleted, isPreview, videoId: previewVideoId, resumePosition } = route.params;
    const { selectedCourse } = useAppSelector((state) => state.courses);
  
  const [currentLesson, setCurrentLesson] = useState<(CourseDetailLesson & { videoUrl?: string }) | null>(null);
  const [videoId, setVideoId] = useState<string>(isPreview ? previewVideoId : '');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const safeCompletedLessons = initialCompleted || [];
  const [isCompleted, setIsCompleted] = useState(safeCompletedLessons.includes(lessonId));

  const navigateToNextLesson = useCallback(() => {
    if (!courseDetail) return;
      navigation.navigate('CourseDetail', { slug: courseDetail.slug });
  }, [courseDetail, lessonId, courseId, navigation]);

  useEffect(() => {
    if (isPreview && previewVideoId) {
      setVideoId(previewVideoId);
      setCurrentLesson({ id: 'preview', title: 'Course Preview', type: 'video', position: 0, openAccess: true, videoUrl: '' });
      return;
    }
    if (!courseDetail || courseDetail.id !== courseId) {
      dispatch(fetchCourseDetail(courseId));
    } else {
      let lessonToPlay;
      for (const module of courseDetail.modules) {
        const foundLesson = module.lessons.find((l: any) => l.id === lessonId);
        if (foundLesson) {
          lessonToPlay = foundLesson;
          break;
        }
      }
      if (lessonToPlay) {
        const videoUrl = (lessonToPlay as any).video_url || '';

        console.log('[VideoPlayerScreen] lessonToPlay:', lessonToPlay);
        console.log('[VideoPlayerScreen] videoUrl:', videoUrl);
        const vimeoId = '76979871'; // Using sample video ID since actual videos are not public
        console.log('[VideoPlayerScreen] using sample vimeoId:', vimeoId);

        setCurrentLesson({ ...lessonToPlay, videoUrl });
        setVideoId(vimeoId);
      } else {
        console.error("Lesson not found in course details.");
      }
    }
  }, [courseDetail, courseId, lessonId, dispatch, selectedCourse, isPreview, previewVideoId]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatProgress = (current: number, total: number): string => {
    if (total === 0) return '0%';
    const percentage = Math.round((current / total) * 100);
    return `${percentage}%`;
  };

  const handleProgress = useCallback((position: number, videoDuration: number) => {
    setProgress(position);
    setDuration(videoDuration);
    
    // Save progress
    VideoPlayerService.savePlaybackPosition(lessonId, courseId, position, videoDuration);

    // Check if video is completed (watched 90% or more)
    const watchPercentage = (position / videoDuration) * 100;
    if (watchPercentage >= 90 && !isCompleted) {
      handleVideoComplete();
    }
  }, [isCompleted, lessonId, courseId]);

  const handleVideoComplete = useCallback(async () => {
    if (!currentLesson || isCompleted) return;

    // marking lesson as completed locally and sync with mock API
    try {
      await courseRepository.markLessonAsCompleted(currentLesson.id, courseId);
      setIsCompleted(true);
    } catch (error) {
      console.error('Failed to sync lesson completion with mock API:', error);
    }

    Alert.alert(
      'Lesson Completed!',
      'Great job! You\'ve completed this lesson.',
      [
        {
          text: 'Continue',
          onPress: () => {
            // navigating to next lesson or back to course detail
            navigateToNextLesson();
          },
        },
      ]
    );
  }, [currentLesson, isCompleted, courseId, navigateToNextLesson]);

  const handleError = useCallback((error: string) => {
    Alert.alert(
      'Video Error',
      `Failed to load video: ${error}`,
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  }, [navigation]);

  const handleBackPress = useCallback(() => {
    Alert.alert(
      'Leave Video',
      'Are you sure you want to leave? Your progress will be saved.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  }, [navigation]);

  const handleClose = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('CourseList');
    }
  }, [navigation]);

  if (!currentLesson || !videoId) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Lesson not found or cannot load video.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  console.log('Rendering VimeoVideoPlayer', { videoId, isPreview, lessonId });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Video Player */}
      <View style={styles.videoContainer}>
        {/* Close/Back Button Overlay */}
        <TouchableOpacity style={styles.closeButtonOverlay} onPress={handleClose}>
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>
        <VimeoVideoPlayer
          videoId={videoId}
          lessonId={lessonId}
          courseId={courseId}
          onProgress={handleProgress}
          onComplete={handleVideoComplete}
          onError={handleError}
          autoPlay={true}
          showControls={true}
          resumePosition={resumePosition}
        />
      </View>

      {/* Lesson Info */}
      <View style={styles.lessonInfo}>
        <View style={styles.lessonHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.lessonTitle} numberOfLines={2}>
            {currentLesson?.title || 'Course Preview'}
          </Text>
        </View>

        {/* Download and PIP Buttons */}
        <View style={styles.actionRow}>
          {currentLesson && (
            <VideoDownloadButton
              videoId={videoId}
              lessonId={lessonId}
              courseId={courseId}
              lessonTitle={currentLesson.title}
              onDownloadComplete={() => {}}
              style={styles.downloadButton}
            />
          )}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => Alert.alert('PIP', 'PIP feature coming soon!')}
          >
            <Ionicons name="videocam-outline" size={26} color="#fff" />
            <Text style={styles.iconButtonText}>PIP</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${duration > 0 ? (progress / duration) * 100 : 0}%` },
              ]}
            />
          </View>
          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>{formatTime(progress)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
          <Text style={styles.progressText}>
            {formatProgress(progress, duration)}
          </Text>
        </View>

        {/* Completion Status */}
        {isCompleted && (
          <View style={styles.completionBadge}>
            <Text style={styles.completionText}>✓ Completed</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoContainer: {
    flex: 1,
  },
  lessonInfo: {
    backgroundColor: '#1A1A1A',
    padding: 16,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  lessonTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeText: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  progressText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  completionBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  completionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  iconButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
  },
  closeButtonOverlay: {
    position: 'absolute',
    top: 24,
    left: 16,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
  },
  downloadButton: {
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
}); 