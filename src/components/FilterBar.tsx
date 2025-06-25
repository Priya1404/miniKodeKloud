import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { setCourseFilters, clearCourseFilters } from '../store/courseSlice';
import CategoryFilterModal from './CategoryFilterModal';
import { RootState } from '../store';
import TutorFilterModal from './TutorFilterModal';
import PlanFilterModal from './PlanFilterModal';
import SortFilterModal from './SortFilterModal';
import { SORT_OPTIONS } from '../models/Course';

interface FilterBarProps {
  planOptions: string[];
}

const FilterBar: React.FC<FilterBarProps> = ({ planOptions }) => {
  const dispatch = useAppDispatch();
  const { categories, tutors, filters } = useAppSelector((state: RootState) => state.courses);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [tutorModalVisible, setTutorModalVisible] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const selectedCategories = Array.isArray(filters.category) ? filters.category : filters.category ? [filters.category] : [];
  const selectedTutors = Array.isArray(filters.tutorId) ? filters.tutorId : filters.tutorId ? [filters.tutorId] : [];
  const selectedPlans = Array.isArray(filters.plan) ? filters.plan : filters.plan ? [filters.plan] : [];
  const selectedSort = filters.sortBy ? [filters.sortBy] : [];

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== filters.search) {
        dispatch(setCourseFilters({ search: searchTerm }));
      }
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, dispatch, filters.search]);

  const handleSelectCategory = (categoryIds: string[]) => {
    const categoryNames = categoryIds.map(id => categories.find(c => c.id === id)?.name).filter((name): name is string => Boolean(name));
    dispatch(setCourseFilters({ category: categoryNames }));
    setCategoryModalVisible(false);
  };

  const handleSelectTutor = (tutorIds: string[]) => {
    const tutorNames = tutorIds.map(id => tutors.find(t => t.id === id)?.name).filter((name): name is string => Boolean(name));
    if (tutorNames.length > 0) {
      dispatch(setCourseFilters({ tutorName: tutorNames[0] }));
    } else {
      dispatch(setCourseFilters({ tutorName: undefined }));
    }
    setTutorModalVisible(false);
  };

  const handleSelectPlan = (planIds: string[]) => {
    dispatch(setCourseFilters({ plan: planIds }));
    setTypeModalVisible(false);
  };

  const handleSelectSort = (sortIds: string[]) => {
    let sort_by = undefined;
    if (sortIds[0] === 'newest') sort_by = 'created_at.desc';
    if (sort_by) {
      dispatch(setCourseFilters({ sort_by }));
    } else {
      dispatch(setCourseFilters({ sort_by: undefined }));
    }
    setSortModalVisible(false);
  };

  const handleClearFilters = () => {
    dispatch(clearCourseFilters());
    setSearchTerm('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search Courses..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      <View style={styles.filterRow}>
        <View style={styles.filterButtonsContainer}>
          <TouchableOpacity style={styles.filterButton} onPress={() => setCategoryModalVisible(true)}>
            <Text style={styles.filterButtonText}>
              {selectedCategories.length > 0 ? selectedCategories.join(', ') : 'Category'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={() => setTutorModalVisible(true)}>
            <Text style={styles.filterButtonText}>
              {selectedTutors.length > 0 ? selectedTutors.join(', ') : 'Tutor'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={() => setTypeModalVisible(true)}>
            <Text style={styles.filterButtonText}>
              {selectedPlans.map(id => planOptions.find(p => p === id)?.toUpperCase()).join(', ') || 'Type'}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.sortRow}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.filterButton} onPress={() => setSortModalVisible(true)}>
          <Text style={styles.filterButtonText}>
            {selectedSort.map(id => [...SORT_OPTIONS].find(s => s.id === id)?.label).join(', ') || 'Sort By'}
          </Text>
        </TouchableOpacity>
      </View>
      <CategoryFilterModal
        visible={categoryModalVisible}
        categories={categories}
        selected={selectedCategories}
        onApply={handleSelectCategory}
        onClose={() => setCategoryModalVisible(false)}
      />
      <TutorFilterModal
        visible={tutorModalVisible}
        tutors={tutors}
        selected={selectedTutors}
        onApply={handleSelectTutor}
        onClose={() => setTutorModalVisible(false)}
      />
      <PlanFilterModal
        visible={typeModalVisible}
        plans={planOptions}
        selected={selectedPlans}
        onApply={handleSelectPlan}
        onClose={() => setTypeModalVisible(false)}
      />
      <SortFilterModal
        visible={sortModalVisible}
        sortOptions={[...SORT_OPTIONS]}
        selected={selectedSort}
        onApply={handleSelectSort}
        onClose={() => setSortModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    height: 40,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonText: {
    color: '#333',
  },
  clearButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginLeft: 8,
  },
  clearButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
});

export default FilterBar; 