import React, { useState } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface PlanFilterModalProps {
  visible: boolean;
  plans: string[];
  selected: string[];
  onApply: (planIds: string[]) => void;
  onClose: () => void;
}

const PlanFilterModal: React.FC<PlanFilterModalProps> = ({ visible, plans, selected, onApply, onClose }) => {
  const [pending, setPending] = useState<string[]>(selected);

  const togglePlan = (plan: string) => {
    setPending((prev) => prev.includes(plan) ? prev.filter(pid => pid !== plan) : [...prev, plan]);
  };

  const handleApply = () => {
    onApply(pending);
  };

  const handleClear = () => {
    setPending([]);
  };

  const handleClose = () => {
    if (pending.sort().join(',') !== selected.sort().join(',')) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to exit?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
            <Ionicons name="close-outline" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Select Type</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
        <FlatList
          data={plans}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const checked = pending.includes(item);
            return (
              <TouchableOpacity style={styles.itemContainer} onPress={() => togglePlan(item)}>
                <Text style={styles.itemText}>{item}</Text>
                {checked && <Ionicons name="checkmark-outline" size={20} color="#007AFF" style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    padding: 8,
  },
  applyButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
    marginRight: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    fontSize: 18,
  },
});

export default PlanFilterModal; 