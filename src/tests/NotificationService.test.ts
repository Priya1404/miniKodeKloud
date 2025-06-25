import { NotificationService } from '../services/NotificationService';

describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    notificationService = NotificationService.getInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = NotificationService.getInstance();
      const instance2 = NotificationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('requestPermissions', () => {
    it('should request permissions successfully', async () => {
      const mockRequestPermissions = require('react-native-push-notification').requestPermissions;
      mockRequestPermissions.mockResolvedValue({ alert: true, badge: true, sound: true });

      const result = await notificationService.requestPermissions();
      
      expect(result).toBe(true);
      expect(mockRequestPermissions).toHaveBeenCalled();
    });

    it('should handle permission request errors', async () => {
      const mockRequestPermissions = require('react-native-push-notification').requestPermissions;
      mockRequestPermissions.mockRejectedValue(new Error('Permission denied'));

      const result = await notificationService.requestPermissions();
      
      expect(result).toBe(false);
    });
  });

  describe('areNotificationsEnabled', () => {
    it('should check permissions successfully', async () => {
      const mockCheckPermissions = require('react-native-push-notification').checkPermissions;
      mockCheckPermissions.mockImplementation((cb: any) => cb({ alert: true, badge: true, sound: true }));

      const result = await notificationService.areNotificationsEnabled();
      expect(result).toBe(true);
      expect(mockCheckPermissions).toHaveBeenCalled();
    });

    it('should handle permission check errors', async () => {
      const mockCheckPermissions = require('react-native-push-notification').checkPermissions;
      mockCheckPermissions.mockImplementation(() => { throw new Error('Check failed'); });

      const result = await notificationService.areNotificationsEnabled();
      expect(result).toBe(false);
    });
  });

  describe('scheduleEnrollmentReminder', () => {
    it('should schedule enrollment reminder successfully', async () => {
      const mockLocalNotificationSchedule = require('react-native-push-notification').localNotificationSchedule;
      mockLocalNotificationSchedule.mockResolvedValue('notification-id');

      const data = {
        courseId: '123',
        courseTitle: 'Test Course',
        scheduledDate: new Date(),
      };

      const result = await notificationService.scheduleEnrollmentReminder(data);
      expect(result).toContain('enrollment-reminder-123');
      expect(mockLocalNotificationSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringContaining('enrollment-reminder-123'),
          title: 'Time to Start Learning! 🎓',
          message: expect.stringContaining('Test Course'),
          channelId: 'course-reminders',
        })
      );
    });

    it('should handle scheduling errors', async () => {
      const mockLocalNotificationSchedule = require('react-native-push-notification').localNotificationSchedule;
      // Using a safer approach that doesn't cause unhandled promise rejections
      mockLocalNotificationSchedule.mockImplementation(() => {
        throw new Error('Scheduling failed');
      });

      const data = {
        courseId: '123',
        courseTitle: 'Test Course',
        scheduledDate: new Date(),
      };

      await expect(notificationService.scheduleEnrollmentReminder(data)).rejects.toThrow('Failed to schedule enrollment reminder');
    });
  });

  describe('scheduleNotification', () => {
    it('should schedule notification successfully', async () => {
      const mockLocalNotificationSchedule = require('react-native-push-notification').localNotificationSchedule;
      mockLocalNotificationSchedule.mockResolvedValue('notification-id');

      const data = {
        id: 'test-notification',
        title: 'Test Title',
        message: 'Test Message',
        scheduledDate: new Date(),
      };

      const result = await notificationService.scheduleNotification(data);
      expect(result).toBe('test-notification');
      expect(mockLocalNotificationSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-notification',
          title: 'Test Title',
          message: 'Test Message',
          channelId: 'general',
        })
      );
    });

    it('should handle scheduling errors', async () => {
      const mockLocalNotificationSchedule = require('react-native-push-notification').localNotificationSchedule;
      mockLocalNotificationSchedule.mockImplementation(() => {
        throw new Error('Scheduling failed');
      });

      const data = {
        id: 'test-notification',
        title: 'Test Title',
        message: 'Test Message',
      };

      await expect(notificationService.scheduleNotification(data)).rejects.toThrow('Failed to schedule notification');
    });
  });

  describe('sendImmediateNotification', () => {
    it('should send immediate notification successfully', async () => {
      const mockLocalNotification = require('react-native-push-notification').localNotification;
      mockLocalNotification.mockResolvedValue('notification-id');

      const data = {
        id: 'test-notification',
        title: 'Test Title',
        message: 'Test Message',
      };

      const result = await notificationService.sendImmediateNotification(data);
      expect(result).toBe('test-notification');
      expect(mockLocalNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-notification',
          title: 'Test Title',
          message: 'Test Message',
          channelId: 'general',
        })
      );
    });

    it('should handle immediate notification errors', async () => {
      const mockLocalNotification = require('react-native-push-notification').localNotification;
      mockLocalNotification.mockImplementation(() => {
        throw new Error('Sending failed');
      });

      const data = {
        id: 'test-notification',
        title: 'Test Title',
        message: 'Test Message',
      };

      await expect(notificationService.sendImmediateNotification(data)).rejects.toThrow('Failed to send immediate notification');
    });
  });

  describe('cancelNotification', () => {
    it('should cancel notification successfully', () => {
      const mockCancelLocalNotification = require('react-native-push-notification').cancelLocalNotification;
      
      notificationService.cancelNotification('test-id');
      expect(mockCancelLocalNotification).toHaveBeenCalledWith('test-id');
    });

    it('should handle cancellation errors gracefully', () => {
      const mockCancelLocalNotification = require('react-native-push-notification').cancelLocalNotification;
      mockCancelLocalNotification.mockImplementation(() => {
        throw new Error('Cancellation failed');
      });

      expect(() => notificationService.cancelNotification('test-id')).not.toThrow();
    });
  });

  describe('cancelAllNotifications', () => {
    it('should cancel all notifications successfully', () => {
      const mockCancelAllLocalNotifications = require('react-native-push-notification').cancelAllLocalNotifications;
      
      notificationService.cancelAllNotifications();
      expect(mockCancelAllLocalNotifications).toHaveBeenCalled();
    });

    it('should handle cancellation errors gracefully', () => {
      const mockCancelAllLocalNotifications = require('react-native-push-notification').cancelAllLocalNotifications;
      mockCancelAllLocalNotifications.mockImplementation(() => {
        throw new Error('Cancellation failed');
      });

      expect(() => notificationService.cancelAllNotifications()).not.toThrow();
    });
  });

  describe('getScheduledNotifications', () => {
    it('should get scheduled notifications successfully', async () => {
      const mockGetScheduledLocalNotifications = require('react-native-push-notification').getScheduledLocalNotifications;
      const mockNotifications = [{ id: '1', title: 'Test' }];
      mockGetScheduledLocalNotifications.mockImplementation((callback: (notifications: any[]) => void) => callback(mockNotifications));

      const result = await notificationService.getScheduledNotifications();
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('getDeliveredNotifications', () => {
    it('should get delivered notifications successfully', async () => {
      const mockGetDeliveredNotifications = require('react-native-push-notification').getDeliveredNotifications;
      const mockNotifications = [{ id: '1', title: 'Test' }];
      mockGetDeliveredNotifications.mockImplementation((callback: (notifications: any[]) => void) => callback(mockNotifications));

      const result = await notificationService.getDeliveredNotifications();
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('setBadgeCount', () => {
    it('should set badge count successfully', () => {
      const mockSetApplicationIconBadgeNumber = require('react-native-push-notification').setApplicationIconBadgeNumber;
      
      notificationService.setBadgeCount(5);
      expect(mockSetApplicationIconBadgeNumber).toHaveBeenCalledWith(5);
    });

    it('should handle badge count errors gracefully', () => {
      const mockSetApplicationIconBadgeNumber = require('react-native-push-notification').setApplicationIconBadgeNumber;
      mockSetApplicationIconBadgeNumber.mockImplementation(() => {
        throw new Error('Badge count failed');
      });

      expect(() => notificationService.setBadgeCount(5)).not.toThrow();
    });
  });

  describe('getBadgeCount', () => {
    it('should get badge count successfully', async () => {
      const mockGetApplicationIconBadgeNumber = require('react-native-push-notification').getApplicationIconBadgeNumber;
      mockGetApplicationIconBadgeNumber.mockResolvedValue(5);

      const result = await notificationService.getBadgeCount();
      expect(result).toBe(5);
    });

    it('should handle badge count errors gracefully', async () => {
      const mockGetApplicationIconBadgeNumber = require('react-native-push-notification').getApplicationIconBadgeNumber;
      mockGetApplicationIconBadgeNumber.mockRejectedValue(new Error('Badge count failed'));

      const result = await notificationService.getBadgeCount();
      expect(result).toBe(0);
    });
  });
});