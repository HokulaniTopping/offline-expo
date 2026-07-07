import { useStatus } from '@powersync/react';
import { StyleSheet, Text, View } from 'react-native';

// Seed of the later cross-app status dashboard — for now, a single banner that
// serves both a developer (connection state) and an end user (their data is safe).
export function SyncStatusIndicator() {
  const status = useStatus();

  const { label, tone } = describeStatus(status);

  return (
    <View style={[styles.banner, tone === 'ok' ? styles.ok : tone === 'busy' ? styles.busy : styles.offline]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

function describeStatus(status: ReturnType<typeof useStatus>): { label: string; tone: 'ok' | 'busy' | 'offline' } {
  if (!status.connected) {
    return { label: "Offline — changes saved, will sync when you're back online", tone: 'offline' };
  }
  if (status.dataFlowStatus.uploading || status.dataFlowStatus.downloading) {
    return { label: 'Syncing…', tone: 'busy' };
  }
  if (!status.hasSynced) {
    return { label: 'Connecting…', tone: 'busy' };
  }
  return { label: 'Connected — up to date', tone: 'ok' };
}

const styles = StyleSheet.create({
  banner: { paddingVertical: 6, paddingHorizontal: 16, alignItems: 'center' },
  ok: { backgroundColor: '#e6f4ea' },
  busy: { backgroundColor: '#fff4e5' },
  offline: { backgroundColor: '#f4e6e6' },
  text: { fontSize: 12, fontWeight: '500' },
});
