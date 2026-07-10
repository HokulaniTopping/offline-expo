import { PowerSyncDatabase, WASQLiteOpenFactory } from '@powersync/web';
import { AppSchema } from './schema';

// Web build: SQLite runs via WASM (wa-sqlite) in a worker instead of a native
// driver. Worker files are copied into public/@powersync by `powersync-web
// copy-assets` (see package.json's postinstall script) and served from there.
const factory = new WASQLiteOpenFactory({
  dbFilename: 'notes.db',
  worker: '/@powersync/worker/WASQLiteDB.umd.js',
});

export const powersync = new PowerSyncDatabase({
  schema: AppSchema,
  database: factory,
  sync: {
    worker: '/@powersync/worker/SharedSyncImplementation.umd.js',
  },
});
