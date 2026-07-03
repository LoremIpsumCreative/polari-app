import { StyleSheet, Text, View } from 'react-native';

export default function QuizScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quiz</Text>
      <Text style={styles.body}>Coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 14, opacity: 0.6 },
});
