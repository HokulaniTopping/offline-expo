import { PowerSyncContext } from '@powersync/react';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { SyncStatusIndicator } from '@offline-expo/sync-client';
import { connector } from './lib/powersync/connector';
import { powersync } from './lib/powersync/client';
import { NotesScreen } from './screens/NotesScreen';

export default function App() {
  useEffect(() => {
    powersync.connect(connector);
    return () => {
      powersync.disconnect();
    };
  }, []);

  return (
    <PowerSyncContext.Provider value={powersync}>
      <View style={styles.root}>
        <SyncStatusIndicator />
        <NotesScreen />
        <StatusBar style="auto" />
      </View>
    </PowerSyncContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 50,
  },
});
