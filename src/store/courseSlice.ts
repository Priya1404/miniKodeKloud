import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Course, CourseListResponse, CourseFilters } from '../models/Course';
import { courseRepository } from '../services/CourseRepository';
import { ProgressService } from '../services/ProgressService';
import { ProgressResponse, CourseProgressResponse } from '../api/courseApi';
import { RootState } from './index';
import { Category } from '../models/Category';
import { Tutor } from '../models/Tutor';
import { LearningPath } from '../models/LearningPath';
import { CourseDetail } from '../models/CourseDetail';

// Async thunks
export const fetchCourses = createAsyncThunk<
  CourseListResponse,
  { page: number; limit: number; refresh?: boolean },
  { state: RootState }
>('courses/fetchCourses', async ({ page, limit }, { getState }) => {
  const { filters } = getState().courses;
  const response = await courseRepository.getCourses({ page, limit, ...filters });
  return response;
});

export const fetchCourseById = createAsyncThunk(
  'courses/fetchCourseById',
  async (id: string, { rejectWithValue }) => {
    try {
      const course = await courseRepository.getCourseById(id);
      return course;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch course');
    }
  }
);

export const refreshCourses = createAsyncThunk(
  'courses/refreshCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await courseRepository.refreshCourses();
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to refresh courses');
    }
  }
);

export const toggleCourseEnrollment = createAsyncThunk(
  'courses/toggleEnrollment',
  async ({ courseId, courseTitle }: { courseId: string, courseTitle: string }, { rejectWithValue }) => {
    try {
      await courseRepository.toggleEnrollment(courseId, courseTitle);
      return courseId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to toggle enrollment');
    }
  }
);

export const updateLessonProgress = createAsyncThunk(
  'courses/updateLessonProgress',
  async ({ lessonId, courseId, completed }: { lessonId: string; courseId: string; completed: boolean }) => {
    try {
      let response: ProgressResponse;
      
      if (completed) {
        response = await ProgressService.markLessonCompleted(lessonId, courseId);
      } else {
        response = await ProgressService.markLessonIncomplete(lessonId, courseId);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
);

export const syncPendingProgress = createAsyncThunk(
  'courses/syncPendingProgress',
  async () => {
    try {
      await ProgressService.syncPendingProgress();
      return true;
    } catch (error) {
      throw error;
    }
  }
);

export const initializeProgressData = createAsyncThunk(
  'courses/initializeProgressData',
  async (_, { getState }) => {
    try {
      // Load all local progress data
      const localProgress = ProgressService.getAllLocalProgress();
      
      // Group progress by course
      const courseProgressMap: Record<string, { completedLessons: string[], progress: number }> = {};
      
      Object.values(localProgress).forEach(progress => {
        if (!courseProgressMap[progress.courseId]) {
          courseProgressMap[progress.courseId] = { completedLessons: [], progress: 0 };
        }
        
        if (progress.completed) {
          courseProgressMap[progress.courseId].completedLessons.push(progress.lessonId);
        }
      });
      
      // Get current state to access course data for progress calculation
      const state = getState() as any;
      const courses = state.courses.courses;
      const selectedCourse = state.courses.selectedCourse;
      
      // Calculate progress percentages
      Object.keys(courseProgressMap).forEach(courseId => {
        const courseData = courseProgressMap[courseId];
        
        // Find course to get total lessons count
        const course = courses.find((c: any) => c.id === courseId) || selectedCourse;
        if (course && course.lessons) {
          const totalLessons = course.lessons.length;
          courseData.progress = totalLessons > 0 ? Math.round((courseData.completedLessons.length / totalLessons) * 100) : 0;
        }
      });
      
      return courseProgressMap;
    } catch (error) {
      console.error('Error initializing progress data:', error);
      return {};
    }
  }
);

export const fetchCourseDetails = createAsyncThunk('courses/fetchCourseDetails', async (courseId: string) => {
  const response = await courseRepository.getCourseDetails(courseId);
  return response;
});

export const fetchCategories = createAsyncThunk('courses/fetchCategories', async () => {
  const response = await courseRepository.getCourseCategories();
  return response;
});

export const fetchTutors = createAsyncThunk('courses/fetchTutors', async () => {
  const response = await courseRepository.getTutors();
  return response;
});

export const fetchLearningPaths = createAsyncThunk('courses/fetchLearningPaths', async () => {
  const response = await courseRepository.getLearningPaths();
  return response;
});

export const fetchCourseDetail = createAsyncThunk<CourseDetail, string, { state: RootState }>(
  'courses/fetchCourseDetail',
  async (slug, { rejectWithValue }) => {
    try {
      const detail = await courseRepository.getCourseDetail(slug);
      return detail;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch course detail');
    }
  }
);

// State interface
interface CourseState {
  courses: Course[];
  selectedCourse: Course | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total_count: number;
    next_page: number | null;
  };
  filters: Partial<CourseFilters>;
  categories: Category[];
  categoriesLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  categoriesError: string | null;
  tutors: Tutor[];
  tutorsLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  tutorsError: string | null;
  learningPaths: LearningPath[];
  learningPathsLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  learningPathsError: string | null;
  courseDetail: CourseDetail | null;
  courseDetailLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  courseDetailError: string | null;
  progressLoading: boolean;
  progressError: string | null;
  courseProgress: Record<string, CourseProgressResponse>;
}

// Initial state
const initialState: CourseState = {
  courses: [],
  selectedCourse: null,
  loading: 'idle',
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total_count: 0,
    next_page: null,
  },
  filters: {},
  categories: [],
  categoriesLoading: 'idle',
  categoriesError: null,
  tutors: [],
  tutorsLoading: 'idle',
  tutorsError: null,
  learningPaths: [],
  learningPathsLoading: 'idle',
  learningPathsError: null,
  courseDetail: null,
  courseDetailLoading: 'idle',
  courseDetailError: null,
  progressLoading: false,
  progressError: null,
  courseProgress: {},
};

// Slice
const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedCourse: (state, action: PayloadAction<Course | null>) => {
      state.selectedCourse = action.payload;
    },
    setCourseFilters: (state, action: PayloadAction<Partial<CourseFilters>>) => {
      const newFilters = { ...state.filters, ...action.payload };
      Object.keys(newFilters).forEach(key => {
        const filterKey = key as keyof CourseFilters;
        if (newFilters[filterKey] === null || newFilters[filterKey] === undefined) {
          delete newFilters[filterKey];
        }
      });
      state.filters = newFilters;
      state.pagination.page = 1;
    },
    clearCourseFilters: (state) => {
      state.filters = {};
      state.pagination.page = 1;
      state.courses = [];
    },
    clearProgressError: (state) => {
      state.progressError = null;
    },
    setCourses: (state, action: PayloadAction<Course[]>) => {
      state.courses = action.payload;
    },
    updateLocalProgress: (state, action: PayloadAction<{ courseId: string; lessonId: string; completed: boolean }>) => {
      const { courseId, lessonId, completed } = action.payload;
      const course = state.courses.find(c => c.id === courseId);
      if (course && course.lessons) {
        const lesson = course.lessons.find(l => l.id === lessonId);
        if (lesson) {
          lesson.isCompleted = completed;
        }
      }
      if (state.selectedCourse?.id === courseId && state.selectedCourse?.lessons) {
        const lesson = state.selectedCourse.lessons.find(l => l.id === lessonId);
        if (lesson) {
          lesson.isCompleted = completed;
        }
      }
    },
    updateCourseProgress: (state, action: PayloadAction<{ courseId: string; progress: number }>) => {
      const { courseId, progress } = action.payload;
      const course = state.courses.find(c => c.id === courseId);
      if (course) {
        course.progress = progress;
      }
      if (state.selectedCourse && state.selectedCourse.id === courseId) {
        state.selectedCourse.progress = progress;
      }
    },
    resetPagination: (state) => {
      state.pagination.page = 1;
      if (state.filters && typeof state.filters.page !== 'undefined') {
        state.filters.page = 1;
      }
    },
  },
  extraReducers: (builder) => {
    // fetchCourses
    builder
      .addCase(fetchCourses.pending, (state, action) => {
        if (action.meta.arg.refresh || state.pagination.page === 1) {
          state.loading = 'pending';
        }
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        if (action.meta.arg.refresh) {
          state.courses = action.payload.courses;
        } else {
          state.courses = [...state.courses, ...action.payload.courses];
        }
        state.pagination = action.payload.metadata;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.error.message || 'Failed to fetch courses';
      });

    // fetchCourseById
    builder
      .addCase(fetchCourseById.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.selectedCourse = action.payload;
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      });

    // refreshCourses
    builder
      .addCase(refreshCourses.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(refreshCourses.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        const response: CourseListResponse = action.payload;
        state.courses = response.courses;
        state.pagination.total_count = response.metadata.total_count;
        state.pagination.next_page = response.metadata.next_page;
      })
      .addCase(refreshCourses.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      });

    // toggleCourseEnrollment
    builder
      .addCase(toggleCourseEnrollment.pending, (state) => {
        // Don't set loading for enrollment toggle to keep UI responsive
      })
      .addCase(toggleCourseEnrollment.fulfilled, (state, action) => {
        const courseId = action.payload;
        // Toggle enrollment status in both courses list and course detail
        const course = state.courses.find(c => c.id === courseId);
        if (course) {
          course.isEnrolled = !course.isEnrolled;
        }
        if (state.courseDetail?.id === courseId) {
          state.courseDetail.isEnrolled = !state.courseDetail.isEnrolled;
        }
      })
      .addCase(toggleCourseEnrollment.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Update lesson progress
    builder
      .addCase(updateLessonProgress.pending, (state) => {
        state.progressLoading = true;
        state.progressError = null;
      })
      .addCase(updateLessonProgress.fulfilled, (state, action) => {
        state.progressLoading = false;
        const { lessonId, courseId, completed, courseProgress } = action.payload;
        
        courseSlice.caseReducers.updateLocalProgress(state, { 
          type: 'courses/updateLocalProgress', 
          payload: { courseId, lessonId, completed } 
        });
        
        state.courseProgress[courseId] = {
          courseId,
          totalLessons: 0,
          completedLessons: 0,
          progress: courseProgress,
        };
      })
      .addCase(updateLessonProgress.rejected, (state, action) => {
        state.progressLoading = false;
        state.progressError = action.error.message || 'Failed to update lesson progress';
      });
    
    // Sync pending progress
    builder
      .addCase(syncPendingProgress.pending, (state) => {
        state.progressLoading = true;
        state.progressError = null;
      })
      .addCase(syncPendingProgress.fulfilled, (state) => {
        state.progressLoading = false;
      })
      .addCase(syncPendingProgress.rejected, (state, action) => {
        state.progressLoading = false;
        state.progressError = action.error.message || 'Failed to sync pending progress';
      });
    
    // Initialize progress data
    builder
      .addCase(initializeProgressData.fulfilled, (state, action) => {
        Object.keys(action.payload).forEach(courseId => {
          const courseData = action.payload[courseId];
          
          const courseIndex = state.courses.findIndex(c => c.id === courseId);
          if (courseIndex !== -1) {
            const course = state.courses[courseIndex];
            if (course && course.lessons) {
              course.progress = courseData.progress;
              course.lessons.forEach((lesson: any) => {
                lesson.isCompleted = courseData.completedLessons.includes(lesson.id);
              });
            }
          }
          
          if (state.selectedCourse?.id === courseId && state.selectedCourse.lessons) {
            if (state.selectedCourse) {
              state.selectedCourse.progress = courseData.progress;
              state.selectedCourse.lessons.forEach((lesson: any) => {
                lesson.isCompleted = courseData.completedLessons.includes(lesson.id);
              });
            }
          }
        });
      });

    // Fetch categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesLoading = 'pending';
      })
      .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
        state.categoriesLoading = 'succeeded';
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesLoading = 'failed';
        state.categoriesError = action.error.message || 'Failed to fetch categories';
      })
      .addCase(fetchTutors.pending, (state) => {
        state.tutorsLoading = 'pending';
      })
      .addCase(fetchTutors.fulfilled, (state, action) => {
        state.tutors = action.payload;
        state.tutorsLoading = 'succeeded';
      })
      .addCase(fetchTutors.rejected, (state, action) => {
        state.tutorsError = action.error.message || 'Failed to fetch tutors';
        state.tutorsLoading = 'failed';
      });

    // Fetch learning paths
    builder
      .addCase(fetchLearningPaths.pending, (state) => {
        state.learningPathsLoading = 'pending';
      })
      .addCase(fetchLearningPaths.fulfilled, (state, action) => {
        state.learningPaths = action.payload;
        state.learningPathsLoading = 'succeeded';
      })
      .addCase(fetchLearningPaths.rejected, (state, action) => {
        state.learningPathsError = action.error.message || 'Failed to fetch learning paths';
        state.learningPathsLoading = 'failed';
      });

    // Fetch course detail
    builder
      .addCase(fetchCourseDetail.pending, (state) => {
        state.courseDetailLoading = 'pending';
        state.courseDetailError = null;
      })
      .addCase(fetchCourseDetail.fulfilled, (state, action) => {
        state.courseDetailLoading = 'succeeded';
        state.courseDetail = action.payload;
      })
      .addCase(fetchCourseDetail.rejected, (state, action) => {
        state.courseDetailLoading = 'failed';
        state.courseDetailError = action.payload as string;
      });
  },
});

export const {
  clearError,
  setSelectedCourse,
  setCourseFilters,
  clearCourseFilters,
  clearProgressError,
  setCourses,
  updateLocalProgress,
  updateCourseProgress,
  resetPagination,
} = courseSlice.actions;

export default courseSlice.reducer; 