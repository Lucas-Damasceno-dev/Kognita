import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Loading } from '../loading/loading';

interface CategoryEntry {
  name: string;
  tasks: string[];
}

@Component({
  selector: 'app-importer',
  imports: [FormsModule],
  templateUrl: './importer.html',

  styleUrl: './importer.css',
})
export class Importer {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private http = inject(HttpClient);

  // File structure import
  categories = signal<CategoryEntry[]>([]);

  addCategory(): void {
    this.categories.update((list) => [...list, { name: '', tasks: [''] }]);
  }

  removeCategory(index: number): void {
    this.categories.update((list) => list.filter((_, i) => i !== index));
  }

  addTask(catIndex: number): void {
    this.categories.update((list) => {
      const updated = [...list];
      updated[catIndex] = { ...updated[catIndex], tasks: [...updated[catIndex].tasks, ''] };
      return updated;
    });
  }

  removeTask(catIndex: number, taskIndex: number): void {
    this.categories.update((list) => {
      const updated = [...list];
      updated[catIndex] = {
        ...updated[catIndex],
        tasks: updated[catIndex].tasks.filter((_, i) => i !== taskIndex),
      };
      return updated;
    });
  }

  trackByIndex(index: number): number {
    return index;
  }

  get hasEmptyFields(): boolean {
    return this.categories().some((c) => !c.name.trim() || c.tasks.some((t) => !t.trim()));
  }

  get validPayload(): { category: string; tasks: string[] }[] {
    return this.categories()
      .filter((c) => c.name.trim())
      .map((c) => ({
        category: c.name.trim(),
        tasks: c.tasks.filter((t) => t.trim()),
      }))
      .filter((c) => c.tasks.length > 0);
  }

  saving = signal(false);

  importStudies(): void {
    const payload = this.validPayload;
    if (payload.length === 0) {
      this.toast.error('Adicione pelo menos uma categoria com tarefas');
      return;
    }
    this.saving.set(true);
    this.api.importFileStructure(payload, this.auth.user()!.id).subscribe({
      next: () => {
        this.toast.success(`${payload.length} categorias importadas com sucesso!`);
        this.categories.set([]);
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  // Roadmap import
  roadmapJson = signal('');
  selectedRoadmap = '';

  loadRoadmap(): void {
    if (!this.selectedRoadmap) return;
    const url = `/assets/roadmaps/${this.selectedRoadmap}.json`;
    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (data) => this.roadmapJson.set(data),
      error: () => {},
    });
  }

  importRoadmap(): void {
    if (!this.roadmapJson().trim()) {
      this.toast.error('Nenhum roadmap para importar');
      return;
    }
    this.api
      .importRoadmap(
        { title: this.selectedRoadmap, content: this.roadmapJson() },
        this.auth.user()!.id,
      )
      .subscribe({
        next: () => {
          this.toast.success('Roadmap importado com sucesso!');
          this.selectedRoadmap = '';
          this.roadmapJson.set('');
        },
        error: () => {},
      });
  }
}
