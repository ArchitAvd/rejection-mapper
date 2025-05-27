import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Applications" }} />
      <Stack.Screen name="add" options={{ title: "Add/Edit Application" }} />
      <Stack.Screen name="sankey-diagram" options={{ title: "Sankey Map" }} />
    </Stack>
  );
}
