import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { SyncProvider } from '@offline-expo/sync-client';
import { connector } from './lib/powersync/connector';
import { powersync } from './lib/powersync/client';
import { NotesScreen } from './screens/NotesScreen';

export default function App() {
  return (
    <SyncProvider db={powersync} connector={connector} showStatus>
      <View style={styles.root}>
        <NotesScreen />
        <StatusBar style="auto" />
      </View>
    </SyncProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 50,
  },
});
