import { randomUUID } from 'expo-crypto';
import { type SQLiteDatabase } from 'expo-sqlite';

export type Note = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export function listNotes(db: SQLiteDatabase): Promise<Note[]> {
  return db.getAllAsync<Note>('SELECT * FROM notes ORDER BY updated_at DESC');
}

export async function createNote(db: SQLiteDatabase, title: string, content: string): Promise<Note> {
  const now = new Date().toISOString();
  const note: Note = { id: randomUUID(), title, content, created_at: now, updated_at: now };
  await db.runAsync(
    'INSERT INTO notes (id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    note.id,
    note.title,
    note.content,
    note.created_at,
    note.updated_at
  );
  return note;
}

export async function updateNote(db: SQLiteDatabase, id: string, title: string, content: string): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync('UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?', title, content, now, id);
}

export async function deleteNote(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM notes WHERE id = ?', id);
}
