import AsyncStorage from "@react-native-async-storage/async-storage";
import { Application, ApplicationData } from "../types";

const STORAGE_KEY = "@RejectionMapper:Applications";

export const loadApplications = async (): Promise<ApplicationData> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Failed to load applications", e);
    return [];
  }
};

export const saveApplications = async (applications: ApplicationData) => {
  try {
    const jsonValue = JSON.stringify(applications);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error("Failed to save applications", e);
  }
};

export const upsertApplication = async (
  newApplication: Application
): Promise<ApplicationData> => {
  const existingApplications = await loadApplications();
  const index = existingApplications.findIndex(
    (application) => application.id === newApplication.id
  );

  let updatedApplications: ApplicationData;
  if (index > -1) {
    updatedApplications = [
      ...existingApplications.slice(0, index),
      newApplication,
      ...existingApplications.slice(index + 1),
    ];
  } else {
    updatedApplications = [...existingApplications, newApplication];
  }

  await saveApplications(updatedApplications);
  return updatedApplications;
};

export const deleteApplication = async (
  id: string
): Promise<ApplicationData> => {
  const existingApplications = await loadApplications();
  const updatedApplications = existingApplications.filter(
    (application) => application.id !== id
  );
  await saveApplications(updatedApplications);
  return updatedApplications;
};
