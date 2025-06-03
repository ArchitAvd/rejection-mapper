import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  useColorScheme,
  StatusBar,
  Animated,
  GestureResponderEvent,
  TextInput,
} from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useApplications } from "../context/ApplicationContext";
import { Application } from "../types";
import {
  FontAwesome,
  MaterialCommunityIcons,
  FontAwesome5,
  FontAwesome6,
  Entypo,
} from "@expo/vector-icons";
import ListFooter from "./components/ListFooter";

const getStatusColor = (
  status: "Applied" | "Rounds" | "Offer Received" | "Rejected" | "Ghosted",
  isDark: boolean
) => {
  const colors = {
    Applied: isDark ? "#4A90E2" : "#007AFF",
    Rounds: isDark ? "#F5A623" : "#FF9500",
    "Offer Received": isDark ? "#7ED321" : "#34C759",
    Rejected: isDark ? "#D0021B" : "#FF3B30",
    Ghosted: isDark ? "#9013FE" : "#AF52DE",
  };
  return colors[status] || (isDark ? "#8E8E93" : "#8E8E93");
};

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { applications, loading, deleteApplication, forceRefresh } =
    useApplications();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedSort, setSelectedSort] = useState("applicationDateDesc");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const styles = getStyles(isDark);

  const FILTER_OPTIONS = [
    {
      label: "All",
      value: "All",
      icon: (
        <MaterialCommunityIcons
          name="view-list"
          style={styles.modalOptionIcon}
        />
      ),
    },
    {
      label: "Applied",
      value: "Applied",
      icon: (
        <FontAwesome5
          name="envelope-open-text"
          style={styles.modalOptionIcon}
        />
      ),
    },
    {
      label: "Rounds",
      value: "Interview",
      icon: <FontAwesome5 name="briefcase" style={styles.modalOptionIcon} />,
    },
    {
      label: "Ghosted",
      value: "Ghosted",
      icon: <FontAwesome6 name="skull" style={styles.modalOptionIcon} />,
    },
    {
      label: "Rejected",
      value: "Rejected",
      icon: <Entypo name="circle-with-cross" style={styles.modalOptionIcon} />,
    },
    {
      label: "Offer Received",
      value: "Offer Received",
      icon: (
        <MaterialCommunityIcons
          name="party-popper"
          style={styles.modalOptionIcon}
        />
      ),
    },
  ];

  const SORT_OPTIONS = [
    {
      label: "Date Added (Newest)",
      value: "applicationDateDesc",
      icon: <FontAwesome name="calendar" style={styles.modalOptionIcon} />,
    },
    {
      label: "Date Added (Oldest)",
      value: "applicationDateAsc",
      icon: <FontAwesome name="calendar" style={styles.modalOptionIcon} />,
    },
    {
      label: "Last Updated (Newest)",
      value: "lastStageDateDesc",
      icon: (
        <MaterialCommunityIcons
          name="sort-calendar-descending"
          style={styles.modalOptionIcon}
        />
      ),
    },
    {
      label: "Company Name (A-Z)",
      value: "companyAsc",
      icon: <FontAwesome5 name="building" style={styles.modalOptionIcon} />,
    },
    {
      label: "Job Title (A-Z)",
      value: "jobTitleAsc",
      icon: (
        <MaterialCommunityIcons
          name="sort-alphabetical-ascending"
          style={styles.modalOptionIcon}
        />
      ),
    },
  ];

  useFocusEffect(
    useCallback(() => {
      forceRefresh();
      setSearchQuery("");
      setIsSearchActive(false);
      setSelectedFilter("All");
      setSelectedSort("applicationDateDesc");
    }, [forceRefresh])
  );

  const handleDeleteJob = (jobId: string, companyName: string) => {
    Alert.alert(
      "Delete Application",
      `Are you sure you want to delete your application to ${companyName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            await deleteApplication(jobId);
            Alert.alert("Success", "Application deleted successfully.");
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const getStatusFromStages = (stages: string | any[]) => {
    if (!stages || stages.length === 0) return "Applied";
    const lastStage = stages[stages.length - 1];
    return lastStage?.name || "Applied";
  };

  const filteredAndSortedApplications = useMemo(() => {
    let filtered = [...applications];

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.companyName.toLowerCase().includes(lowerCaseQuery) ||
          job.jobTitle.toLowerCase().includes(lowerCaseQuery) ||
          job.channel.toLowerCase().includes(lowerCaseQuery)
      );
    }

    if (selectedFilter !== "All") {
      filtered = filtered.filter((job) => {
        const lastStageName = job.stages[job.stages.length - 1]?.name;
        if (!lastStageName) return selectedFilter === "Applied";

        switch (selectedFilter) {
          case "Rejected":
          case "Offer Received":
          case "Ghosted":
          case "Applied":
            return lastStageName === selectedFilter;
          case "Rounds":
            return lastStageName.toLowerCase().includes("round");
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      switch (selectedSort) {
        case "applicationDateDesc":
          return (
            new Date(b.applicationDate).getTime() -
            new Date(a.applicationDate).getTime()
          );
        case "applicationDateAsc":
          return (
            new Date(a.applicationDate).getTime() -
            new Date(b.applicationDate).getTime()
          );
        case "lastStageDateDesc":
          const lastStageA = a.stages[a.stages.length - 1]?.date;
          const lastStageB = b.stages[b.stages.length - 1]?.date;
          if (!lastStageA && !lastStageB) return 0;
          if (!lastStageA) return 1;
          if (!lastStageB) return -1;
          return (
            new Date(lastStageB).getTime() - new Date(lastStageA).getTime()
          );
        case "companyAsc":
          return a.companyName
            .toLowerCase()
            .localeCompare(b.companyName.toLowerCase());
        case "jobTitleAsc":
          return a.jobTitle
            .toLowerCase()
            .localeCompare(b.jobTitle.toLowerCase());
        default:
          return 0;
      }
    });

    return filtered;
  }, [applications, selectedFilter, selectedSort]);

  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderJobItem = ({ item }: { item: Application; index: number }) => {
    const status = getStatusFromStages(item.stages);
    const statusColor = getStatusColor(status, isDark);
    return (
      <Animated.View style={[styles.jobItem, { opacity: 1 }]}>
        <TouchableOpacity
          style={styles.jobContent}
          onPress={() =>
            router.push({
              pathname: "/add-application",
              params: { id: item.id },
            })
          }
          activeOpacity={0.7}
        >
          <View style={styles.jobHeader}>
            <View style={styles.companyInfo}>
              <View style={styles.companyIconContainer}>
                <Text style={styles.companyIcon}>
                  {item.companyName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.jobDetails}>
                <Text style={styles.companyName} numberOfLines={1}>
                  {item.companyName}
                </Text>
                <Text style={styles.jobTitle} numberOfLines={1}>
                  {item.jobTitle}
                </Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {status}
              </Text>
            </View>
          </View>

          <View style={styles.jobFooter}>
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>Applied</Text>
              <Text style={styles.dateValue}>
                {formatDate(item.applicationDate)}
              </Text>
            </View>
            {item.stages.length > 0 && (
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>Updated</Text>
                <Text style={styles.dateValue}>
                  {formatDate(item.stages[item.stages.length - 1]?.date)}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => handleDeleteJob(item.id, item.companyName)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.moreButtonText}>⋯</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await forceRefresh();
    setRefreshing(false);
  };

  const renderHeader = () => (
    <Animated.View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Animated.Text style={styles.headerTitle}>
            Job Applications
          </Animated.Text>
          <Animated.Text style={styles.headerSubtitle}>
            {filteredAndSortedApplications.length} application
            {filteredAndSortedApplications.length !== 1 ? "s" : ""}
          </Animated.Text>
        </View>
      </View>

      {isSearchActive && (
        <TextInput
          style={styles.searchBar}
          placeholder="Search company, job title, or channel..."
          placeholderTextColor={isDark ? "#8E8E93" : "#6D6D70"}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      )}

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setIsSearchActive(!isSearchActive)}
          activeOpacity={0.7}
        >
          <FontAwesome name="search" style={styles.controlIcon} />
          <Text style={styles.controlText}>
            {isSearchActive ? "Hide Search" : "Search"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.7}
        >
          <FontAwesome name="filter" style={styles.controlIcon} />
          <Text style={styles.controlText}>
            {FILTER_OPTIONS.find((opt) => opt.value === selectedFilter)
              ?.label || "Filter"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowSortModal(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="sort" style={styles.controlIcon} />
          <Text style={styles.controlText}>
            {SORT_OPTIONS.find(
              (opt) => opt.value === selectedSort
            )?.label.split(" ")[0] || "Sort"}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderModal = (
    visible: boolean | undefined,
    onClose: ((event: GestureResponderEvent) => void) | undefined,
    title:
      | string
      | number
      | bigint
      | boolean
      | React.ReactElement<unknown, string | React.JSXElementConstructor<any>>
      | Iterable<React.ReactNode>
      | Promise<
          | string
          | number
          | bigint
          | boolean
          | React.ReactPortal
          | React.ReactElement<
              unknown,
              string | React.JSXElementConstructor<any>
            >
          | Iterable<React.ReactNode>
          | null
          | undefined
        >
      | null
      | undefined,
    options: any[],
    selectedValue: string,
    onSelect: {
      (value: React.SetStateAction<string>): void;
      (value: React.SetStateAction<string>): void;
      (arg0: any): void;
    },
    valueKey = "value"
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
          <View style={styles.modalOptions}>
            {options.map(
              (option: {
                [x: string]: any;
                icon:
                  | string
                  | number
                  | bigint
                  | boolean
                  | React.ReactElement<
                      unknown,
                      string | React.JSXElementConstructor<any>
                    >
                  | Iterable<React.ReactNode>
                  | React.ReactPortal
                  | Promise<
                      | string
                      | number
                      | bigint
                      | boolean
                      | React.ReactPortal
                      | React.ReactElement<
                          unknown,
                          string | React.JSXElementConstructor<any>
                        >
                      | Iterable<React.ReactNode>
                      | null
                      | undefined
                    >
                  | null
                  | undefined;
                label:
                  | string
                  | number
                  | bigint
                  | boolean
                  | React.ReactElement<
                      unknown,
                      string | React.JSXElementConstructor<any>
                    >
                  | Iterable<React.ReactNode>
                  | React.ReactPortal
                  | Promise<
                      | string
                      | number
                      | bigint
                      | boolean
                      | React.ReactPortal
                      | React.ReactElement<
                          unknown,
                          string | React.JSXElementConstructor<any>
                        >
                      | Iterable<React.ReactNode>
                      | null
                      | undefined
                    >
                  | null
                  | undefined;
              }) => (
                <TouchableOpacity
                  key={option[valueKey]}
                  style={[
                    styles.modalOption,
                    selectedValue === option[valueKey] &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    onSelect(option[valueKey]);
                  }}
                  activeOpacity={0.7}
                >
                  {option.icon}
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedValue === option[valueKey] &&
                        styles.modalOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedValue === option[valueKey] && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={styles.container.backgroundColor}
      />

      {renderHeader()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={isDark ? "#007AFF" : "#007AFF"}
          />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedApplications}
          keyExtractor={(item) => item.id}
          renderItem={renderJobItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<ListFooter />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>No Applications Found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedFilter !== "All"
                  ? "Try adjusting your filter or add new applications"
                  : "Start tracking your job applications"}
              </Text>
            </View>
          }
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}

      <View style={styles.fab}>
        <Link href="/add-application" asChild>
          <TouchableOpacity style={styles.fabButton} activeOpacity={0.8}>
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/sankey-diagram" asChild>
          <TouchableOpacity style={styles.secondaryFab} activeOpacity={0.8}>
            <Text style={styles.secondaryFabIcon}>📊</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {renderModal(
        showFilterModal,
        () => setShowFilterModal(false),
        "Filter Applications",
        FILTER_OPTIONS,
        selectedFilter,
        setSelectedFilter
      )}

      {renderModal(
        showSortModal,
        () => setShowSortModal(false),
        "Sort Applications",
        SORT_OPTIONS,
        selectedSort,
        setSelectedSort
      )}
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000000" : "#F2F2F7",
    },
    header: {
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#38383A" : "#C6C6C8",
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    headerTitle: {
      fontSize: 34,
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#000000",
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 16,
      color: isDark ? "#8E8E93" : "#6D6D70",
      marginTop: 4,
    },
    controlsContainer: {
      flexDirection: "row",
      gap: 12,
    },
    controlButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      gap: 8,
    },
    controlIcon: {
      fontSize: 16,
      color: isDark ? "white" : "black",
    },
    controlText: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      color: isDark ? "#8E8E93" : "#6D6D70",
    },
    listContent: {
      padding: 16,
      paddingBottom: 120,
    },
    jobItem: {
      marginBottom: 12,
    },
    jobContent: {
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      shadowColor: isDark ? "#fff" : "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    jobHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    companyInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 12,
    },
    companyIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: isDark ? "#007AFF" : "#007AFF",
      justifyContent: "center",
      alignItems: "center",
    },
    companyIcon: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    jobDetails: {
      flex: 1,
    },
    companyName: {
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#000000",
      marginBottom: 4,
    },
    jobTitle: {
      fontSize: 16,
      color: isDark ? "#8E8E93" : "#6D6D70",
      fontWeight: "500",
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    jobFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dateInfo: {
      alignItems: "flex-start",
    },
    dateLabel: {
      fontSize: 12,
      color: isDark ? "#8E8E93" : "#6D6D70",
      marginBottom: 2,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    dateValue: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    moreButton: {
      padding: 8,
      borderRadius: 8,
    },
    moreButtonText: {
      fontSize: 20,
      color: isDark ? "#8E8E93" : "#6D6D70",
      fontWeight: "bold",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
      paddingTop: 100,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 20,
      opacity: 0.5,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#000000",
      marginBottom: 12,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 16,
      color: isDark ? "#8E8E93" : "#6D6D70",
      textAlign: "center",
      lineHeight: 22,
    },
    fab: {
      position: "absolute",
      bottom: 30,
      right: 20,
      gap: 12,
    },
    fabButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#007AFF",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    fabIcon: {
      fontSize: 24,
      color: "#FFFFFF",
      fontWeight: "bold",
    },
    secondaryFab: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    secondaryFabIcon: {
      fontSize: 20,
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
      maxHeight: "80%",
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
      fontSize: 20,
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    modalCloseButton: {
      padding: 4,
    },
    modalCloseText: {
      fontSize: 18,
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
      fontSize: 17,
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
    searchBar: {
      backgroundColor: isDark ? "#2C2C2E" : "#E5E5EA",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 17,
      color: isDark ? "#FFFFFF" : "#000000",
      marginBottom: 15,
    },
  });
