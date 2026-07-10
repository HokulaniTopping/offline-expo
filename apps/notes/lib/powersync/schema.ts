// Schema building blocks come from @powersync/common (platform-neutral) so
// this file works unchanged if a native target is ever added.
import { column, Schema, Table } from '@powersync/common';

// PowerSync auto-adds an `id` primary key column — don't declare one.
const notes = new Table({
  user_id: column.text,
  title: column.text,
  content: column.text,
  created_at: column.text,
  updated_at: column.text,
});

export const AppSchema = new Schema({ notes });

export type Database = (typeof AppSchema)['types'];
export type NoteRecord = Database['notes'];
