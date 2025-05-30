import { Stack } from "expo-router";
import { ApplicationProvider } from "../context/ApplicationContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <ApplicationProvider>
      <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="add-application" />
        <Stack.Screen name="sankey-diagram" />
      </Stack>
      </SafeAreaProvider>
    </ApplicationProvider>
  );
}
