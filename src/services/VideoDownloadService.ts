import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';

export interface DownloadInfo {
  videoId: string;
  lessonId: string;
  courseId: string;
  fileName: string;
  fileSize: number;
  downloadProgress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  downloadUrl: string;
  localPath?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface DownloadProgress {
  videoId: string;
  lessonId: string;
  courseId: string;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
}

export class VideoDownloadService {
  private static readonly DOWNLOADS_KEY = 'video_downloads';
  private static readonly DOWNLOAD_PROGRESS_KEY = 'download_progress';

  //To get all downloads
  static async getAllDownloads(): Promise<DownloadInfo[]> {
    try {
      const data = await AsyncStorage.getItem(this.DOWNLOADS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting downloads:', error);
      return [];
    }
  }

  // To get download info for a specific video
  static async getDownloadInfo(videoId: string, lessonId: string, courseId: string): Promise<DownloadInfo | null> {
    try {
      const downloads = await this.getAllDownloads();
      return downloads.find(d => d.videoId === videoId && d.lessonId === lessonId && d.courseId === courseId) || null;
    } catch (error) {
      console.error('Error getting download info:', error);
      return null;
    }
  }

  // To check if a video is downloaded
  static async isDownloaded(videoId: string, lessonId: string, courseId: string): Promise<boolean> {
    try {
      const downloadInfo = await this.getDownloadInfo(videoId, lessonId, courseId);
      return downloadInfo?.status === 'completed' || false;
    } catch (error) {
      console.error('Error checking download status:', error);
      return false;
    }
  }

  // To start downloading a video
  static async startDownload(
    videoId: string,
    lessonId: string,
    courseId: string,
    videoUrl: string,
    fileName: string
  ): Promise<DownloadInfo> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to storage to download videos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Storage permission denied');
        }
      }

      const downloadInfo: DownloadInfo = {
        videoId,
        lessonId,
        courseId,
        fileName,
        fileSize: 0,
        downloadProgress: 0,
        status: 'pending',
        downloadUrl: videoUrl,
        createdAt: new Date().toISOString(),
      };

      await this.saveDownloadInfo(downloadInfo);
      await this.performDownload(downloadInfo);

      return downloadInfo;
    } catch (error) {
      console.error('Error starting download:', error);
      throw error;
    }
  }

  // To perform the actual download
  private static async performDownload(downloadInfo: DownloadInfo): Promise<void> {
    try {
      downloadInfo.status = 'downloading';
      await this.saveDownloadInfo(downloadInfo);

      await this.simulateDownload(downloadInfo);

      downloadInfo.status = 'completed';
      downloadInfo.completedAt = new Date().toISOString();
      downloadInfo.downloadProgress = 100;
      downloadInfo.localPath = `file:///storage/emulated/0/Download/${downloadInfo.fileName}`;
      await this.saveDownloadInfo(downloadInfo);

    } catch (error) {
      console.error('Error performing download:', error);
      downloadInfo.status = 'failed';
      downloadInfo.error = error instanceof Error ? error.message : 'Download failed';
      await this.saveDownloadInfo(downloadInfo);
      throw error;
    }
  }

  // To simulate download progress (for demo purposes)
  private static async simulateDownload(downloadInfo: DownloadInfo): Promise<void> {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(async () => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve();
        }
        
        downloadInfo.downloadProgress = Math.min(progress, 100);
        await this.saveDownloadInfo(downloadInfo);
      }, 500);
    });
  }

  // To pause a download
  static async pauseDownload(videoId: string, lessonId: string, courseId: string): Promise<void> {
    try {
      const downloadInfo = await this.getDownloadInfo(videoId, lessonId, courseId);
      if (downloadInfo && downloadInfo.status === 'downloading') {
        downloadInfo.status = 'paused';
        await this.saveDownloadInfo(downloadInfo);
      }
    } catch (error) {
      console.error('Error pausing download:', error);
      throw error;
    }
  }

  // To resume a paused download
  static async resumeDownload(videoId: string, lessonId: string, courseId: string): Promise<void> {
    try {
      const downloadInfo = await this.getDownloadInfo(videoId, lessonId, courseId);
      if (downloadInfo && downloadInfo.status === 'paused') {
        await this.performDownload(downloadInfo);
      }
    } catch (error) {
      console.error('Error resuming download:', error);
      throw error;
    }
  }

  // To cancel a download
  static async cancelDownload(videoId: string, lessonId: string, courseId: string): Promise<void> {
    try {
      const downloads = await this.getAllDownloads();
      const filteredDownloads = downloads.filter(
        d => !(d.videoId === videoId && d.lessonId === lessonId && d.courseId === courseId)
      );
      await AsyncStorage.setItem(this.DOWNLOADS_KEY, JSON.stringify(filteredDownloads));
    } catch (error) {
      console.error('Error canceling download:', error);
      throw error;
    }
  }

  //To delete a downloaded video
  static async deleteDownload(videoId: string, lessonId: string, courseId: string): Promise<void> {
    try {
      const downloads = await this.getAllDownloads();
      const filteredDownloads = downloads.filter(
        d => !(d.videoId === videoId && d.lessonId === lessonId && d.courseId === courseId)
      );
      await AsyncStorage.setItem(this.DOWNLOADS_KEY, JSON.stringify(filteredDownloads));
    } catch (error) {
      console.error('Error deleting download:', error);
      throw error;
    }
  }

  // To get download progress
  static async getDownloadProgress(videoId: string, lessonId: string, courseId: string): Promise<number> {
    try {
      const downloadInfo = await this.getDownloadInfo(videoId, lessonId, courseId);
      return downloadInfo?.downloadProgress || 0;
    } catch (error) {
      console.error('Error getting download progress:', error);
      return 0;
    }
  }

  //To get local video path for offline playback
  static async getLocalVideoPath(videoId: string, lessonId: string, courseId: string): Promise<string | null> {
    try {
      const downloadInfo = await this.getDownloadInfo(videoId, lessonId, courseId);
      return downloadInfo?.status === 'completed' ? downloadInfo.localPath || null : null;
    } catch (error) {
      console.error('Error getting local video path:', error);
      return null;
    }
  }

  // To get total downloaded size
  static async getTotalDownloadedSize(): Promise<number> {
    try {
      const downloads = await this.getAllDownloads();
      return downloads
        .filter(d => d.status === 'completed')
        .reduce((total, d) => total + (d.fileSize || 0), 0);
    } catch (error) {
      console.error('Error getting total downloaded size:', error);
      return 0;
    }
  }

  // To clear all downloads
  static async clearAllDownloads(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.DOWNLOADS_KEY);
      await AsyncStorage.removeItem(this.DOWNLOAD_PROGRESS_KEY);
    } catch (error) {
      console.error('Error clearing downloads:', error);
      throw error;
    }
  }

  // To save download info to storage
  private static async saveDownloadInfo(downloadInfo: DownloadInfo): Promise<void> {
    try {
      const downloads = await this.getAllDownloads();
      const existingIndex = downloads.findIndex(
        d => d.videoId === downloadInfo.videoId && 
             d.lessonId === downloadInfo.lessonId && 
             d.courseId === downloadInfo.courseId
      );

      if (existingIndex >= 0) {
        downloads[existingIndex] = downloadInfo;
      } else {
        downloads.push(downloadInfo);
      }

      await AsyncStorage.setItem(this.DOWNLOADS_KEY, JSON.stringify(downloads));
    } catch (error) {
      console.error('Error saving download info:', error);
      throw error;
    }
  }

  // To get sample video download URL
  static getSampleVideoDownloadUrl(videoId: string): string {
    console.log("VideoId: ", videoId)
    return `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4`;
  }
} 