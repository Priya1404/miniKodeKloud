import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const OfflineBanner: React.FC = () => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  const isOnline = isConnected && isInternetReachable;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.dotContainer,
          { top: insets.top + 8 },
        ]}
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
      >
        <View style={[styles.dot, { backgroundColor: isOnline ? '#4CAF50' : '#FF3B30' }]}> 
          {!isOnline && (
            <Ionicons name="alert-circle" size={16} color="#fff" style={styles.exclamation} />
          )}
        </View>
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.statusModal}>
            <Ionicons
              name={isOnline ? 'checkmark-circle' : 'alert-circle'}
              size={32}
              color={isOnline ? '#4CAF50' : '#FF3B30'}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.statusText}>
              {isOnline ? 'You are online. Content is synced.' : 'You are offline. Some features may be unavailable.'}
            </Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dotContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 200,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  exclamation: {
    position: 'absolute',
    top: 2,
    left: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  statusText: {
    color: '#222',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 4,
  },
}); 