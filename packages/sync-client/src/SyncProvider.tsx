import { type ReactNode, useEffect } from 'react';
import type { AbstractPowerSyncDatabase, PowerSyncBackendConnector } from '@powersync/common';
import { PowerSyncContext } from '@powersync/react';
import { View } from 'react-native';
import { SyncStatusIndicator } from './SyncStatusIndicator';

export interface SyncProviderProps {
  /** The database from `createSyncClient` (create it once, at module scope). */
  db: AbstractPowerSyncDatabase;
  /** The connector from `createConnector`. */
  connector: PowerSyncBackendConnector;
  /** Render the sync-status banner above `children`. Defaults to false. */
  showStatus?: boolean;
  children: ReactNode;
}

/**
 * One component that removes the wiring every consuming app otherwise repeats:
 * it provides the PowerSync React context (so `useStatus`/`useQuery` and
 * `SyncStatusIndicator` work) and owns the connect/disconnect lifecycle. Wrap
 * the app once:
 *
 * ```tsx
 * <SyncProvider db={db} connector={connector} showStatus>
 *   <App />
 * </SyncProvider>
 * ```
 */
export function SyncProvider({ db, connector, showStatus = false, children }: SyncProviderProps) {
  useEffect(() => {
    // connect() streams sync down and drains the offline write queue up.
    db.connect(connector);
    return () => {
      db.disconnect();
    };
  }, [db, connector]);

  return (
    <PowerSyncContext.Provider value={db}>
      {showStatus ? (
        // Establish a flex column so the banner sits above content that fills
        // the rest — the context provider emits no layout node of its own.
        <View style={{ flex: 1 }}>
          <SyncStatusIndicator />
          {children}
        </View>
      ) : (
        children
      )}
    </PowerSyncContext.Provider>
  );
}
