import AsyncStorage from '@react-native-async-storage/async-storage';

let notificationService: any = null;
try {
  const { notificationService: service } = require('./NotificationService');
  notificationService = service;
} catch (error) {
  console.warn('NotificationService not available:', error);
}

const ENROLLMENT_KEY = 'course_enrollments';
const NOTIFICATION_IDS_KEY = 'enrollment_notification_ids';

export interface EnrollmentData {
  courseId: string;
  enrolledAt: string;
  lastAccessedAt?: string;
}

export interface EnrollmentNotificationData {
  courseId: string;
  notificationId: string;
  scheduledDate: string;
}

export class EnrollmentService {
  // To get all enrolled courses
  static async getEnrollments(): Promise<EnrollmentData[]> {
    try {
      const data = await AsyncStorage.getItem(ENROLLMENT_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting enrollments:', error);
      return [];
    }
  }

  // To check if a course is enrolled
  static async isEnrolled(courseId: string): Promise<boolean> {
    try {
      const enrollments = await this.getEnrollments();
      return enrollments.some(enrollment => enrollment.courseId === courseId);
    } catch (error) {
      console.error('Error checking enrollment:', error);
      return false;
    }
  }

  // To enroll in a course
  static async enroll(courseId: string, courseTitle?: string): Promise<void> {
    try {
      const enrollments = await this.getEnrollments();
      const existingEnrollment = enrollments.find(e => e.courseId === courseId);
      
      if (!existingEnrollment) {
        const newEnrollment: EnrollmentData = {
          courseId,
          enrolledAt: new Date().toISOString(),
        };
        enrollments.push(newEnrollment);
        await AsyncStorage.setItem(ENROLLMENT_KEY, JSON.stringify(enrollments));

        if (courseTitle && notificationService) {
          await this.scheduleEnrollmentReminder(courseId, courseTitle);
        } else if (courseTitle && !notificationService) {
          console.warn('NotificationService not available, skipping enrollment reminder');
        }
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  }

  // To unenroll from a course
  static async unenroll(courseId: string): Promise<void> {
    try {
      const enrollments = await this.getEnrollments();
      const filteredEnrollments = enrollments.filter(e => e.courseId !== courseId);
      await AsyncStorage.setItem(ENROLLMENT_KEY, JSON.stringify(filteredEnrollments));

      if (notificationService) {
        await this.cancelEnrollmentReminders(courseId);
      } else {
        console.warn('NotificationService not available, skipping reminder cancellation');
      }
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      throw error;
    }
  }

  // To update last accessed time for a course
  static async updateLastAccessed(courseId: string): Promise<void> {
    try {
      const enrollments = await this.getEnrollments();
      const enrollment = enrollments.find(e => e.courseId === courseId);
      
      if (enrollment) {
        enrollment.lastAccessedAt = new Date().toISOString();
        await AsyncStorage.setItem(ENROLLMENT_KEY, JSON.stringify(enrollments));
      }
    } catch (error) {
      console.error('Error updating last accessed:', error);
    }
  }

  // To get enrollment date for a course
  static async getEnrollmentDate(courseId: string): Promise<string | null> {
    try {
      const enrollments = await this.getEnrollments();
      const enrollment = enrollments.find(e => e.courseId === courseId);
      return enrollment?.enrolledAt || null;
    } catch (error) {
      console.error('Error getting enrollment date:', error);
      return null;
    }
  }

  // To schedule enrollment reminder notification
  static async scheduleEnrollmentReminder(courseId: string, courseTitle: string): Promise<string | null> {
    try {
      if (!notificationService) {
        return null;
      }

      const notificationsEnabled = await notificationService.areNotificationsEnabled();
      if (!notificationsEnabled) {
        return null;
      }

      // schedule reminder for 24 hours from now
      const scheduledDate = new Date();
      scheduledDate.setHours(scheduledDate.getHours() + 24);

      const notificationId = await notificationService.scheduleEnrollmentReminder({
        courseId,
        courseTitle,
        scheduledDate,
      });

      await this.storeNotificationId(courseId, notificationId, scheduledDate);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling enrollment reminder:', error);
      return null;
    }
  }

  // To cancel enrollment reminders for a course
  static async cancelEnrollmentReminders(courseId: string): Promise<void> {
    try {
      if (!notificationService) {
        console.warn('NotificationService not available, skipping reminder cancellation');
        return;
      }

      notificationService.cancelEnrollmentReminders(courseId);

      await this.removeNotificationIds(courseId);

      console.log('Enrollment reminders cancelled for course:', courseId);
    } catch (error) {
      console.error('Error cancelling enrollment reminders:', error);
    }
  }

  // To store notification ID for a course
  private static async storeNotificationId(courseId: string, notificationId: string, scheduledDate: Date): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
      const notifications: EnrollmentNotificationData[] = data ? JSON.parse(data) : [];
      
      const filteredNotifications = notifications.filter(n => n.courseId !== courseId);
      
      filteredNotifications.push({
        courseId,
        notificationId,
        scheduledDate: scheduledDate.toISOString(),
      });

      await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(filteredNotifications));
    } catch (error) {
      console.error('Error storing notification ID:', error);
    }
  }

  // To remove notification IDs for a course
  private static async removeNotificationIds(courseId: string): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
      const notifications: EnrollmentNotificationData[] = data ? JSON.parse(data) : [];
      
      const filteredNotifications = notifications.filter(n => n.courseId !== courseId);
      await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(filteredNotifications));
    } catch (error) {
      console.error('Error removing notification IDs:', error);
    }
  }

  // To get all scheduled notification IDs
  static async getScheduledNotificationIds(): Promise<EnrollmentNotificationData[]> {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting scheduled notification IDs:', error);
      return [];
    }
  }

  // To clear all enrollments (for testing or reset)
  static async clearAllEnrollments(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ENROLLMENT_KEY);
      await AsyncStorage.removeItem(NOTIFICATION_IDS_KEY);
      
      if (notificationService) {
        notificationService.cancelAllNotifications();
      } else {
        console.warn('NotificationService not available, skipping notification cancellation');
      }
    } catch (error) {
      console.error('Error clearing enrollments:', error);
      throw error;
    }
  }
} 