import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router'; 
import { useApplications } from '../context/ApplicationContext';
import { Application, Stage } from '../types';

const FILTER_OPTIONS = [
  'All',
  'Active', 
  'Rejected',
  'Offer Received',
  'Applied',
  'Interview',
  'Ghosted',
];

const SORT_OPTIONS = [
  { label: 'Date Added (Newest)', value: 'applicationDateDesc' },
  { label: 'Date Added (Oldest)', value: 'applicationDateAsc' },
  { label: 'Last Updated (Newest)', value: 'lastStageDateDesc' },
  { label: 'Company Name (A-Z)', value: 'companyAsc' },
  { label: 'Job Title (A-Z)', value: 'jobTitleAsc' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { applications, loading, deleteApplication, forceRefresh } = useApplications();
  const [refreshing, setRefreshing] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedSort, setSelectedSort] = useState('applicationDateDesc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      forceRefresh();
    }, [forceRefresh])
  );

  const handleDeleteJob = (jobId: string) => {
    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this job application?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            await deleteApplication(jobId);
            Alert.alert('Deleted', 'Job application removed.');
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const filteredAndSortedApplications = useMemo(() => {
    let filtered = [...applications];

    if (selectedFilter !== 'All') {
      filtered = filtered.filter(job => {
        const lastStageName = job.stages[job.stages.length - 1]?.name;
        if (!lastStageName) return false;

        switch (selectedFilter) {
          case 'Active':
            return !(
              lastStageName === 'Rejected' ||
              lastStageName === 'Ghosted' ||
              lastStageName === 'Offer Accepted' ||
              lastStageName === 'Offer Declined'
            );
          case 'Rejected':
          case 'Offer Received':
          case 'Ghosted':
          case 'Applied':
            return lastStageName === selectedFilter;
          case 'Interview':
            return lastStageName.toLowerCase().includes('interview');
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      switch (selectedSort) {
        case 'applicationDateDesc':
          return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
        case 'applicationDateAsc':
          return new Date(a.applicationDate).getTime() - new Date(b.applicationDate).getTime();
        case 'lastStageDateDesc':
          const lastStageA = a.stages[a.stages.length - 1]?.date;
          const lastStageB = b.stages[b.stages.length - 1]?.date;
          if (!lastStageA && !lastStageB) return 0;
          if (!lastStageA) return 1;
          if (!lastStageB) return -1;
          return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
        case 'companyAsc':
          valA = a.companyName.toLowerCase();
          valB = b.companyName.toLowerCase();
          return valA.localeCompare(valB);
        case 'jobTitleAsc':
          valA = a.jobTitle.toLowerCase();
          valB = b.jobTitle.toLowerCase();
          return valA.localeCompare(valB);
        default:
          return 0;
      }
    });

    return filtered;
  }, [applications, selectedFilter, selectedSort]);

  const renderJobItem = ({ item }: { item: Application }) => (
    <TouchableOpacity
      style={styles.jobItem}
      onPress={() => router.push({ pathname: '/add-application', params: { id: item.id } })}
      onLongPress={() => handleDeleteJob(item.id)}
    >
      <View style={styles.jobTextContainer}>
        <Text style={styles.companyName}>{item.companyName}</Text>
        <Text style={styles.jobTitle}>{item.jobTitle}</Text>
        <Text style={styles.applicationDate}>Applied: {item.applicationDate}</Text>
        {item.stages.length > 0 && (
          <Text style={styles.currentStage}>
            Current Stage: {item.stages[item.stages.length - 1]?.name} (
            {item.stages[item.stages.length - 1]?.date})
          </Text>
        )}
      </View>
      <View style={styles.itemButtons}>
        <Link href={{ pathname: '/add-application', params: { id: item.id } }} asChild>
          <Button title="Edit" />
        </Link>
        <Button title="Del" onPress={() => handleDeleteJob(item.id)} color="#dc3545" />
      </View>
    </TouchableOpacity>
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await forceRefresh();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterSortContainer}>
        <TouchableOpacity style={styles.filterSortButton} onPress={() => setShowFilterModal(true)}>
          <Text style={styles.filterSortButtonText}>Filter: {selectedFilter}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterSortButton} onPress={() => setShowSortModal(true)}>
          <Text style={styles.filterSortButtonText}>Sort: {SORT_OPTIONS.find(opt => opt.value === selectedSort)?.label}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading job data...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedApplications} // Use the memoized data
          keyExtractor={(item) => item.id}
          renderItem={renderJobItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Text style={styles.emptyListText}>No job applications match filter/sort.</Text>
              <Text style={styles.emptyListSubtext}>Try adjusting your selections or add new jobs!</Text>
            </View>
          }
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}

      <View style={styles.buttonContainer}>
        <Link href="/add-application" asChild>
          <Button title="Add New Job" />
        </Link>
        <Link href="/sankey-diagram" asChild>
          <Button title="View Sankey Map" />
        </Link>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showFilterModal}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Status</Text>
            {FILTER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalOption,
                  selectedFilter === option && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setSelectedFilter(option);
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showSortModal}
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSortModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort by</Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  selectedSort === option.value && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setSelectedSort(option.value);
                  setShowSortModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 80,
  },
  jobItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  applicationDate: {
    fontSize: 12,
    color: '#888',
  },
  currentStage: {
    fontSize: 13,
    color: '#007bff',
    fontWeight: '500',
    marginTop: 5,
  },
  itemButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    padding: 20,
  },
  emptyListText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyListSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  filterSortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  filterSortButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  filterSortButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionSelected: {
    backgroundColor: '#e6f0ff',
    borderRadius: 5,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
});