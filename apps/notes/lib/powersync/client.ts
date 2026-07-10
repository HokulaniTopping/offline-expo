import { createSyncClient } from '@offline-expo/sync-client';
import { AppSchema } from './schema';

export const powersync = createSyncClient(AppSchema, { dbFilename: 'notes.db' });
