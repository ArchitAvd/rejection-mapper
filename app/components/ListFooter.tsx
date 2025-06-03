import { View, Text, StyleSheet } from "react-native";

export default function ListFooter() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>App Version : 0.1</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    top: 10,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
  },
});
