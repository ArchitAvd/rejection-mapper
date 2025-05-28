// app/index.tsx
import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useApplications } from '../context/ApplicationContext';
import { Application } from '../types';

export default function HomeScreen() {
  const router = useRouter();
  const { applications, loading, deleteApplication, forceRefresh } = useApplications();

  const sortedApplications = [...applications].sort((a, b) => {
    const latestStageA = a.stages.length > 0 ? a.stages[a.stages.length - 1].date : a.applicationDate;
    const latestStageB = b.stages.length > 0 ? b.stages[b.stages.length - 1].date : b.applicationDate;
    return new Date(latestStageB).getTime() - new Date(latestStageA).getTime(); 
  });

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Application",
      "Are you sure you want to delete this application?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            await deleteApplication(id);
            Alert.alert("Deleted", "Job application deleted successfully.");
          },
          style: "destructive"
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Application }) => {
    const latestStage = item.stages.length > 0 ? item.stages[item.stages.length - 1] : undefined;
    const currentStatus = latestStage ? latestStage.name : "N/A";
    const statusDate = latestStage ? latestStage.date : item.applicationDate;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.push({ pathname: "/add-application", params: { id: item.id } })}
      >
        <View style={styles.info}>
          <Text style={styles.company}>{item.companyName}</Text>
          <Text style={styles.title}>{item.jobTitle}</Text>
          <Text style={styles.status}>Status: {currentStatus} ({statusDate})</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>X</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading applications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Your Applications</Text>

      {sortedApplications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No applications logged yet.</Text>
          <Text style={styles.emptyStateText}>Start by adding one!</Text>
        </View>
      ) : (
        <FlatList
          data={sortedApplications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  info: {
    flex: 1,
  },
  company: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  title: {
    fontSize: 16,
    color: '#555',
    marginTop: 2,
  },
  status: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
    fontStyle: 'italic',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
  },
});