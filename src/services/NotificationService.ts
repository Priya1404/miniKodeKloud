import { Platform } from 'react-native';

let PushNotification: any = null;
let Importance: any = null;

try {
  const pushNotificationModule = require('react-native-push-notification');
  PushNotification = pushNotificationModule.default || pushNotificationModule;
  Importance = pushNotificationModule.Importance;
} catch (error) {
  console.warn('react-native-push-notification not available:', error);
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  courseId?: string;
  lessonId?: string;
  scheduledDate?: Date;
  repeatType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface EnrollmentReminderData {
  courseId: string;
  courseTitle: string;
  scheduledDate: Date;
}

export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;

  private constructor() {
    this.initializeNotifications();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // To initialize notification channels and permissions
  private initializeNotifications(): void {
    if (this.isInitialized || !PushNotification) return;

    // Config changes for notification channels for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'course-reminders',
          channelName: 'Course Reminders',
          channelDescription: 'Reminders for course enrollment and progress',
          playSound: true,
          soundName: 'default',
          importance: Importance?.HIGH || 'high',
          vibrate: true,
        }
      );

      PushNotification.createChannel(
        {
          channelId: 'general',
          channelName: 'General Notifications',
          channelDescription: 'General app notifications',
          playSound: true,
          soundName: 'default',
          importance: Importance?.DEFAULT || 'default',
          vibrate: true,
        },
        () => {}
      );
    }

    // To configure notification handlers
    PushNotification.configure({
      onRegister () {
      },
      onNotification (notification: any) {
        notification.finish();
      },
      onAction () {
      },
      onRegistrationError (err: any) {
        console.error('Registration error:', err.message, err);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    this.isInitialized = true;
  }

  // To request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      if (!PushNotification) {
        console.warn('PushNotification not available');
        return false;
      }
      
      const permissions = await PushNotification.requestPermissions();
      return permissions.alert || false;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // To check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      if (!PushNotification) {
        console.warn('PushNotification not available');
        return false;
      }
      
      return new Promise((resolve) => {
        try {
          PushNotification.checkPermissions((permissions: any) => {
            try {
              resolve(permissions.alert || false);
            } catch {
              resolve(false);
            }
          });
        } catch {
          resolve(false);
        }
      });
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  // To schedule a course enrollment reminder notification
  async scheduleEnrollmentReminder(data: EnrollmentReminderData): Promise<string> {
    if (!PushNotification) {
      throw new Error('PushNotification not available');
    }

    const notificationId = `enrollment-reminder-${data.courseId}-${Date.now()}`;
    
    const notificationData: NotificationData = {
      id: notificationId,
      title: 'Time to Start Learning! 🎓',
      message: `Don't forget to start your course "${data.courseTitle}". Your learning journey awaits!`,
      courseId: data.courseId,
      scheduledDate: data.scheduledDate,
    };

    try {
      PushNotification.localNotificationSchedule({
        id: notificationId,
        channelId: 'course-reminders',
        title: notificationData.title,
        message: notificationData.message,
        date: data.scheduledDate,
        allowWhileIdle: true,
        repeatType: 'day',
        userInfo: {
          type: 'enrollment-reminder',
          courseId: data.courseId,
          courseTitle: data.courseTitle,
        },
        playSound: true,
        soundName: 'default',
        importance: Importance?.HIGH || 'high',
        vibrate: true,
        vibration: 300,
        priority: 'high',
        autoCancel: true,
        largeIcon: 'ic_launcher',
        smallIcon: 'ic_notification',
        bigText: notificationData.message,
        subText: 'Course Reminder',
        color: '#007AFF',
        number: 1,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling enrollment reminder:', error);
      throw new Error('Failed to schedule enrollment reminder');
    }
  }

  // To schedule a general notification
  async scheduleNotification(data: NotificationData): Promise<string> {
    if (!PushNotification) {
      throw new Error('PushNotification not available');
    }

    try {
      PushNotification.localNotificationSchedule({
        id: data.id,
        channelId: 'general',
        title: data.title,
        message: data.message,
        date: data.scheduledDate || new Date(Date.now() + 1000), // Default to 1 second from now if no date is provided
        allowWhileIdle: true,
        repeatType: data.repeatType,
        userInfo: {
          type: 'general',
          courseId: data.courseId,
          lessonId: data.lessonId,
        },
        playSound: true,
        soundName: 'default',
        importance: Importance?.DEFAULT || 'default',
        vibrate: true,
        vibration: 300,
        priority: 'default',
        autoCancel: true,
        largeIcon: 'ic_launcher',
        smallIcon: 'ic_notification',
        bigText: data.message,
        color: '#007AFF',
      });

      return data.id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw new Error('Failed to schedule notification');
    }
  }

  // To send an immediate notification
  async sendImmediateNotification(data: Omit<NotificationData, 'scheduledDate'>): Promise<string> {
    if (!PushNotification) {
      throw new Error('PushNotification not available');
    }

    try {
      PushNotification.localNotification({
        id: data.id,
        channelId: 'general',
        title: data.title,
        message: data.message,
        userInfo: {
          type: 'immediate',
          courseId: data.courseId,
          lessonId: data.lessonId,
        },
        playSound: true,
        soundName: 'default',
        importance: Importance?.DEFAULT || 'default',
        vibrate: true,
        vibration: 300,
        priority: 'default',
        autoCancel: true,
        largeIcon: 'ic_launcher',
        smallIcon: 'ic_notification',
        bigText: data.message,
        color: '#007AFF',
      });

      return data.id;
    } catch (error) {
      console.error('Error sending immediate notification:', error);
      throw new Error('Failed to send immediate notification');
    }
  }

  // To cancel a specific notification
  cancelNotification(notificationId: string): void {
    try {
      if (!PushNotification) {
        console.warn('PushNotification not available');
        return;
      }
      
      PushNotification.cancelLocalNotification(notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  // To cancel all notifications
  cancelAllNotifications(): void {
    try {
      if (!PushNotification) {
        console.warn('PushNotification not available');
        return;
      }
      
      PushNotification.cancelAllLocalNotifications();
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  // To cancel all enrollment reminders for a specific course
  cancelEnrollmentReminders(courseId: string): void {
    try {
      if (!PushNotification) {
        console.warn('PushNotification not available');
        return;
      }
      
      PushNotification.getScheduledLocalNotifications((notifications: any[]) => {
        notifications.forEach((notification: any) => {
          if (notification.userInfo?.courseId === courseId && 
              notification.userInfo?.type === 'enrollment-reminder') {
            this.cancelNotification(notification.id);
          }
        });
      });
    } catch (error) {
      console.error('Error cancelling enrollment reminders:', error);
    }
  }

  // To get all scheduled notifications
  async getScheduledNotifications(): Promise<any[]> {
    return new Promise((resolve) => {
      if (!PushNotification) {
        console.warn('PushNotification not available');
        resolve([]);
        return;
      }
      
      PushNotification.getScheduledLocalNotifications((notifications: any[]) => {
        resolve(notifications);
      });
    });
  }

  // To get all delivered notifications
  async getDeliveredNotifications(): Promise<any[]> {
    return new Promise((resolve) => {
      if (!PushNotification) {
        console.warn('PushNotification not available');
        resolve([]);
        return;
      }
      
      PushNotification.getDeliveredNotifications((notifications: any[]) => {
        resolve(notifications);
      });
    });
  }

  // To clear all delivered notifications
  clearDeliveredNotifications(): void {
    try {
      if (!PushNotification) {
        console.warn('PushNotification not available');
        return;
      }
      
      PushNotification.removeAllDeliveredNotifications();
    } catch (error) {
      console.error('Error clearing delivered notifications:', error);
    }
  }

  // To set application badge count
  setBadgeCount(count: number): void {
    try {
      if (!PushNotification) {
        console.warn('PushNotification not available');
        return;
      }
      
      PushNotification.setApplicationIconBadgeNumber(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  // To get application badge count
  async getBadgeCount(): Promise<number> {
    try {
      if (!PushNotification) {
        console.warn('PushNotification not available');
        return 0;
      }
      
      return await PushNotification.getApplicationIconBadgeNumber();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }
}

export const notificationService = NotificationService.getInstance(); 