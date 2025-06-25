import AsyncStorage from '@react-native-async-storage/async-storage';
import { EnrollmentService } from '../services/EnrollmentService';
import { notificationService } from '../services/NotificationService';

// Mock notification service
jest.mock('../services/NotificationService');
const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('EnrollmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getEnrollments', () => {
    it('should return empty array when no enrollments exist', async () => {
      const result = await EnrollmentService.getEnrollments();
      expect(result).toEqual([]);
    });

    it('should return enrollments when they exist', async () => {
      const mockEnrollments = [
        { courseId: '1', enrolledAt: '2023-01-01T00:00:00.000Z' },
        { courseId: '2', enrolledAt: '2023-01-02T00:00:00.000Z' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockEnrollments));

      const result = await EnrollmentService.getEnrollments();
      expect(result).toEqual(mockEnrollments);
    });

    it('should handle storage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await EnrollmentService.getEnrollments();
      expect(result).toEqual([]);
    });
  });

  describe('isEnrolled', () => {
    it('should return false when course is not enrolled', async () => {
      const result = await EnrollmentService.isEnrolled('1');
      expect(result).toBe(false);
    });

    it('should return true when course is enrolled', async () => {
      const mockEnrollments = [
        { courseId: '1', enrolledAt: '2023-01-01T00:00:00.000Z' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockEnrollments));

      const result = await EnrollmentService.isEnrolled('1');
      expect(result).toBe(true);
    });
  });

  describe('enroll', () => {
    it('should enroll in a course successfully', async () => {
      mockNotificationService.areNotificationsEnabled.mockResolvedValue(true);
      mockNotificationService.scheduleEnrollmentReminder.mockResolvedValue('notification-id');

      await EnrollmentService.enroll('1', 'Test Course');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'course_enrollments',
        expect.stringContaining('"courseId":"1"')
      );
    });

    it('should not create duplicate enrollments', async () => {
      const existingEnrollments = [
        { courseId: '1', enrolledAt: '2023-01-01T00:00:00.000Z' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingEnrollments));

      await EnrollmentService.enroll('1', 'Test Course');

      // Should not call setItem again since enrollment already exists
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should schedule enrollment reminder when course title is provided', async () => {
      mockNotificationService.areNotificationsEnabled.mockResolvedValue(true);
      mockNotificationService.scheduleEnrollmentReminder.mockResolvedValue('notification-id');

      await EnrollmentService.enroll('1', 'Test Course');

      expect(mockNotificationService.scheduleEnrollmentReminder).toHaveBeenCalledWith({
        courseId: '1',
        courseTitle: 'Test Course',
        scheduledDate: expect.any(Date),
      });
    });

    it('should not schedule reminder when notifications are disabled', async () => {
      mockNotificationService.areNotificationsEnabled.mockResolvedValue(false);

      await EnrollmentService.enroll('1', 'Test Course');

      expect(mockNotificationService.scheduleEnrollmentReminder).not.toHaveBeenCalled();
    });

    it('should handle enrollment errors', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(EnrollmentService.enroll('1', 'Test Course')).rejects.toThrow('Storage error');
    });
  });

  describe('unenroll', () => {
    it('should unenroll from a course successfully', async () => {
      const existingEnrollments = [
        { courseId: '1', enrolledAt: '2023-01-01T00:00:00.000Z' },
        { courseId: '2', enrolledAt: '2023-01-02T00:00:00.000Z' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingEnrollments));

      await EnrollmentService.unenroll('1');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'course_enrollments',
        JSON.stringify([{ courseId: '2', enrolledAt: '2023-01-02T00:00:00.000Z' }])
      );
    });

    it('should cancel enrollment reminders when unenrolling', async () => {
      const existingEnrollments = [
        { courseId: '1', enrolledAt: '2023-01-01T00:00:00.000Z' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingEnrollments));

      await EnrollmentService.unenroll('1');

      expect(mockNotificationService.cancelEnrollmentReminders).toHaveBeenCalledWith('1');
    });

    it('should handle unenrollment errors', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(EnrollmentService.unenroll('1')).rejects.toThrow('Storage error');
    });
  });

  describe('updateLastAccessed', () => {
    it('should update last accessed time successfully', async () => {
      const existingEnrollments = [
        { courseId: '1', enrolledAt: '2023-01-01T00:00:00.000Z' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingEnrollments));

      await EnrollmentService.updateLastAccessed('1');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'course_enrollments',
        expect.stringContaining('"lastAccessedAt"')
      );
    });

    it('should handle update errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      await expect(EnrollmentService.updateLastAccessed('1')).resolves.toBeUndefined();
    });
  });

  describe('getEnrollmentDate', () => {
    it('should return enrollment date when course is enrolled', async () => {
      const existingEnrollments = [
        { courseId: '1', enrolledAt: '2023-01-01T00:00:00.000Z' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingEnrollments));

      const result = await EnrollmentService.getEnrollmentDate('1');
      expect(result).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should return null when course is not enrolled', async () => {
      const result = await EnrollmentService.getEnrollmentDate('1');
      expect(result).toBeNull();
    });
  });

  describe('scheduleEnrollmentReminder', () => {
    it('should schedule enrollment reminder successfully', async () => {
      mockNotificationService.areNotificationsEnabled.mockResolvedValue(true);
      mockNotificationService.scheduleEnrollmentReminder.mockResolvedValue('notification-id');

      const result = await EnrollmentService.scheduleEnrollmentReminder('1', 'Test Course');

      expect(result).toBe('notification-id');
      expect(mockNotificationService.scheduleEnrollmentReminder).toHaveBeenCalledWith({
        courseId: '1',
        courseTitle: 'Test Course',
        scheduledDate: expect.any(Date),
      });
    });

    it('should return null when notifications are disabled', async () => {
      mockNotificationService.areNotificationsEnabled.mockResolvedValue(false);

      const result = await EnrollmentService.scheduleEnrollmentReminder('1', 'Test Course');

      expect(result).toBeNull();
      expect(mockNotificationService.scheduleEnrollmentReminder).not.toHaveBeenCalled();
    });

    it('should handle scheduling errors gracefully', async () => {
      mockNotificationService.areNotificationsEnabled.mockResolvedValue(true);
      mockNotificationService.scheduleEnrollmentReminder.mockRejectedValue(new Error('Scheduling failed'));

      const result = await EnrollmentService.scheduleEnrollmentReminder('1', 'Test Course');

      expect(result).toBeNull();
    });
  });

  describe('cancelEnrollmentReminders', () => {
    it('should cancel enrollment reminders successfully', async () => {
      await EnrollmentService.cancelEnrollmentReminders('1');

      expect(mockNotificationService.cancelEnrollmentReminders).toHaveBeenCalledWith('1');
    });

    it('should handle cancellation errors gracefully', async () => {
      mockNotificationService.cancelEnrollmentReminders.mockImplementation(() => {
        throw new Error('Cancellation failed');
      });

      // Should not throw
      await expect(EnrollmentService.cancelEnrollmentReminders('1')).resolves.toBeUndefined();
    });
  });

  describe('getScheduledNotificationIds', () => {
    it('should return scheduled notification IDs', async () => {
      const mockNotifications = [
        { courseId: '1', notificationId: 'notif-1', scheduledDate: '2023-01-01T00:00:00.000Z' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockNotifications));

      const result = await EnrollmentService.getScheduledNotificationIds();
      expect(result).toEqual(mockNotifications);
    });

    it('should return empty array when no notifications exist', async () => {
      const result = await EnrollmentService.getScheduledNotificationIds();
      expect(result).toEqual([]);
    });
  });

  describe('clearAllEnrollments', () => {
    it('should clear all enrollments and notifications', async () => {
      await EnrollmentService.clearAllEnrollments();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('course_enrollments');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('enrollment_notification_ids');
      expect(mockNotificationService.cancelAllNotifications).toHaveBeenCalled();
    });

    it('should handle clearing errors', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(EnrollmentService.clearAllEnrollments()).rejects.toThrow('Storage error');
    });
  });
}); 