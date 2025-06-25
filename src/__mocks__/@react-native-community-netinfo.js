const mockUnsubscribe = jest.fn();

const mockNetInfo = {
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    isWifi: true,
    isCellular: false,
  }),
  addEventListener: jest.fn().mockReturnValue(mockUnsubscribe),
  useNetInfo: jest.fn().mockReturnValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    isWifi: true,
    isCellular: false,
  }),
};

module.exports = mockNetInfo;
module.exports.default = mockNetInfo; 