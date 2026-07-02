import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { migrateDbIfNeeded } from './lib/db/schema';
import { NotesScreen } from './screens/NotesScreen';

export default function App() {
  return (
    <Suspense fallback={<ActivityIndicator style={styles.loading} />}>
      <SQLiteProvider databaseName="notes.db" onInit={migrateDbIfNeeded} useSuspense>
        <NotesScreen />
        <StatusBar style="auto" />
      </SQLiteProvider>
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
  },
});
