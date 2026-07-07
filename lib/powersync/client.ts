import { OPSqliteOpenFactory } from '@powersync/op-sqlite';
import { PowerSyncDatabase } from '@powersync/react-native';
import { AppSchema } from './schema';

// react-native's PowerSyncDatabase defaults to react-native-quick-sqlite unless
// given an explicit open factory — we're on op-sqlite, so pass one explicitly.
const factory = new OPSqliteOpenFactory({ dbFilename: 'notes.db' });

export const powersync = new PowerSyncDatabase({
  schema: AppSchema,
  database: factory,
});
