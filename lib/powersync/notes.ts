import { randomUUID } from 'expo-crypto';
import { powersync } from './client';
import { type NoteRecord } from './schema';

export type Note = NoteRecord & { id: string };

export function listNotes(): Promise<Note[]> {
  return powersync.getAll<Note>('SELECT * FROM notes ORDER BY updated_at DESC');
}

export async function createNote(title: string, content: string): Promise<Note> {
  const now = new Date().toISOString();
  const note: Note = { id: randomUUID(), title, content, created_at: now, updated_at: now };
  await powersync.execute(
    'INSERT INTO notes (id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [note.id, note.title, note.content, note.created_at, note.updated_at]
  );
  return note;
}

export async function updateNote(id: string, title: string, content: string): Promise<void> {
  const now = new Date().toISOString();
  await powersync.execute('UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?', [
    title,
    content,
    now,
    id,
  ]);
}

export async function deleteNote(id: string): Promise<void> {
  await powersync.execute('DELETE FROM notes WHERE id = ?', [id]);
}
