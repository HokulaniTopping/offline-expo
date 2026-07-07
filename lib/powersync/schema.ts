import { column, Schema, Table } from '@powersync/react-native';

// PowerSync auto-adds an `id` primary key column — don't declare one.
const notes = new Table({
  title: column.text,
  content: column.text,
  created_at: column.text,
  updated_at: column.text,
});

export const AppSchema = new Schema({ notes });

export type Database = (typeof AppSchema)['types'];
export type NoteRecord = Database['notes'];
