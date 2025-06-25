import { configureStore } from '@reduxjs/toolkit';
import courseReducer, {
  fetchCourses,
  clearError,
  setSelectedCourse,
  updateCourseProgress,
} from '../store/courseSlice';

const mockCourse = {
  id: '1',
  slug: 'test-course',
  title: 'Test Course',
  description: 'Test Description',
  thumbnail_url: 'https://res.cloudinary.com/kodekloud/image/upload/v1749702217/Docker_Crash_tpsqdf.png',
  difficulty_level: 'Beginner',
  plan: 'Free',
  categories: [{ id: 'cat1', name: 'Category 1' }],
  tutors: [{ id: 't1', name: 'Tutor 1', bio: 'Bio', description: 'Desc', avatarUrl: 'https://res.cloudinary.com/kodekloud/image/upload/v1721047734/trainer-profile/Trainer-Mumshad.png' }],
  progress: 0,
  isEnrolled: false,
  createdAt: '2023-01-01',
  popularity: 1,
  thumbnail_video_url: null,
  lessons: [
    {
      id: '1',
      title: 'Test Lesson',
      duration: 15,
      videoUrl: 'https://vimeo.com/123456',
      isCompleted: false,
      order: 1,
    },
  ],
};

describe('courseSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        courses: courseReducer,
      },
    });
  });

  describe('reducers', () => {
    it('should handle initial state', () => {
      const state = store.getState().courses;
      expect(state.courses).toEqual([]);
      expect(state.selectedCourse).toBeNull();
      expect(state.loading).toBe('idle');
      expect(state.error).toBeNull();
    });

    it('should handle clearError', () => {
      const initialState = {
        courses: [],
        selectedCourse: null,
        loading: 'idle' as 'idle',
        error: 'Test error',
        pagination: { page: 1, limit: 10, total_count: 0, next_page: null },
        filters: { page: 1, limit: 10 },
        categories: [],
        categoriesLoading: 'idle' as 'idle',
        categoriesError: null,
        tutors: [],
        tutorsLoading: 'idle' as 'idle',
        tutorsError: null,
        learningPaths: [],
        learningPathsLoading: 'idle' as 'idle',
        learningPathsError: null,
        courseDetail: null,
        courseDetailLoading: 'idle' as 'idle',
        courseDetailError: null,
        progressLoading: false,
        progressError: null,
        courseProgress: {},
      };

      const newState = courseReducer(initialState, clearError());
      expect(newState.error).toBeNull();
    });

    it('should handle setSelectedCourse', () => {
      const initialState = {
        courses: [],
        selectedCourse: null,
        loading: 'idle' as 'idle',
        error: null,
        pagination: { page: 1, limit: 10, total_count: 0, next_page: null },
        filters: { page: 1, limit: 10 },
        categories: [],
        categoriesLoading: 'idle' as 'idle',
        categoriesError: null,
        tutors: [],
        tutorsLoading: 'idle' as 'idle',
        tutorsError: null,
        learningPaths: [],
        learningPathsLoading: 'idle' as 'idle',
        learningPathsError: null,
        courseDetail: null,
        courseDetailLoading: 'idle' as 'idle',
        courseDetailError: null,
        progressLoading: false,
        progressError: null,
        courseProgress: {},
      };

      const newState = courseReducer(initialState, setSelectedCourse(mockCourse));
      expect(newState.selectedCourse).toEqual(mockCourse);
    });

    it('should handle updateCourseProgress', () => {
      const initialState = {
        courses: [mockCourse],
        selectedCourse: mockCourse,
        loading: 'idle' as 'idle',
        error: null,
        pagination: { page: 1, limit: 10, total_count: 1, next_page: null },
        filters: { page: 1, limit: 10 },
        categories: [],
        categoriesLoading: 'idle' as 'idle',
        categoriesError: null,
        tutors: [],
        tutorsLoading: 'idle' as 'idle',
        tutorsError: null,
        learningPaths: [],
        learningPathsLoading: 'idle' as 'idle',
        learningPathsError: null,
        courseDetail: null,
        courseDetailLoading: 'idle' as 'idle',
        courseDetailError: null,
        progressLoading: false,
        progressError: null,
        courseProgress: {},
      };

      const newState = courseReducer(initialState, updateCourseProgress({ courseId: '1', progress: 50 }));
      expect(newState.selectedCourse?.progress).toBe(50);
      expect(newState.courses[0].progress).toBe(50);
    });
  });

  describe('async thunks', () => {
    it('should handle fetchCourses.fulfilled for first page', () => {
      const initialState = {
        courses: [],
        selectedCourse: null,
        loading: 'pending' as 'pending',
        error: null,
        pagination: { page: 1, limit: 10, total_count: 0, next_page: null },
        filters: { page: 1, limit: 10 },
        categories: [],
        categoriesLoading: 'idle' as 'idle',
        categoriesError: null,
        tutors: [],
        tutorsLoading: 'idle' as 'idle',
        tutorsError: null,
        learningPaths: [],
        learningPathsLoading: 'idle' as 'idle',
        learningPathsError: null,
        courseDetail: null,
        courseDetailLoading: 'idle' as 'idle',
        courseDetailError: null,
        progressLoading: false,
        progressError: null,
        courseProgress: {},
      };

      const mockResponse = {
        courses: [mockCourse],
        metadata: { page: 1, limit: 10, total_count: 1, next_page: null },
      };

      const newState = courseReducer(initialState, fetchCourses.fulfilled(mockResponse, 'requestId', { page: 1, limit: 10 }));
      expect(newState.loading).toBe('succeeded');
      expect(newState.courses).toEqual([mockCourse]);
      expect(newState.pagination.total_count).toBe(1);
      expect(newState.pagination.page).toBe(1);
      expect(newState.pagination.limit).toBe(10);
      expect(newState.pagination.next_page).toBe(null);
    });
  });
}); 