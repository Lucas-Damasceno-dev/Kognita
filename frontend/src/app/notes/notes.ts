import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesService } from '../services/notes.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Subject } from '../models/subject';
import { StudyNote } from '../models/study-note';

@Component({
  selector: 'app-study-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notes.html',
  styleUrl: './notes.css',
})
export class StudyNotes implements OnInit {
  notesSvc = inject(NotesService);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  subjects = signal<Subject[]>([]);
  searchQuery = signal('');

  selectedNoteId = signal<string | null>(null);

  // Form
  editingTitle = '';
  editingContent = '';
  editingSubjectId = '';
  editingTagInput = '';
  editingTags: string[] = [];

  filteredNotes = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.notesSvc.notes();
    if (!q) return list;
    return list.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.subjectName && n.subjectName.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.api.getSubjects(user.id).subscribe((s) => {
        this.subjects.set(Array.isArray(s) ? s : []);
      });
    }

    const first = this.notesSvc.notes()[0];
    if (first) {
      this.selectNote(first);
    }
  }

  selectNote(note: StudyNote): void {
    this.selectedNoteId.set(note.id);
    this.editingTitle = note.title;
    this.editingContent = note.content;
    this.editingSubjectId = note.subjectId || '';
    this.editingTags = note.tags || [];
  }

  createNewNote(): void {
    const newNote = this.notesSvc.saveNote({
      title: 'Nova Nota de Estudo',
      content: '# Título da Nota\n\n- Escreva suas anotações aqui...\n- Suporta **Markdown** e trechos de código:\n\n```js\nconsole.log("Kognita Notes");\n```',
      tags: ['Estudo'],
    });
    this.selectNote(newNote);
    this.toast.success('Nova nota criada!');
  }

  saveCurrent(): void {
    if (!this.editingTitle.trim()) {
      this.toast.error('Informe um título para a nota');
      return;
    }

    const sub = this.subjects().find((s) => s.id === this.editingSubjectId);

    this.notesSvc.saveNote({
      id: this.selectedNoteId() || undefined,
      title: this.editingTitle,
      content: this.editingContent,
      subjectId: this.editingSubjectId || undefined,
      subjectName: sub ? sub.name : undefined,
      subjectColor: sub ? sub.color : undefined,
      tags: this.editingTags,
    });

    this.toast.success('Nota salva com sucesso!');
  }

  deleteCurrent(): void {
    const id = this.selectedNoteId();
    if (!id) return;

    this.notesSvc.deleteNote(id);
    this.toast.success('Nota excluída');
    const remaining = this.notesSvc.notes();
    if (remaining.length > 0) {
      this.selectNote(remaining[0]);
    } else {
      this.selectedNoteId.set(null);
      this.editingTitle = '';
      this.editingContent = '';
    }
  }

  addTag(): void {
    const tag = this.editingTagInput.trim();
    if (tag && !this.editingTags.includes(tag)) {
      this.editingTags.push(tag);
      this.editingTagInput = '';
    }
  }

  removeTag(index: number): void {
    this.editingTags.splice(index, 1);
  }
}
