class MockMMKV {
  constructor() {
    this.storage = new Map();
  }

  set = jest.fn((key, value) => {
    this.storage.set(key, value);
  });

  getString = jest.fn((key) => {
    return this.storage.get(key) || '';
  });

  getNumber = jest.fn((key) => {
    const value = this.storage.get(key);
    return typeof value === 'number' ? value : 0;
  });

  getBoolean = jest.fn((key) => {
    const value = this.storage.get(key);
    return typeof value === 'boolean' ? value : false;
  });

  delete = jest.fn((key) => {
    return this.storage.delete(key);
  });

  clearAll = jest.fn(() => {
    this.storage.clear();
  });

  contains = jest.fn((key) => {
    return this.storage.has(key);
  });

  getAllKeys = jest.fn(() => {
    return Array.from(this.storage.keys());
  });
}

module.exports = MockMMKV;
module.exports.default = MockMMKV; 