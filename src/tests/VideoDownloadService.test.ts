import { VideoDownloadService } from '../services/VideoDownloadService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => {
  const originalModule = jest.requireActual('@react-native-async-storage/async-storage');
  return {
    ...originalModule,
    default: mockAsyncStorage,
  };
});

// Mock React Native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
  PermissionsAndroid: {
    request: jest.fn(),
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
    },
  },
}));

describe('VideoDownloadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue(undefined);
  });

  // Mock the simulateDownload private method to resolve immediately
  jest.spyOn(VideoDownloadService, 'simulateDownload').mockResolvedValue();

  describe('getAllDownloads', () => {
    it('should return empty array when no downloads exist', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      const downloads = await VideoDownloadService.getAllDownloads();
      
      expect(downloads).toEqual([]);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('video_downloads');
    });

    it('should return downloads when they exist', async () => {
      const mockDownloads = [
        {
          videoId: '123',
          lessonId: 'lesson1',
          courseId: 'course1',
          fileName: 'test.mp4',
          fileSize: 1024,
          downloadProgress: 50,
          status: 'downloading' as const,
          downloadUrl: 'https://example.com/video.mp4',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ];
      
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockDownloads));
      
      const downloads = await VideoDownloadService.getAllDownloads();
      
      expect(downloads).toEqual(mockDownloads);
    });
  });

  describe('getDownloadInfo', () => {
    it('should return null when download does not exist', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      const downloadInfo = await VideoDownloadService.getDownloadInfo('123', 'lesson1', 'course1');
      
      expect(downloadInfo).toBeNull();
    });

    it('should return download info when it exists', async () => {
      const mockDownloads = [
        {
          videoId: '123',
          lessonId: 'lesson1',
          courseId: 'course1',
          fileName: 'test.mp4',
          fileSize: 1024,
          downloadProgress: 50,
          status: 'downloading' as const,
          downloadUrl: 'https://example.com/video.mp4',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ];
      
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockDownloads));
      
      const downloadInfo = await VideoDownloadService.getDownloadInfo('123', 'lesson1', 'course1');
      
      expect(downloadInfo).toEqual(mockDownloads[0]);
    });
  });

  describe('isDownloaded', () => {
    it('should return false when download does not exist', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      const isDownloaded = await VideoDownloadService.isDownloaded('123', 'lesson1', 'course1');
      
      expect(isDownloaded).toBe(false);
    });

    it('should return true when download is completed', async () => {
      const mockDownloads = [
        {
          videoId: '123',
          lessonId: 'lesson1',
          courseId: 'course1',
          fileName: 'test.mp4',
          fileSize: 1024,
          downloadProgress: 100,
          status: 'completed' as const,
          downloadUrl: 'https://example.com/video.mp4',
          createdAt: '2023-01-01T00:00:00.000Z',
          completedAt: '2023-01-01T00:05:00.000Z',
        },
      ];
      
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockDownloads));
      
      const isDownloaded = await VideoDownloadService.isDownloaded('123', 'lesson1', 'course1');
      
      expect(isDownloaded).toBe(true);
    });
  });

  describe('startDownload', () => {
    it('should create and save download info', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      await VideoDownloadService.startDownload(
        '123',
        'lesson1',
        'course1',
        'https://example.com/video.mp4',
        'test.mp4'
      );
      
      const firstCall = AsyncStorage.setItem.mock.calls[0];
      const downloadInfo = JSON.parse(firstCall[1])[0];

      expect(downloadInfo).toMatchObject({
        videoId: '123',
        lessonId: 'lesson1',
        courseId: 'course1',
        fileName: 'test.mp4',
        downloadUrl: 'https://example.com/video.mp4',
        status: 'pending',
        downloadProgress: 0,
      });
    });
  });

  describe('getSampleVideoDownloadUrl', () => {
    it('should return sample video URL', () => {
      const url = VideoDownloadService.getSampleVideoDownloadUrl('76979871');
      
      expect(url).toBe('https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4');
    });
  });

  describe('getDownloadProgress', () => {
    it('should return 0 when download does not exist', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      const progress = await VideoDownloadService.getDownloadProgress('123', 'lesson1', 'course1');
      
      expect(progress).toBe(0);
    });

    it('should return download progress when download exists', async () => {
      const mockDownloads = [
        {
          videoId: '123',
          lessonId: 'lesson1',
          courseId: 'course1',
          fileName: 'test.mp4',
          fileSize: 1024,
          downloadProgress: 75,
          status: 'downloading' as const,
          downloadUrl: 'https://example.com/video.mp4',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ];
      
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockDownloads));
      
      const progress = await VideoDownloadService.getDownloadProgress('123', 'lesson1', 'course1');
      
      expect(progress).toBe(75);
    });
  });

  describe('getTotalDownloadedSize', () => {
    it('should return 0 when no completed downloads exist', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      const totalSize = await VideoDownloadService.getTotalDownloadedSize();
      
      expect(totalSize).toBe(0);
    });
  });
}); 