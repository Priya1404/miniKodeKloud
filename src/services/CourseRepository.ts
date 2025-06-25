import { MMKV } from 'react-native-mmkv';
import { 
  courseApi, 
  fetchCourseCategories, 
  fetchTutors, 
  fetchLearningPaths, 
  fetchCourseDetail 
} from '../api/courseApi';
import { Course, CourseListResponse, CourseFilters } from '../models/Course';
import { EnrollmentService } from './EnrollmentService';
import { ProgressService } from './ProgressService';
import { Category } from '../models/Category';
import { Tutor } from '../models/Tutor';
import { LearningPath } from '../models/LearningPath';
import { CourseDetail } from '../models/CourseDetail';

// Storage engine
const localStorage = new MMKV();

// Keys for storing stuff
const COURSE_DETAIL_CACHE_KEY_PREFIX = 'courseDetail_';
const CATEGORIES_CACHE_KEY = 'courseCategories';
const TUTORS_CACHE_KEY = 'tutors';
const LEARNING_PATHS_CACHE_KEY = 'learningPaths';

export class CourseRepository {
  // These are used to cache course list
  private readonly LIST_CACHE_KEY = 'courses_cache';
  private readonly TIMESTAMP_KEY = 'courses_cache_timestamp';

  async getCourses(filters: CourseFilters): Promise<CourseListResponse> {
    try {
      // applying sorting based on the sortBy filter
      const data = await courseApi.getCourses(filters);
      
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'popular':
            data.courses.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
            break;
          case 'newest':
            data.courses.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            break;        
          }
      }

      return data;
    } catch {
      throw new Error('Failed to fetch courses');
    }
  }

  async getCourseById(courseId: string): Promise<Course> {
    try {
      return await courseApi.getCourseById(courseId);
    } catch {
      throw new Error('Failed to fetch course by ID');
    }
  }

  async refreshCourses(): Promise<CourseListResponse> {
    this.clearCache();
    return this.getCourses({ page: 1, limit: 10 });
  }

  async toggleEnrollment(courseId: string, title: string): Promise<void> {
      const alreadyEnrolled = await EnrollmentService.isEnrolled(courseId);
      
      if (alreadyEnrolled) {
        await EnrollmentService.unenroll(courseId);
      } else {
        await EnrollmentService.enroll(courseId, title);
      }
      await this.updateCourseEnrollmentInCache(courseId, !alreadyEnrolled);
  }

  async markLessonAsCompleted(lessonId: string, courseId: string): Promise<void> {
      await this.updateLessonCompletionInCache(lessonId, courseId, true);
      await this.updateCourseProgress(courseId);
  }

  async getCourseProgress(courseId: string): Promise<number> {
    try {
      const course = await this.getCourseById(courseId);
      
      const done = course?.lessons?.filter(lesson => lesson.isCompleted).length || 0;
      const total = course?.lessons?.length || 0;
      
      return total > 0 ? Math.round((done / total) * 100) : 0;
    } catch (err) {
      console.error('Error getting course progress:', err);
      return 0; // fallback
    }
  }

  private cacheCourses(courses: Course[]): void {
      localStorage.set(this.LIST_CACHE_KEY, JSON.stringify(courses));
      localStorage.set(this.TIMESTAMP_KEY, Date.now().toString());
  }

  public getCachedCourses(): Course[] | null {
      const raw = localStorage.getString(this.LIST_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
  }

  private clearCache(): void {
      localStorage.delete(this.LIST_CACHE_KEY);
      localStorage.delete(this.TIMESTAMP_KEY);
  }

  private async syncEnrollmentStatus(courses: Course[]): Promise<void> {
    try {
      for (const c of courses) {
        c.isEnrolled = await EnrollmentService.isEnrolled(c.id);
      }
    } catch (error) {
      console.error('Enrollment sync issue:', error);
    }
  }

  private async syncLessonCompletionStatus(courses: Course[]): Promise<void> {
    try {
      for (const course of courses) {
        const lessons = course.lessons || [];

        const localProgress = ProgressService.getLocalProgressForCourse(course.id);

        for (const lesson of lessons) {
            const entry = localProgress.find(p => p.lessonId === lesson.id);
            lesson.isCompleted = entry?.completed || false;
        }

        const completed = lessons.filter(l => l.isCompleted).length;
        const total = lessons.length;
        course.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      }
    } catch (error) {
      console.error('Lesson sync problem:', error);
    }
  }

  private async updateCourseEnrollmentInCache(courseId: string, enrolled: boolean): Promise<void> {
    try {
      const cached = this.getCachedCourses();
      if (cached) {
        const match = cached.find(c => c.id === courseId);
        if (match) {
          match.isEnrolled = enrolled;
          this.cacheCourses(cached);
        }
      }
    } catch (error) {
      console.error('Error updating course enrollment in cache:', error);
    }
  }

  private async updateLessonCompletionInCache(lessonId: string, courseId: string, completed: boolean): Promise<void> {
      const cached = this.getCachedCourses();
      if (cached) {
        const course = cached.find(c => c.id === courseId);
        const lesson = course?.lessons?.find(l => l.id === lessonId);

          if (lesson) {
            lesson.isCompleted = completed;

            const done = course?.lessons?.filter(l => l.isCompleted).length;
            const total = course?.lessons?.length;
            course.progress = total ? Math.round((done / total) * 100) : 0;

            this.cacheCourses(cached);
          }
        }
  }

  private async updateCourseProgress(courseId: string): Promise<void> {
    const progress = await this.getCourseProgress(courseId);
    const cached = this.getCachedCourses();
    
    if (cached) {
      const course = cached.find(c => c.id === courseId);
      if (course) {
        course.progress = progress;
        this.cacheCourses(cached);
      }
    }
  }

  async getCourseCategories(forceRefresh = false): Promise<Category[]> {
    const cached = this.getCachedData<Category[]>(CATEGORIES_CACHE_KEY);

    if (cached && !forceRefresh) {
      return cached;
    }

    const fresh = await fetchCourseCategories();
    this.setCachedData(CATEGORIES_CACHE_KEY, fresh);
    return fresh;
  }

  async getTutors(force = false): Promise<Tutor[]> {
    const cached = this.getCachedData<Tutor[]>(TUTORS_CACHE_KEY);

    if (cached && !force) {
      return cached;
    }

    try {
      const tutors = await fetchTutors();
      this.setCachedData(TUTORS_CACHE_KEY, tutors);
      return tutors;
    } catch (err) {
      console.error('Failed to fetch tutors', err);
      return cached || [];
    }
  }

  private getCachedData<T>(key: string): T | null {
    const cachedItem = localStorage.getString(key);
    return cachedItem ? JSON.parse(cachedItem) : null;
  }

  private setCachedData<T>(key: string, data: T): void {
    localStorage.set(key, JSON.stringify(data));
  }

  async getCourseDetails(courseId: string, force = false): Promise<Course | null> {
    const cacheKey = `${COURSE_DETAIL_CACHE_KEY_PREFIX}${courseId}`;
    const cachedCourse = this.getCachedData<Course>(cacheKey);

    if (cachedCourse && !force) {
      return cachedCourse;
    }

      const course = await courseApi.getCourseById(courseId);
      if (course) {
        this.setCachedData(cacheKey, course);
      }
      return course;
  }

  async getLearningPaths(forceRefresh = false): Promise<LearningPath[]> {
    const cached = this.getCachedData<LearningPath[]>(LEARNING_PATHS_CACHE_KEY);

    if (cached && !forceRefresh) {
      return cached;
    }

    const paths = await fetchLearningPaths();
    this.setCachedData(LEARNING_PATHS_CACHE_KEY, paths);
    return paths;
  }

  async getCourseDetail(slug: string): Promise<CourseDetail> {
    const detail = await fetchCourseDetail(slug);
    detail.isEnrolled = await EnrollmentService.isEnrolled(detail.id);
    return detail;
  }

  public async getOfflineCourses(): Promise<Course[]> {
    const cached = this.getCachedCourses();
    if (!cached) {
      return [];
    }
    await this.syncLessonCompletionStatus(cached);
    await this.syncEnrollmentStatus(cached);

    return cached;
  }

  public async getLastAccessedOfflineCourse(): Promise<Course[]> {
    const lastAccessedSlug = localStorage.getString('last_accessed_course_slug');
    if (!lastAccessedSlug) {
      return [];
    }
    const cached = this.getCachedCourses();
    if (!cached) {
      return [];
    }

    const match = cached.find(c => c.slug === lastAccessedSlug);

    const offlineCoursesList = match ? [match] : [];

    await this.syncLessonCompletionStatus(offlineCoursesList);
    await this.syncEnrollmentStatus(offlineCoursesList);

    return offlineCoursesList;
  }
}

export const courseRepository = new CourseRepository(); 