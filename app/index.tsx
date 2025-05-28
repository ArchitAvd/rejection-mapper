import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useApplications } from "../context/ApplicationContext";
import { Application } from "../types";

export default function HomeScreen() {
  const router = useRouter();
  const { applications, loading, deleteApplication, forceRefresh } =
    useApplications();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      forceRefresh();
      return () => {};
    }, [forceRefresh])
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Application",
      "Are you sure you want to delete this application?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            await deleteApplication(id);
            Alert.alert("Deleted", "Job application deleted successfully.");
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }: { item: Application }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() =>
        router.push({ pathname: "/add-application", params: { id: item.id } })
      }
      onLongPress={() => handleDelete(item.id)}
    >
      <View style={styles.textContainer}>
        <Text style={styles.companyName}>{item.companyName}</Text>
        <Text style={styles.title}>{item.jobTitle}</Text>
        <Text style={styles.applicationDate}>
          Applied: {item.applicationDate}
        </Text>
        {item.stages.length > 0 && (
          <Text style={styles.currentStage}>
            Current Stage: {item.stages[item.stages.length - 1]?.name} (
            {item.stages[item.stages.length - 1]?.date})
          </Text>
        )}
      </View>
      <View style={styles.itemButtons}>
        <Link
          href={{ pathname: "/add-application", params: { id: item.id } }}
          asChild
        >
          <Button title="Edit" />
        </Link>
        <Button
          title="Delete"
          onPress={() => handleDelete(item.id)}
          color="#dc3545"
        />
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
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <FlatList
            data={applications.sort(
              (a, b) =>
                new Date(b.applicationDate).getTime() -
                new Date(a.applicationDate).getTime()
            )}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyListContainer}>
                <Text style={styles.emptyListText}>
                  No applications added yet
                </Text>
                <Text style={styles.emptyListSubtext}>
                  Tap "Add new application" to get started
                </Text>
              </View>
            }
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
          <View style={styles.buttonContainer}>
            <Link href="/add-application" asChild>
              <Button title="Add New Application" />
            </Link>
            <Link href="/sankey-diagram" asChild>
              <Button title="View Sankey Map" />
            </Link>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f8f8f8",
  },
  listContent: {
    paddingBottom: 80,
  },
  item: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    color: "#555",
    marginBottom: 4,
  },
  applicationDate: {
    fontSize: 12,
    color: "#888",
  },
  currentStage: {
    fontSize: 13,
    color: "#007bff",
    fontWeight: "500",
    marginTop: 5,
  },
  itemButtons: {
    flexDirection: "column",
    gap: 8,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
    padding: 20,
  },
  emptyListText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyListSubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
});
