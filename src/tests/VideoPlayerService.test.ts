const mockStorage = {
  set: jest.fn(),
  getString: jest.fn(),
  delete: jest.fn(),
};

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => mockStorage),
}));

import { VideoPlayerService, PlaybackPosition } from '../services/VideoPlayerService';


describe('VideoPlayerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.set.mockClear();
    mockStorage.getString.mockClear();
    mockStorage.delete.mockClear();
    
    VideoPlayerService.setStorage(mockStorage as any);
  });

  describe('savePlaybackPosition', () => {
    it('should save playback position', async () => {
      mockStorage.getString.mockReturnValue('{}');
      
      await VideoPlayerService.savePlaybackPosition('lesson1', 'course1', 120, 600);
      
      expect(mockStorage.set).toHaveBeenCalledWith(
        'video_playback_positions',
        expect.stringContaining('"lessonId":"lesson1"')
      );
    });

    it('should update existing position', async () => {
      const existingPositions = {
        'course1_lesson1': {
          lessonId: 'lesson1',
          courseId: 'course1',
          position: 60,
          duration: 600,
          lastUpdated: '2024-01-01T00:00:00Z',
        },
      };
      
      mockStorage.getString.mockReturnValue(JSON.stringify(existingPositions));
      
      await VideoPlayerService.savePlaybackPosition('lesson1', 'course1', 180, 600);
      
      const savedData = JSON.parse(mockStorage.set.mock.calls[0][1]);
      expect(savedData.course1_lesson1.position).toBe(180);
    });
  });

  describe('getPlaybackPosition', () => {
    it('should return null when no position exists', async () => {
      mockStorage.getString.mockReturnValue('{}');
      
      const position = await VideoPlayerService.getPlaybackPosition('lesson1', 'course1');
      
      expect(position).toBeNull();
    });

    it('should return saved position', async () => {
      const savedPosition: PlaybackPosition = {
        lessonId: 'lesson1',
        courseId: 'course1',
        position: 120,
        duration: 600,
        lastUpdated: '2024-01-01T00:00:00Z',
      };
      
      const positions = {
        'course1_lesson1': savedPosition,
      };
      
      mockStorage.getString.mockReturnValue(JSON.stringify(positions));
      
      const position = await VideoPlayerService.getPlaybackPosition('lesson1', 'course1');
      
      expect(position).toEqual(savedPosition);
    });
  });

  describe('getCoursePlaybackPositions', () => {
    it('should return all positions for a course', async () => {
      const positions = {
        'course1_lesson1': {
          lessonId: 'lesson1',
          courseId: 'course1',
          position: 120,
          duration: 600,
          lastUpdated: '2024-01-01T00:00:00Z',
        },
        'course1_lesson2': {
          lessonId: 'lesson2',
          courseId: 'course1',
          position: 180,
          duration: 600,
          lastUpdated: '2024-01-01T00:00:00Z',
        },
        'course2_lesson1': {
          lessonId: 'lesson1',
          courseId: 'course2',
          position: 90,
          duration: 600,
          lastUpdated: '2024-01-01T00:00:00Z',
        },
      };
      
      mockStorage.getString.mockReturnValue(JSON.stringify(positions));
      
      const coursePositions = await VideoPlayerService.getCoursePlaybackPositions('course1');
      
      expect(coursePositions).toHaveLength(2);
      expect(coursePositions[0].courseId).toBe('course1');
      expect(coursePositions[1].courseId).toBe('course1');
    });
  });

  describe('clearPlaybackPosition', () => {
    it('should clear specific lesson position', async () => {
      const positions = {
        'course1_lesson1': {
          lessonId: 'lesson1',
          courseId: 'course1',
          position: 120,
          duration: 600,
          lastUpdated: '2024-01-01T00:00:00Z',
        },
        'course1_lesson2': {
          lessonId: 'lesson2',
          courseId: 'course1',
          position: 180,
          duration: 600,
          lastUpdated: '2024-01-01T00:00:00Z',
        },
      };
      
      mockStorage.getString.mockReturnValue(JSON.stringify(positions));
      
      await VideoPlayerService.clearPlaybackPosition('lesson1', 'course1');
      
      const savedData = JSON.parse(mockStorage.set.mock.calls[0][1]);
      expect(savedData.course1_lesson1).toBeUndefined();
      expect(savedData.course1_lesson2).toBeDefined();
    });
  });

  describe('clearCoursePlaybackPositions', () => {
    it('should clear all positions for a course', async () => {
      const positions = {
        'course1_lesson1': {
          lessonId: 'lesson1',
          courseId: 'course1',
          position: 120,
          duration: 600,
          lastUpdated: '2024-01-01T00:00:00Z',
        },
        'course1_lesson2': {
          lessonId: 'lesson2',
          courseId: 'course1',
          position: 180,
          duration: 600,
          lastUpdated: '2024-01-01T00:00:00Z',
        },
        'course2_lesson1': {
          lessonId: 'lesson1',
          courseId: 'course2',
          position: 90,
          duration: 600,
          lastUpdated: '2024-01-01T00:00:00Z',
        },
      };
      
      mockStorage.getString.mockReturnValue(JSON.stringify(positions));
      
      await VideoPlayerService.clearCoursePlaybackPositions('course1');
      
      const savedData = JSON.parse(mockStorage.set.mock.calls[0][1]);
      expect(savedData.course1_lesson1).toBeUndefined();
      expect(savedData.course1_lesson2).toBeUndefined();
      expect(savedData.course2_lesson1).toBeDefined();
    });
  });

  describe('getCourseWatchTime', () => {
    it('should calculate total watch time for a course', async () => {
      const positions = {
        'course1_lesson1': {
          lessonId: 'lesson1',
          courseId: 'course1',
          position: 120,
          duration: 600,
          lastUpdated: '2024-01-01T00:00:00Z',
        },
        'course1_lesson2': {
          lessonId: 'lesson2',
          courseId: 'course1',
          position: 180,
          duration: 600,
          lastUpdated: '2024-01-01T00:00:00Z',
        },
      };
      
      mockStorage.getString.mockReturnValue(JSON.stringify(positions));
      
      const watchTime = await VideoPlayerService.getCourseWatchTime('course1');
      
      expect(watchTime).toBe(300); // 120 + 180
    });
  });

  describe('hasWatchedLesson', () => {
    it('should return true when watched more than 90%', async () => {
      const position: PlaybackPosition = {
        lessonId: 'lesson1',
        courseId: 'course1',
        position: 540, // 90% of 600
        duration: 600,
        lastUpdated: '2024-01-01T00:00:00Z',
      };
      
      const positions = {
        'course1_lesson1': position,
      };
      
      mockStorage.getString.mockReturnValue(JSON.stringify(positions));
      
      const hasWatched = await VideoPlayerService.hasWatchedLesson('lesson1', 'course1');
      
      expect(hasWatched).toBe(true);
    });
  });

  describe('getLastWatchedLesson', () => {
    it('should return the most recently watched lesson', async () => {
      const positions = {
        'course1_lesson1': {
          lessonId: 'lesson1',
          courseId: 'course1',
          position: 120,
          duration: 600,
          lastUpdated: '2024-01-01T00:00:00Z',
        },
        'course1_lesson2': {
          lessonId: 'lesson2',
          courseId: 'course1',
          position: 180,
          duration: 600,
          lastUpdated: '2024-01-02T00:00:00Z', // More recent
        },
      };
      
      mockStorage.getString.mockReturnValue(JSON.stringify(positions));
      
      const lastWatched = await VideoPlayerService.getLastWatchedLesson('course1');
      
      expect(lastWatched?.lessonId).toBe('lesson2');
    });
  });
}); 