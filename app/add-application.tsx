import { useLocalSearchParams, useRouter } from "expo-router";
import { useApplications } from "../context/ApplicationContext";
import { useCallback, useEffect, useState } from "react";
import { Application, Stage, PREDEFINED_STAGES, CHANNELS } from "../types";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Button,
  View,
  Modal,
  Pressable,
} from "react-native";
import React from "react";
import DateTimePicker from "@react-native-community/datetimepicker";

const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const AddApplicationScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const {
    applications,
    addApplication,
    updateApplication,
    addStage,
    getApplicationById,
    getSuggestedStageNames,
  } = useApplications();
  const [companyName, setCompanyName] = useState(" ");
  const [jobTitle, setJobTitle] = useState("");
  const [applicationDate, setApplicationDate] = useState(
    formatDate(new Date())
  );
  const [channel, setChannel] = useState(CHANNELS[0] || "");
  const [showApplicationDatePicker, setShowApplicationDatePicker] =
    useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);

  const [newStageName, setNewStageName] = useState("");
  const [newStageDate, setNewStageDate] = useState(formatDate(new Date()));
  const [showNewStageDatePicker, setShowNewStageDatePicker] = useState(false);
  const [newStageNotes, setNewStageNotes] = useState("");
  const [showStageSelectionModal, setShowStageSelectionModal] = useState(false);
  const [availableStagesForSelection, setAvailableStagesForSelection] =
    useState<string[]>([]);
  const [stageSuggestions, setStageSuggestions] = useState<string[]>([]);

  const [currentApplication, setCurrentApplication] = useState<
    Application | undefined
  >(undefined);

  useEffect(() => {
    setAvailableStagesForSelection(getSuggestedStageNames(""));
  }, [getSuggestedStageNames, applications]);

  useEffect(() => {
    if (id && typeof id === "string") {
      const application = getApplicationById(id);
      if (application) {
        setCurrentApplication(application);
        setCompanyName(application.companyName);
        setJobTitle(application.jobTitle);
        setApplicationDate(application.applicationDate);
        setChannel(application.channel || CHANNELS[0]);
      } else {
        Alert.alert(
          "Application not found",
          "The application you tried to edit was not found"
        );
        router.replace("/add-application");
      }
    } else {
      setCurrentApplication(undefined);
      setCompanyName("");
      setJobTitle("");
      setChannel(CHANNELS[0]);
      setApplicationDate(formatDate(new Date()));
      setNewStageName("");
      setNewStageDate(formatDate(new Date()));
      setNewStageNotes("");
    }
  }, [id, applications, getApplicationById, router]);

  const handleApplicationDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowApplicationDatePicker(Platform.OS == "ios");
    setApplicationDate(formatDate(currentDate));
  };

  const handleNewStageDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowNewStageDatePicker(Platform.OS === "ios");
    setNewStageDate(formatDate(currentDate));
  };

  const handleSaveJob = async () => {
    if (!companyName || !jobTitle || !applicationDate || !channel) {
      Alert.alert(
        "Missing Info",
        "Company Name, Job Title, Channel and Application Date are required"
      );
      return;
    }
    if (currentApplication) {
      const updatedApplicationDetails: Application = {
        ...currentApplication,
        companyName,
        jobTitle,
        applicationDate,
        channel,
      };
      await updateApplication(updatedApplicationDetails);
      console.log("after await");
      Alert.alert("Success", "Application Details updated");
    } else {
      await addApplication(companyName, jobTitle, applicationDate, channel);
      Alert.alert("Success", "New Application added");
      router.back();
    }
  };

  const handleAddNewStage = async () => {
    if (!currentApplication) {
      Alert.alert("Error", "Cannot add stage: Application not found");
      return;
    }
    if (!newStageName || !newStageDate) {
      Alert.alert("Missing Info", "Stage Name and Date are required");
      return;
    }

    await addStage(
      currentApplication.id,
      newStageName,
      newStageDate,
      newStageNotes
    );
    Alert.alert("Success", `Stage "${newStageName}" added`);
    setNewStageName("");
    setNewStageDate(formatDate(new Date()));
    setNewStageNotes("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}> Application Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Company Name"
          value={companyName}
          onChangeText={setCompanyName}
        />
        <TextInput
          style={styles.input}
          placeholder="Job Title"
          value={jobTitle}
          onChangeText={setJobTitle}
        />
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Channel:</Text>
          <TouchableOpacity
            onPress={() => setShowChannelModal(true)}
            style={styles.datePickerButton}
          >
            <Text>{channel || "Select Channel"}</Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={showChannelModal}
          onRequestClose={() => setShowChannelModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowChannelModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Channel</Text>
              {CHANNELS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.modalOption,
                    channel === opt && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setChannel(opt);
                    setShowChannelModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
        <TouchableOpacity
          onPress={() => setShowApplicationDatePicker(true)}
          style={styles.datePickerButton}
        >
          <Text>Application Date: {applicationDate}</Text>
        </TouchableOpacity>
        {showApplicationDatePicker && (
          <DateTimePicker
            testID="applicationDatePicker"
            value={new Date(applicationDate)}
            mode="date"
            display="default"
            onChange={handleApplicationDateChange}
          />
        )}

        <Button
          title={
            currentApplication
              ? "Update Application Details"
              : "Save New Application"
          }
          onPress={handleSaveJob}
        />

        {currentApplication && (
          <>
            <View style={styles.seperator} />
            <Text style={styles.sectionTitle}> Application History</Text>
            {currentApplication.stages.length === 0 ? (
              <Text style={styles.noHistoryText}>
                No stages recorded yet. Add one below!
              </Text>
            ) : (
              <View>
                {currentApplication.stages.map((stage, index) => (
                  <View key={index} style={styles.stageItem}>
                    <Text style={styles.stageName}>{stage.name}</Text>
                    <Text style={styles.stageDate}>{stage.date}</Text>
                    {stage.notes && (
                      <Text style={styles.stageNotes}>{stage.notes}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
            <View style={styles.seperator} />
            <Text style={styles.sectionTitle}>Add new Stage</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Stage Name:</Text>
              <TouchableOpacity
                onPress={() => setShowStageSelectionModal(true)}
                style={styles.datePickerButton}
              >
                <Text>{newStageName || "Select Stage"}</Text>
              </TouchableOpacity>
            </View>

            <Modal
              animationType="slide"
              transparent={true}
              visible={showStageSelectionModal}
              onRequestClose={() => setShowStageSelectionModal(false)}
            >
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setShowStageSelectionModal(false)}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Stage</Text>
                  <ScrollView style={styles.modalOptionsScrollView}>
                    {availableStagesForSelection.map((stageName) => (
                      <TouchableOpacity
                        key={stageName}
                        style={[
                          styles.modalOption,
                          newStageName === stageName &&
                            styles.modalOptionSelected,
                        ]}
                        onPress={() => {
                          setNewStageName(stageName);
                          setShowStageSelectionModal(false);
                        }}
                      >
                        <Text style={styles.modalOptionText}>{stageName}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </Pressable>
            </Modal>
            <TouchableOpacity
              onPress={() => setShowNewStageDatePicker(true)}
              style={styles.datePickerButton}
            >
              <Text>Stage Date: {newStageDate}</Text>
            </TouchableOpacity>
            {showNewStageDatePicker && (
              <DateTimePicker
                testID="newStageDatePicker"
                value={new Date(newStageDate)}
                mode="date"
                display="default"
                onChange={handleNewStageDateChange}
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Notes (optional)"
              value={newStageNotes}
              onChangeText={setNewStageNotes}
              multiline
              numberOfLines={3}
            />
            <Button
              title="Add Stage to Application"
              onPress={handleAddNewStage}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 50,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 40,
  },
  seperator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 20,
  },
  stageItem: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#007bff",
  },
  stageName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  stageDate: { fontSize: 12, color: "#666", marginTop: 2 },
  stageNotes: {
    fontSize: 14,
    color: "#333",
    marginTop: 5,
    fontStyle: "italic",
  },
  suggestionsContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 10,
    maxHeight: 150,
    overflow: "hidden",
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fefefe",
  },
  noHistoryText: {
    textAlign: "center",
    color: "#666",
    marginTop: 10,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#555",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalOptionSelected: {
    backgroundColor: "#e6f0ff",
    borderRadius: 5,
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  modalOptionsScrollView: { 
    flexGrow: 1, 
    maxHeight: '80%',
  },
});

export default AddApplicationScreen;
