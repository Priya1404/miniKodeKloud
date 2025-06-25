import { MMKV } from 'react-native-mmkv';
import { courseApi, ProgressUpdateRequest, ProgressResponse, CourseProgressResponse } from '../api/courseApi';

let storage: MMKV = new MMKV();

export interface LocalProgressData {
  lessonId: string;
  courseId: string;
  completed: boolean;
  completedAt: string;
  synced: boolean;
}

export class ProgressService {
  private static readonly PROGRESS_KEY = 'lesson_progress';
  private static readonly SYNC_QUEUE_KEY = 'progress_sync_queue';

  static setStorage(customStorage: MMKV) {
    storage = customStorage;
  }

  // To mark a lesson as completed and sync with API
  static async markLessonCompleted(lessonId: string, courseId: string): Promise<ProgressResponse> {
    try {
      const localProgress = this.getLocalProgress();
      const key = `${courseId}_${lessonId}`;
      
      localProgress[key] = {
        lessonId,
        courseId,
        completed: true,
        completedAt: new Date().toISOString(),
        synced: false,
      };
      
      this.saveLocalProgress(localProgress);
      
      this.addToSyncQueue({ lessonId, courseId, completed: true });
      
      const response = await courseApi.updateLessonProgress({
        lessonId,
        courseId,
        completed: true,
      });
      
      localProgress[key].synced = true;
      this.saveLocalProgress(localProgress);
      
      return response;
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
      throw error;
    }
  }

  // To mark a lesson as incomplete and sync with API
  static async markLessonIncomplete(lessonId: string, courseId: string): Promise<ProgressResponse> {
    try {
      const localProgress = this.getLocalProgress();
      const key = `${courseId}_${lessonId}`;
      
      localProgress[key] = {
        lessonId,
        courseId,
        completed: false,
        completedAt: new Date().toISOString(),
        synced: false,
      };
      
      this.saveLocalProgress(localProgress);
      
      this.addToSyncQueue({ lessonId, courseId, completed: false });
      
      const response = await courseApi.updateLessonProgress({
        lessonId,
        courseId,
        completed: false,
      });
      
      localProgress[key].synced = true;
      this.saveLocalProgress(localProgress);
      
      return response;
    } catch (error) {
      console.error('Error marking lesson as incomplete:', error);
      throw error;
    }
  }

  // To get lesson completion status
  static async isLessonCompleted(lessonId: string, courseId: string): Promise<boolean> {
    try {
      const localProgress = this.getLocalProgress();
      const key = `${courseId}_${lessonId}`;
      return localProgress[key]?.completed || false;
    } catch (error) {
      console.error('Error checking lesson completion:', error);
      return false;
    }
  }

  // To sync pending progress updates with API
  static async syncPendingProgress(): Promise<void> {
    try {
      const syncQueue = this.getSyncQueue();
      
      if (syncQueue.length === 0) {
        return;
      }

      const localProgress = this.getLocalProgress();
      
      for (const request of syncQueue) {
        try {
          await courseApi.updateLessonProgress(request);
          
          const key = `${request.courseId}_${request.lessonId}`;
          if (localProgress[key]) {
            localProgress[key].synced = true;
          }
        } catch (error) {
          console.error('Error syncing progress for lesson:', request.lessonId, error);
        }
      }
      
      this.clearSyncQueue();
      this.saveLocalProgress(localProgress);
    } catch (error) {
      console.error('Error syncing pending progress:', error);
    }
  }

  // To get all completed lessons for a course
  static async getCompletedLessons(courseId: string): Promise<string[]> {
    try {
      const localProgress = this.getLocalProgress();
      const completedLessons: string[] = [];
      
      Object.values(localProgress).forEach(progress => {
        if (progress.courseId === courseId && progress.completed) {
          completedLessons.push(progress.lessonId);
        }
      });
      
      return completedLessons;
    } catch (error) {
      console.error('Error getting completed lessons:', error);
      return [];
    }
  }

  // To clear all progress data for a course
  static async clearCourseProgress(courseId: string): Promise<void> {
    try {
      const localProgress = this.getLocalProgress();
      const keysToRemove: string[] = [];
      
      Object.keys(localProgress).forEach(key => {
        if (localProgress[key].courseId === courseId) {
          keysToRemove.push(key);
        }
      });
      
      keysToRemove.forEach(key => {
        delete localProgress[key];
      });
      
      this.saveLocalProgress(localProgress);
    } catch (error) {
      console.error('Error clearing course progress:', error);
    }
  }

  // To get unsynced progress count
  static getUnsyncedProgressCount(): number {
    try {
      const localProgress = this.getLocalProgress();
      return Object.values(localProgress).filter(progress => !progress.synced).length;
    } catch (error) {
      console.error('Error getting unsynced progress count:', error);
      return 0;
    }
  }

  // To load all local progress data
  static getAllLocalProgress(): Record<string, LocalProgressData> {
    try {
      return this.getLocalProgress();
    } catch (error) {
      console.error('Error loading all local progress:', error);
      return {};
    }
  }

  // To get local progress for a specific course
  static getLocalProgressForCourse(courseId: string): LocalProgressData[] {
    try {
      const localProgress = this.getLocalProgress();
      return Object.values(localProgress).filter(progress => progress.courseId === courseId);
    } catch (error) {
      console.error('Error getting local progress for course:', error);
      return [];
    }
  }

  // To calculate course progress from local data
  static calculateLocalCourseProgress(courseId: string, totalLessons: number): number {
    try {
      const courseProgress = this.getLocalProgressForCourse(courseId);
      const completedLessons = courseProgress.filter(progress => progress.completed).length;
      return Math.round((completedLessons / totalLessons) * 100);
    } catch (error) {
      console.error('Error calculating local course progress:', error);
      return 0;
    }
  }

  private static getLocalProgress(): Record<string, LocalProgressData> {
    try {
      const data = storage.getString(this.PROGRESS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting local progress:', error);
      return {};
    }
  }

  private static saveLocalProgress(progress: Record<string, LocalProgressData>): void {
    try {
      storage.set(this.PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving local progress:', error);
    }
  }

  private static getSyncQueue(): ProgressUpdateRequest[] {
    try {
      const data = storage.getString(this.SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  }

  private static addToSyncQueue(request: ProgressUpdateRequest): void {
    try {
      const queue = this.getSyncQueue();
      queue.push(request);
      storage.set(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  private static clearSyncQueue(): void {
    try {
      storage.delete(this.SYNC_QUEUE_KEY);
    } catch (error) {
      console.error('Error clearing sync queue:', error);
    }
  }
} 