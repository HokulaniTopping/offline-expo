import type { Schema } from '@powersync/common';
import { PowerSyncDatabase, WASQLiteOpenFactory } from '@powersync/web';

// This is the ONE platform-specific file in this package: it opens SQLite via
// WASM (wa-sqlite) in web workers. If a native (iOS/Android) target is ever
// added, it gets its own variant of this file using @powersync/react-native's
// open factory — everything else in the package is platform-neutral.

export interface CreateSyncClientOptions {
  /** Local database filename. Use a distinct name per app, e.g. 'notes.db'. */
  dbFilename: string;
  /**
   * URL paths the app serves the PowerSync workers from. Defaults match the
   * `powersync-web copy-assets` layout (public/@powersync/...), which apps
   * should run as a postinstall step.
   */
  dbWorker?: string;
  syncWorker?: string;
}

export function createSyncClient(schema: Schema, options: CreateSyncClientOptions) {
  const factory = new WASQLiteOpenFactory({
    dbFilename: options.dbFilename,
    worker: options.dbWorker ?? '/@powersync/worker/WASQLiteDB.umd.js',
  });

  return new PowerSyncDatabase({
    schema,
    database: factory,
    sync: {
      worker: options.syncWorker ?? '/@powersync/worker/SharedSyncImplementation.umd.js',
    },
  });
}
