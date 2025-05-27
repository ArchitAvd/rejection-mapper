import { Stack } from "expo-router";
import { ApplicationProvider } from "../context/ApplicationContext";

export default function RootLayout() {
  return (
    <ApplicationProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Applications" }} />
        <Stack.Screen
          name="add-application"
          options={{ title: "Add/Edit Application" }}
        />
        {/* <Stack.Screen name="sankey-diagram" options={{ title: "Sankey Map" }} /> */}
      </Stack>
    </ApplicationProvider>
  );
}
