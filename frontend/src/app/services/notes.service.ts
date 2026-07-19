import { Injectable, signal, computed } from '@angular/core';
import { StudyNote } from '../models/study-note';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly storageKey = 'kognita_study_notes';

  readonly notes = signal<StudyNote[]>(this.loadNotes());

  readonly recentlyEdited = computed(() => {
    return [...this.notes()]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  });

  saveNote(noteData: { id?: string; title: string; content: string; subjectId?: string; subjectName?: string; subjectColor?: string; tags?: string[] }): StudyNote {
    const currentNotes = this.notes();
    const now = new Date().toISOString();

    if (noteData.id) {
      const updated = currentNotes.map((n) => {
        if (n.id === noteData.id) {
          return {
            ...n,
            title: noteData.title,
            content: noteData.content,
            subjectId: noteData.subjectId,
            subjectName: noteData.subjectName,
            subjectColor: noteData.subjectColor,
            tags: noteData.tags || n.tags,
            updatedAt: now,
          };
        }
        return n;
      });
      this.notes.set(updated);
      this.persist(updated);
      return updated.find((n) => n.id === noteData.id)!;
    } else {
      const newNote: StudyNote = {
        id: 'note_' + Date.now(),
        title: noteData.title,
        content: noteData.content,
        subjectId: noteData.subjectId,
        subjectName: noteData.subjectName,
        subjectColor: noteData.subjectColor,
        tags: noteData.tags || [],
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newNote, ...currentNotes];
      this.notes.set(updated);
      this.persist(updated);
      return newNote;
    }
  }

  deleteNote(id: string): void {
    const updated = this.notes().filter((n) => n.id !== id);
    this.notes.set(updated);
    this.persist(updated);
  }

  private persist(data: StudyNote[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {}
  }

  private loadNotes(): StudyNote[] {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return [
      {
        id: 'note_demo_1',
        title: 'Comandos SQL Avançados & Indices B-Tree',
        content: `# Anotações de SQL\n\n- **JOINs**: Inner vs Left vs Right\n- **INDEX**: \`CREATE INDEX idx_user ON users(email);\`\n\n\`\`\`sql\nSELECT u.name, COUNT(s.id)\nFROM users u\nJOIN study_sessions s ON s.user_id = u.id\nGROUP BY u.name;\n\`\`\``,
        subjectName: 'Banco de Dados',
        subjectColor: '#7C3AED',
        tags: ['SQL', 'Database'],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];
  }
}
