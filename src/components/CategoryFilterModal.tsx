import React, {useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {View,
  Modal,
  Text, 
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert} from 'react-native';
import {Category} from '../models/Category';


interface CategoryFilterModalProps {
  visible: boolean;
  categories: Category[];
  selected: string[];
  onApply: (categoryIds: string[]) => void;
  onClose: () => void;
}



const CategoryFilterModal: React.FC<CategoryFilterModalProps> = ({ visible, categories, selected, onApply, onClose }) => {
  const [pending, setPending] = useState<string[]>(selected);
  const toggleCategory = (id: string) => {
    setPending((prev) => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
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
        [ {text: 'No', style: 'cancel'},
          {text: 'Yes', style: 'destructive', onPress: onClose},
        ]
      );
    } else 
    {
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

          <Text style={styles.headerText}>Select Category</Text>
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
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const checked = pending.includes(item.id);
            return (
              <TouchableOpacity style={styles.itemContainer} onPress={() => toggleCategory(item.id)}>
                <Text style={styles.itemText}>{item.name}</Text>
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
  header:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText:  {
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

export default CategoryFilterModal; 