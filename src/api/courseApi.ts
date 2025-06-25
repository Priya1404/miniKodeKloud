import { Course, CourseListResponse, CourseFilters } from '../models/Course';
import axios from 'axios';
import { Category } from '../models/Category';
import { Tutor } from '../models/Tutor';
import { LearningPath } from '../models/LearningPath';
import { CourseDetail } from '../models/CourseDetail';

const BASE_URL = 'https://learn-api.kodekloud.com/api';

// Axios instance with default headers set
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ProgressUpdateRequest {
  lessonId: string;
  courseId: string;
  completed: boolean;
}

export interface ProgressResponse {
  lessonId: string;
  courseId: string;
  completed: boolean;
  completedAt: string;
  courseProgress: number;
}

export interface CourseProgressResponse {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  lastCompletedLesson?: string;
  lastCompletedAt?: string;
}

export const courseApi = {
  async getCourses(filterObj: CourseFilters): Promise<CourseListResponse> {
    const queryParams: any = {
      page: filterObj.page || 1,
      limit: filterObj.limit || 10,
    };

    if (filterObj.category && filterObj.category.length > 0) {
      queryParams.category = filterObj.category.join(',');
    }
    if (filterObj.tutorName) { 
      queryParams.tutor_name = filterObj.tutorName;
    }
    if (filterObj.plan && filterObj.plan.length > 0) { 
      queryParams.plan = filterObj.plan.join(',');
    }
    if (filterObj.sortBy) { 
      queryParams.sort_by = filterObj.sortBy;
    }
    if (filterObj.search) {
      queryParams.search = filterObj.search;
    } 

    const resp = await api.get<CourseListResponse>('/courses', { params: queryParams });
    return resp.data;
  },

  async getCourseById(courseId: string): Promise<Course> {
    const res = await api.get<Course>(`/courses/${courseId}`);
    return res.data;
  },

  async updateLessonProgress(update: ProgressUpdateRequest): Promise<ProgressResponse> {
    // simulating network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      lessonId: update.lessonId,
      courseId: update.courseId,
      completed: update.completed,
      completedAt: new Date().toISOString(),
      courseProgress: 0,
    };
  },
};

// Grab tutors from API
export const fetchTutors = async (): Promise<Tutor[]> => {
  try {
    const resp = await api.get<Tutor[]>('/tutors');
    return resp.data;
  } catch (err) {
    console.error('[API Error] tutors fetch failed:', err);
    throw err;
  }
};

// Categories for courses
export const fetchCourseCategories = async (): Promise<Category[]> => {
  try {
    const res = await api.get<Category[]>('/courses/categories');
    return res.data;
  } catch (err) {
    console.error('Error fetching course categories:', err);
    throw err;
  }
};

// Grab learning paths
export const fetchLearningPaths = async (): Promise<LearningPath[]> => {
  try {
    const res = await api.get<{ learning_paths: LearningPath[] }>('/learning_paths');
    return res.data.learning_paths;
  } catch (err) {
    console.error('Failed to fetch learning paths:', err);
    throw err;
  }
};

// Fetch course listing by page number
export const fetchCoursesByPage = async (pageNumber: number): Promise<CourseListResponse> => {
  try {
    const r = await api.get<CourseListResponse>(`/courses?page=${pageNumber}`);
    return r.data;
  } catch (err) {
    console.error('Failed to fetch courses by page:', err);
    throw err;
  }
};

export const fetchCourseDetail = async (slug: string): Promise<CourseDetail> => {
  try {
    const r = await api.get<CourseDetail>(`/courses/${slug}`);
    return r.data;
  } catch (err) {
    console.error('Failed to fetch course detail:', err);
    throw err;
  }
}; 