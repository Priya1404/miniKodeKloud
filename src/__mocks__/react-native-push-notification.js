const mockPushNotification = {
  configure: jest.fn(),
  createChannel: jest.fn(),
  localNotification: jest.fn(),
  localNotificationSchedule: jest.fn(),
  cancelLocalNotification: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
  getScheduledLocalNotifications: jest.fn(),
  getDeliveredNotifications: jest.fn(),
  removeAllDeliveredNotifications: jest.fn(),
  setApplicationIconBadgeNumber: jest.fn(),
  getApplicationIconBadgeNumber: jest.fn(),
  requestPermissions: jest.fn().mockResolvedValue({ alert: true, badge: true, sound: true }),
  checkPermissions: jest.fn().mockResolvedValue({ alert: true, badge: true, sound: true }),
  onRegister: jest.fn(),
  onNotification: jest.fn(),
  onAction: jest.fn(),
  onRegistrationError: jest.fn(),
};

const Importance = {
  HIGH: 'high',
  DEFAULT: 'default',
  LOW: 'low',
  MIN: 'min',
  NONE: 'none',
};

module.exports = mockPushNotification;
module.exports.default = mockPushNotification;
module.exports.Importance = Importance; 