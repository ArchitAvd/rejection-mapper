import React, { JSX, useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useApplications } from "../context/ApplicationContext";
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
  View,
  Modal,
  Pressable,
  StatusBar,
  useColorScheme,
  Animated,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  FontAwesome,
  MaterialCommunityIcons,
  FontAwesome5,
  FontAwesome6,
  Entypo,
  Fontisto,
  Foundation,
  MaterialIcons,
  AntDesign,
} from "@expo/vector-icons";

interface AddApplicationScreenProps {}

const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const AddApplicationScreen: React.FC<AddApplicationScreenProps> = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { id } = useLocalSearchParams<{ id?: string }>();

  const {
    applications,
    addApplication,
    updateApplication,
    addStage,
    getApplicationById,
    getSuggestedStageNames,
  } = useApplications();

  // Form state
  const [companyName, setCompanyName] = useState<string>("");
  const [jobTitle, setJobTitle] = useState<string>("");
  const [applicationDate, setApplicationDate] = useState<string>(
    formatDate(new Date())
  );
  const [channel, setChannel] = useState<string>(CHANNELS[0] || "");

  // Modal states
  const [showApplicationDatePicker, setShowApplicationDatePicker] =
    useState<boolean>(false);
  const [showChannelModal, setShowChannelModal] = useState<boolean>(false);

  // Stage form state
  const [newStageName, setNewStageName] = useState<string>("");
  const [newStageDate, setNewStageDate] = useState<string>(
    formatDate(new Date())
  );
  const [showNewStageDatePicker, setShowNewStageDatePicker] =
    useState<boolean>(false);
  const [newStageNotes, setNewStageNotes] = useState<string>("");
  const [showStageSelectionModal, setShowStageSelectionModal] =
    useState<boolean>(false);

  // Application state
  const [currentApplication, setCurrentApplication] = useState<
    Application | undefined
  >(undefined);
  const [availableStagesForSelection, setAvailableStagesForSelection] =
    useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  const styles = getStyles(isDark);

  const CHANNEL_ICONS: Record<string, JSX.Element> = {
    LinkedIn: <FontAwesome6 name="linkedin" style={styles.modalOptionIcon} />,
    "Company Website": (
      <MaterialCommunityIcons name="web" style={styles.modalOptionIcon} />
    ),
    Glassdoor: <Fontisto name="webpack" style={styles.modalOptionIcon} />,
    Referral: <Fontisto name="webpack" style={styles.modalOptionIcon} />,
    Other: <Fontisto name="webpack" style={styles.modalOptionIcon} />,
  };

  const STAGE_ICONS: Record<string, JSX.Element> = {
    Applied: (
      <FontAwesome5 name="envelope-open-text" style={styles.modalOptionIcon} />
    ),
    Rounds: <FontAwesome5 name="briefcase" style={styles.modalOptionIcon} />,
    Ghosted: <FontAwesome6 name="skull" style={styles.modalOptionIcon} />,
    Rejected: (
      <Entypo name="circle-with-cross" style={styles.modalOptionIcon} />
    ),
    Offer: <Foundation name="page-pdf" style={styles.modalOptionIcon} />,
    Withdrew: <AntDesign name="back" style={styles.modalOptionIcon} />,
    Accepted: (
      <MaterialCommunityIcons
        name="party-popper"
        style={styles.modalOptionIcon}
      />
    ),
    Declined: (
      <Entypo name="circle-with-cross" style={styles.modalOptionIcon} />
    ),
    Finished: (
      <MaterialCommunityIcons
        name="timer-sand-complete"
        style={styles.modalOptionIcon}
      />
    ),
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
          "Application Not Found",
          "The application you tried to edit was not found",
          [{ text: "OK", onPress: () => router.replace("/add-application") }]
        );
      }
    } else {
      // Reset form for new application
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
    setShowApplicationDatePicker(Platform.OS === "ios");
    setApplicationDate(formatDate(currentDate));
  };

  const handleNewStageDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowNewStageDatePicker(Platform.OS === "ios");
    setNewStageDate(formatDate(currentDate));
  };

  const handleSaveJob = async () => {
    if (
      !companyName.trim() ||
      !jobTitle.trim() ||
      !applicationDate ||
      !channel
    ) {
      Alert.alert(
        "Missing Information",
        "Please fill in all required fields: Company Name, Job Title, Channel, and Application Date"
      );
      return;
    }

    setIsLoading(true);

    try {
      if (currentApplication) {
        const updatedApplicationDetails: Application = {
          ...currentApplication,
          companyName: companyName.trim(),
          jobTitle: jobTitle.trim(),
          applicationDate,
          channel,
        };
        await updateApplication(updatedApplicationDetails);
        Alert.alert("Success", "Application updated successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        await addApplication(
          companyName.trim(),
          channel,
          jobTitle.trim(),
          applicationDate
        );
        Alert.alert("Success", "New application added successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save application. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewStage = async () => {
    if (!currentApplication) {
      Alert.alert("Error", "Cannot add stage: Application not found");
      return;
    }

    if (!newStageName || !newStageDate) {
      Alert.alert("Missing Information", "Stage Name and Date are required");
      return;
    }

    setIsLoading(true);

    try {
      await addStage(
        currentApplication.id,
        newStageName,
        newStageDate,
        newStageNotes.trim()
      );
      Alert.alert("Success", `Stage "${newStageName}" added successfully`);
      setNewStageName("");
      setNewStageDate(formatDate(new Date()));
      setNewStageNotes("");
    } catch (error) {
      Alert.alert("Error", "Failed to add stage. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {currentApplication ? "Edit Application" : "New Application"}
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderFormSection = () => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons
          name="account-details"
          style={styles.sectionIcon}
        />
        <Text style={styles.sectionTitle}>Application Details</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Company Name *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter company name"
          placeholderTextColor={isDark ? "#8E8E93" : "#C7C7CC"}
          value={companyName}
          onChangeText={setCompanyName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Job Title *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter job title"
          placeholderTextColor={isDark ? "#8E8E93" : "#C7C7CC"}
          value={jobTitle}
          onChangeText={setJobTitle}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Application Channel *</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowChannelModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.selectButtonContent}>
            <Text style={styles.selectButtonIcon}>
              {CHANNEL_ICONS[channel] || "📋"}
            </Text>
            <Text style={styles.selectButtonText}>
              {channel || "Select Channel"}
            </Text>
          </View>
          <Text style={styles.selectButtonArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Application Date *</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowApplicationDatePicker(true)}
          activeOpacity={0.7}
        >
          <View style={styles.selectButtonContent}>
            <FontAwesome5 name="calendar-alt" style={styles.selectButtonIcon} />
            <Text style={styles.selectButtonText}>
              {formatDisplayDate(applicationDate)}
            </Text>
          </View>
          <Text style={styles.selectButtonArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          isLoading && styles.primaryButtonDisabled,
        ]}
        onPress={handleSaveJob}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>
          {isLoading
            ? "Saving..."
            : currentApplication
            ? "Update Application"
            : "Save Application"}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStageHistory = () => {
    if (!currentApplication) return null;

    return (
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <FontAwesome6 name="chart-line" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Application Timeline</Text>
        </View>

        {currentApplication.stages.length === 0 ? (
          <View style={styles.emptyState}>
            <Foundation name="target" style={styles.emptyStateIcon} />
            <Text style={styles.emptyStateText}>No stages recorded yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first stage below to track progress
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {currentApplication.stages.map((stage: Stage, index: number) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineMarker}>
                  <Text style={styles.timelineIcon}>
                    {STAGE_ICONS[stage.name] || (
                      <MaterialIcons
                        name="timeline"
                        style={styles.timelineIcon}
                      />
                    )}
                  </Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{stage.name}</Text>
                  <Text style={styles.timelineDate}>
                    {formatDisplayDate(stage.date)}
                  </Text>
                  {stage.notes && (
                    <Text style={styles.timelineNotes}>{stage.notes}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </Animated.View>
    );
  };

  const renderAddStageSection = () => {
    if (!currentApplication) return null;

    return (
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <FontAwesome name="plus" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Add New Stage</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Stage Type *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowStageSelectionModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.selectButtonContent}>
              <Text style={styles.selectButtonIcon}>
                {STAGE_ICONS[newStageName] || (
                  <MaterialIcons name="timeline" style={styles.timelineIcon} />
                )}
              </Text>
              <Text style={styles.selectButtonText}>
                {newStageName || "Select Stage Type"}
              </Text>
            </View>
            <Text style={styles.selectButtonArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Stage Date *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowNewStageDatePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.selectButtonContent}>
              <FontAwesome5
                name="calendar-alt"
                style={styles.selectButtonIcon}
              />
              <Text style={styles.selectButtonText}>
                {formatDisplayDate(newStageDate)}
              </Text>
            </View>
            <Text style={styles.selectButtonArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Notes (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textAreaInput]}
            placeholder="Add any notes about this stage..."
            placeholderTextColor={isDark ? "#8E8E93" : "#C7C7CC"}
            value={newStageNotes}
            onChangeText={setNewStageNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            isLoading && styles.secondaryButtonDisabled,
          ]}
          onPress={handleAddNewStage}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>
            {isLoading ? "Adding Stage..." : "Add Stage"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: string[],
    selectedValue: string,
    onSelect: (value: string) => void,
    iconMap?: Record<string, JSX.Element>
  ) => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalOptions}
            showsVerticalScrollIndicator={false}
          >
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalOption,
                  selectedValue === option && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                {iconMap?.[option] || (
                  <FontAwesome5
                    name="briefcase"
                    size={20}
                    color={isDark ? "white" : "black"}
                  />
                )}
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedValue === option && styles.modalOptionTextSelected,
                  ]}
                >
                  {option}
                </Text>
                {selectedValue === option && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={styles.container.backgroundColor}
        />

        {renderHeader()}

        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderFormSection()}
            {renderStageHistory()}
            {renderAddStageSection()}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Date Pickers */}
        {showApplicationDatePicker && (
          <DateTimePicker
            testID="applicationDatePicker"
            value={new Date(applicationDate)}
            mode="date"
            display="default"
            onChange={handleApplicationDateChange}
          />
        )}

        {showNewStageDatePicker && (
          <DateTimePicker
            testID="newStageDatePicker"
            value={new Date(newStageDate)}
            mode="date"
            display="default"
            onChange={handleNewStageDateChange}
          />
        )}

        {renderModal(
          showChannelModal,
          () => setShowChannelModal(false),
          "Select Application Channel",
          CHANNELS,
          channel,
          setChannel,
          CHANNEL_ICONS
        )}

        {renderModal(
          showStageSelectionModal,
          () => setShowStageSelectionModal(false),
          "Select Stage Type",
          availableStagesForSelection,
          newStageName,
          setNewStageName,
          STAGE_ICONS
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000000" : "#F2F2F7",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#38383A" : "#C6C6C8",
    },
    backButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
      justifyContent: "center",
      alignItems: "center",
    },
    backButtonText: {
      fontSize: 28,
      marginTop: -8,
      color: isDark ? "#007AFF" : "#007AFF",
      fontWeight: "600",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    headerSpacer: {
      width: 32,
    },
    keyboardContainer: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    section: {
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      gap: 12,
    },
    sectionIcon: {
      fontSize: 24,
      color: isDark ? "white" : "black",
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#000000",
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: isDark ? "#FFFFFF" : "#000000",
      borderWidth: 1,
      borderColor: isDark ? "#38383A" : "#E5E5EA",
    },
    textAreaInput: {
      height: 80,
      textAlignVertical: "top",
    },
    selectButton: {
      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
      borderRadius: 12,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: isDark ? "#38383A" : "#E5E5EA",
    },
    selectButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    selectButtonIcon: {
      fontSize: 20,
      color: isDark ? "white" : "black",
    },
    selectButtonText: {
      fontSize: 16,
      color: isDark ? "#FFFFFF" : "#000000",
    },
    selectButtonArrow: {
      fontSize: 18,
      color: isDark ? "#8E8E93" : "#C7C7CC",
      fontWeight: "600",
    },
    primaryButton: {
      backgroundColor: "#007AFF",
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      marginTop: 8,
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      fontSize: 17,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    secondaryButton: {
      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      marginTop: 8,
      borderWidth: 1,
      borderColor: isDark ? "#007AFF" : "#007AFF",
    },
    secondaryButtonDisabled: {
      opacity: 0.6,
    },
    secondaryButtonText: {
      fontSize: 17,
      fontWeight: "600",
      color: "#007AFF",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
    },
    emptyStateIcon: {
      fontSize: 48,
      marginBottom: 16,
      opacity: 0.6,
      color: isDark ? "white" : "black",
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#000000",
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 16,
      color: isDark ? "#8E8E93" : "#6D6D70",
      textAlign: "center",
    },
    timeline: {
      gap: 16,
    },
    timelineItem: {
      flexDirection: "row",
      gap: 16,
    },
    timelineMarker: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "#007AFF",
    },
    timelineIcon: {
      fontSize: 16,
    },
    timelineContent: {
      flex: 1,
      paddingTop: 2,
    },
    timelineTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#000000",
      marginBottom: 4,
    },
    timelineDate: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#6D6D70",
      marginBottom: 8,
    },
    timelineNotes: {
      fontSize: 14,
      color: isDark ? "#FFFFFF" : "#000000",
      lineHeight: 20,
      fontStyle: "italic",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalContent: {
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderRadius: 20,
      width: "100%",
      maxWidth: 400,
      maxHeight: "70%",
      overflow: "hidden",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#38383A" : "#C6C6C8",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    modalCloseButton: {
      padding: 4,
    },
    modalCloseText: {
      fontSize: 16,
      color: isDark ? "#8E8E93" : "#6D6D70",
    },
    modalOptions: {
      paddingVertical: 8,
    },
    modalOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 16,
    },
    modalOptionSelected: {
      backgroundColor: isDark ? "#007AFF20" : "#007AFF10",
    },
    modalOptionIcon: {
      fontSize: 20,
      color: isDark ? "white" : "black",
    },
    modalOptionText: {
      fontSize: 16,
      color: isDark ? "#FFFFFF" : "#000000",
      flex: 1,
    },
    modalOptionTextSelected: {
      color: "#007AFF",
      fontWeight: "600",
    },
    checkmark: {
      fontSize: 16,
      color: "#007AFF",
      fontWeight: "bold",
    },
  });

export default AddApplicationScreen;
