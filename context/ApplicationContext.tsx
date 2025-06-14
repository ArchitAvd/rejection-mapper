import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import {
  Application,
  ApplicationData,
  PREDEFINED_STAGES,
  Stage,
} from "../types";
import {
  loadApplications,
  upsertApplication as upsertApplicationInStorage,
  deleteApplication as deleteApplicationFromStorage,
} from "../utils/storage";

interface ApplicationContextType {
  applications: ApplicationData;
  loading: boolean;
  addApplication: (
    companyName: string,
    channel: string,
    jobTitle: string,
    initialApplicationDate: string,
    initialStageName?: string,
    initialStageNotes?: string
  ) => Promise<void>;
  updateApplication: (updatedApplicaion: Application) => Promise<void>;
  addStage: (
    id: string,
    stageName: string,
    stageDate: string,
    stageNotes?: string
  ) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  getApplicationById: (id: string) => Application | undefined;
  getSuggestedStageNames: () => string[];
  forceRefresh: () => void;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(
  undefined
);

interface ApplicationProviderProps {
  children: ReactNode;
}

export const ApplicationProvider = ({ children }: ApplicationProviderProps) => {
  const [applications, setApplications] = useState<ApplicationData>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const data = await loadApplications();
    if (JSON.stringify(data) !== JSON.stringify(applications)) {
      setApplications(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const forceRefresh = useCallback(() => {
    setRefreshKey((prevKey) => prevKey + 1);
  }, []);

  const addApplication = useCallback(
    async (
      companyName: string,
      channel: string,
      jobTitle: string,
      applicationDate: string,
      initialStageName?: string,
      initialStageNotes?: string
    ) => {
      const newJob: Application = {
        id: uuidv4(),
        companyName,
        channel,
        jobTitle,
        applicationDate,
        stages: [],
      };

      const defaultInitialStage: Stage = {
        name: PREDEFINED_STAGES[0],
        date: applicationDate,
        notes: "Initial application submission",
      };

      newJob.stages.push(defaultInitialStage);

      if (initialStageName && initialStageName !== defaultInitialStage.name) {
        newJob.stages.push({
          name: initialStageName,
          date: initialStageName ? applicationDate : applicationDate,
          notes: initialStageNotes,
        });
      }

      const updatedJobs = await upsertApplicationInStorage(newJob);
      setApplications(updatedJobs);
    },
    []
  );

  const updateApplication = useCallback(async (updatedJob: Application) => {
    const updatedJobs = await upsertApplicationInStorage(updatedJob);
    setApplications(updatedJobs);
  }, []);

  const addStage = useCallback(
    async (
      id: string,
      stageName: string,
      stageDate: string,
      stageNotes?: string
    ) => {
      const applicationToUpdate = applications.find(
        (application) => application.id === id
      );
      if (applicationToUpdate) {
        const newStage: Stage = {
          name: stageName,
          date: stageDate,
          notes: stageNotes,
        };

        const updatedStages = [...applicationToUpdate.stages, newStage].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const updatedApplication = {
          ...applicationToUpdate,
          stages: updatedStages,
        };

        await updateApplication(updatedApplication);
      } else {
        console.warn(`Application with ID ${id} not found.`);
      }
    },
    [applications, updateApplication]
  );

  const deleteApplication = useCallback(async (id: string) => {
    const updatedApplications = await deleteApplicationFromStorage(id);
    setApplications(updatedApplications);
  }, []);

  const getApplicationById = useCallback(
    (id: string): Application | undefined => {
      return applications.find((application) => application.id === id);
    },
    [applications]
  );

  const getSuggestedStageNames = useCallback((): string[] => {
    return Array.from(new Set([...PREDEFINED_STAGES]));
  }, [applications]);

  const contextValue = {
    applications,
    loading,
    addApplication,
    updateApplication,
    addStage,
    deleteApplication,
    getApplicationById,
    getSuggestedStageNames,
    forceRefresh,
  };

  return (
    <ApplicationContext.Provider value={contextValue}>
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplications = () => {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error(
      "useApplications must be used within a ApplicationsProvider"
    );
  }
  return context;
};
