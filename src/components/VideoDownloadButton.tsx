import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { VideoDownloadService, DownloadInfo } from '../services/VideoDownloadService';

interface VideoDownloadButtonProps {
  videoId: string;
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  onDownloadComplete?: () => void;
  style?: any;
}

export const VideoDownloadButton: React.FC<VideoDownloadButtonProps> = ({
  videoId,
  lessonId,
  courseId,
  lessonTitle,
  onDownloadComplete,
  style,
}) => {
  const [downloadInfo, setDownloadInfo] = useState<DownloadInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDownloadInfo();
  }, [videoId, lessonId, courseId]);

  const loadDownloadInfo = async () => {
    try {
      const info = await VideoDownloadService.getDownloadInfo(videoId, lessonId, courseId);
      setDownloadInfo(info);
    } catch (error) {
      console.error('Error loading download info:', error);
    }
  };

  const handleDownload = async () => {
    if (downloadInfo?.status === 'downloading') {
      Alert.alert(
        'Download in Progress',
        'This video is already being downloaded. Would you like to pause it?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pause',
            onPress: async () => {
              try {
                await VideoDownloadService.pauseDownload(videoId, lessonId, courseId);
                await loadDownloadInfo();
              } catch (error) {
                Alert.alert('Error', 'Failed to pause download');
              }
            },
          },
        ]
      );
      return;
    }

    if (downloadInfo?.status === 'paused') {
      Alert.alert(
        'Resume Download',
        'Would you like to resume the paused download?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Resume',
            onPress: async () => {
              try {
                setIsLoading(true);
                await VideoDownloadService.resumeDownload(videoId, lessonId, courseId);
                await loadDownloadInfo();
                onDownloadComplete?.();
              } catch (error) {
                Alert.alert('Error', 'Failed to resume download');
              } finally {
                setIsLoading(false);
              }
            },
          },
        ]
      );
      return;
    }

    if (downloadInfo?.status === 'completed') {
      Alert.alert(
        'Video Downloaded',
        'This video is already downloaded. Would you like to delete it?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await VideoDownloadService.deleteDownload(videoId, lessonId, courseId);
                await loadDownloadInfo();
              } catch (error) {
                Alert.alert('Error', 'Failed to delete download');
              }
            },
          },
        ]
      );
      return;
    }

    // Start new download
    Alert.alert(
      'Download Video',
      `Download "${lessonTitle}" for offline viewing?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            try {
              setIsLoading(true);
              const fileName = `${lessonTitle.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
              const downloadUrl = VideoDownloadService.getSampleVideoDownloadUrl(videoId);
              
              await VideoDownloadService.startDownload(
                videoId,
                lessonId,
                courseId,
                downloadUrl,
                fileName
              );
              
              await loadDownloadInfo();
              onDownloadComplete?.();
              
              Alert.alert('Success', 'Video download completed!');
            } catch (error) {
              Alert.alert('Error', 'Failed to download video');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <View style={styles.buttonContent}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.buttonText}>Downloading...</Text>
        </View>
      );
    }

    if (downloadInfo?.status === 'downloading') {
      return (
        <View style={styles.buttonContent}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.buttonText}>{`${Math.round(downloadInfo.downloadProgress)}%`}</Text>
        </View>
      );
    }

    if (downloadInfo?.status === 'paused') {
      return (
        <View style={styles.buttonContent}>
          <Ionicons name="play" size={20} color="#fff" />
          <Text style={styles.buttonText}>Resume</Text>
        </View>
      );
    }

    if (downloadInfo?.status === 'completed') {
      return (
        <View style={styles.buttonContent}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.buttonText}>Downloaded</Text>
        </View>
      );
    }

    if (downloadInfo?.status === 'failed') {
      return (
        <View style={styles.buttonContent}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.buttonText}>Retry</Text>
        </View>
      );
    }

    return (
      <View style={styles.buttonContent}>
        <Ionicons name="download-outline" size={20} color="#fff" />
        <Text style={styles.buttonText}>Download</Text>
      </View>
    );
  };

  const getButtonStyle = () => {
    if (downloadInfo?.status === 'completed') {
      return [styles.button, styles.completedButton, style];
    }
    if (downloadInfo?.status === 'downloading' || isLoading) {
      return [styles.button, styles.downloadingButton, style];
    }
    if (downloadInfo?.status === 'failed') {
      return [styles.button, styles.failedButton, style];
    }
    return [styles.button, style];
  };

  return (
    <TouchableOpacity style={getButtonStyle()} onPress={handleDownload} disabled={isLoading}>
      {getButtonContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    minWidth: 120,
  },
  completedButton: {
    backgroundColor: '#34C759',
  },
  downloadingButton: {
    backgroundColor: '#FF9500',
  },
  failedButton: {
    backgroundColor: '#FF3B30',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 