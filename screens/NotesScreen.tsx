import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createNote, deleteNote, listNotes, updateNote, type Note } from '../lib/db/notes';

export function NotesScreen() {
  const db = useSQLiteContext();
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setNotes(await listNotes(db));
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    if (editingId) {
      await updateNote(db, editingId, title.trim(), content.trim());
    } else {
      await createNote(db, title.trim(), content.trim());
    }
    resetForm();
    await refresh();
  };

  const handleEdit = (note: Note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleDelete = async (id: string) => {
    await deleteNote(db, id);
    if (editingId === id) resetForm();
    await refresh();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.header}>Notes (local only, no sync yet)</Text>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.noteRow} onPress={() => handleEdit(item)}>
            <View style={styles.noteText}>
              <Text style={styles.noteTitle}>{item.title}</Text>
              {!!item.content && <Text style={styles.noteContent}>{item.content}</Text>}
            </View>
            <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
              <Text style={styles.delete}>Delete</Text>
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notes yet.</Text>}
      />
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Content" value={content} onChangeText={setContent} />
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{editingId ? 'Update note' : 'Add note'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60, paddingHorizontal: 16 },
  header: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  list: { paddingBottom: 12 },
  noteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  noteText: { flex: 1, paddingRight: 12 },
  noteTitle: { fontSize: 16, fontWeight: '500' },
  noteContent: { fontSize: 13, color: '#666', marginTop: 2 },
  delete: { color: '#c00', fontSize: 13 },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
  form: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ccc', paddingVertical: 12, gap: 8 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveButton: { backgroundColor: '#111', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});
