import { Link } from "expo-router";
import { View, StyleSheet, Text, Button } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}> Welcome to Rejection Mapper</Text>
      <Text style={styles.subtitle}>
        Track your applications here and visualize the journey
      </Text>

      <Link href="/add-application" asChild>
        <Button title="View Sankey Map" />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
});
