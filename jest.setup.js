// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  const ScrollView = require('react-native/Libraries/Components/ScrollView/ScrollView');
  const TouchableOpacity = require('react-native/Libraries/Components/Touchable/TouchableOpacity');
  
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    Directions: {},
    gestureHandlerRootHOC: jest.fn((component) => component),
    TouchableHighlight: TouchableOpacity,
    TouchableNativeFeedback: TouchableOpacity,
    TouchableOpacity,
    TouchableWithoutFeedback: TouchableOpacity,
  };
});

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    contains: jest.fn(),
    getAllKeys: jest.fn(),
  })),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-push-notification
jest.mock('react-native-push-notification', () => {
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

  return {
    ...mockPushNotification,
    default: mockPushNotification,
    Importance,
  };
});

// Mock NetInfo
const mockUnsubscribe = jest.fn();
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ 
    isConnected: true, 
    isInternetReachable: true,
    type: 'wifi',
    isWifi: true,
    isCellular: false,
  })),
  addEventListener: jest.fn(() => mockUnsubscribe),
  useNetInfo: jest.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    isWifi: true,
    isCellular: false,
  })),
}));

// Global test setup
global.console = {
  ...console,
  error: jest.fn(),
}; 