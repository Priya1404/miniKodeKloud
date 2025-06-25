import { ProgressService, LocalProgressData } from '../services/ProgressService';
import { courseApi } from '../api/courseApi';

const mockStorage = {
  set: jest.fn(),
  getString: jest.fn(),
  delete: jest.fn(),
};

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => mockStorage),
}));

jest.mock('../api/courseApi', () => ({
  courseApi: {
    updateLessonProgress: jest.fn(),
  },
}));

describe('ProgressService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.set.mockClear();
    mockStorage.getString.mockClear();
    mockStorage.delete.mockClear();
    
    ProgressService.setStorage(mockStorage as any);
  });

  describe('markLessonCompleted', () => {
    it('should mark lesson as completed and sync with API', async () => {
      const mockApiResponse = {
        lessonId: 'lesson1',
        courseId: 'course1',
        completed: true,
        completedAt: '2024-01-01T00:00:00Z',
        courseProgress: 25,
      };
      
      mockStorage.getString.mockReturnValue('{}');
      (courseApi.updateLessonProgress as jest.Mock).mockResolvedValue(mockApiResponse);
      
      const result = await ProgressService.markLessonCompleted('lesson1', 'course1');
      
      expect(result).toEqual(mockApiResponse);
      expect(courseApi.updateLessonProgress).toHaveBeenCalledWith({
        lessonId: 'lesson1',
        courseId: 'course1',
        completed: true,
      });
      
      expect(mockStorage.set).toHaveBeenCalledTimes(2);
      const progressData = JSON.parse(mockStorage.set.mock.calls[0][1]);
      expect(progressData['course1_lesson1'].completed).toBe(true);
      expect(progressData['course1_lesson1'].synced).toBe(false);
    });
  });

  describe('markLessonIncomplete', () => {
    it('should mark lesson as incomplete and sync with API', async () => {
      const mockApiResponse = {
        lessonId: 'lesson1',
        courseId: 'course1',
        completed: false,
        completedAt: '2024-01-01T00:00:00Z',
        courseProgress: 0,
      };
      
      mockStorage.getString.mockReturnValue('{}');
      (courseApi.updateLessonProgress as jest.Mock).mockResolvedValue(mockApiResponse);
      
      const result = await ProgressService.markLessonIncomplete('lesson1', 'course1');
      
      expect(result).toEqual(mockApiResponse);
      expect(courseApi.updateLessonProgress).toHaveBeenCalledWith({
        lessonId: 'lesson1',
        courseId: 'course1',
        completed: false,
      });
    });
  });

  describe('isLessonCompleted', () => {
    it('should return true for completed lesson', async () => {
      const localProgress: Record<string, LocalProgressData> = {
        'course1_lesson1': {
          lessonId: 'lesson1',
          courseId: 'course1',
          completed: true,
          completedAt: '2024-01-01T00:00:00Z',
          synced: true,
        },
      };
      
      mockStorage.getString.mockReturnValue(JSON.stringify(localProgress));
      
      const result = await ProgressService.isLessonCompleted('lesson1', 'course1');
      
      expect(result).toBe(true);
    });

    it('should return false for incomplete lesson', async () => {
      mockStorage.getString.mockReturnValue('{}');
      
      const result = await ProgressService.isLessonCompleted('lesson1', 'course1');
      
      expect(result).toBe(false);
    });
  });

  describe('getCompletedLessons', () => {
    it('should return completed lesson IDs for a course', async () => {
      const localProgress: Record<string, LocalProgressData> = {
        'course1_lesson1': {
          lessonId: 'lesson1',
          courseId: 'course1',
          completed: true,
          completedAt: '2024-01-01T00:00:00Z',
          synced: true,
        },
        'course1_lesson2': {
          lessonId: 'lesson2',
          courseId: 'course1',
          completed: false,
          completedAt: '2024-01-01T00:00:00Z',
          synced: true,
        },
        'course1_lesson3': {
          lessonId: 'lesson3',
          courseId: 'course1',
          completed: true,
          completedAt: '2024-01-01T00:00:00Z',
          synced: true,
        },
        'course2_lesson1': {
          lessonId: 'lesson1',
          courseId: 'course2',
          completed: true,
          completedAt: '2024-01-01T00:00:00Z',
          synced: true,
        },
      };
      
      mockStorage.getString.mockReturnValue(JSON.stringify(localProgress));
      
      const result = await ProgressService.getCompletedLessons('course1');
      
      expect(result).toEqual(['lesson1', 'lesson3']);
    });
  });

  describe('clearCourseProgress', () => {
    it('should clear all progress data for a course', async () => {
      const localProgress: Record<string, LocalProgressData> = {
        'course1_lesson1': {
          lessonId: 'lesson1',
          courseId: 'course1',
          completed: true,
          completedAt: '2024-01-01T00:00:00Z',
          synced: true,
        },
        'course1_lesson2': {
          lessonId: 'lesson2',
          courseId: 'course1',
          completed: false,
          completedAt: '2024-01-01T00:00:00Z',
          synced: true,
        },
        'course2_lesson1': {
          lessonId: 'lesson1',
          courseId: 'course2',
          completed: true,
          completedAt: '2024-01-01T00:00:00Z',
          synced: true,
        },
      };
      
      mockStorage.getString.mockReturnValue(JSON.stringify(localProgress));
      
      await ProgressService.clearCourseProgress('course1');
      
      const savedData = JSON.parse(mockStorage.set.mock.calls[0][1]);
      expect(savedData['course1_lesson1']).toBeUndefined();
      expect(savedData['course1_lesson2']).toBeUndefined();
      expect(savedData['course2_lesson1']).toBeDefined();
    });
  });
}); 