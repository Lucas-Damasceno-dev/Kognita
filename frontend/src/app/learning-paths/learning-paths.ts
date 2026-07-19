import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ConfettiService } from '../services/confetti.service';
import { Task } from '../models/task';
import { LearningPath, LearningPathNode } from '../models/learning-path';

@Component({
  selector: 'app-learning-paths',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './learning-paths.html',
  styleUrl: './learning-paths.css',
})
export class LearningPaths implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confetti = inject(ConfettiService);

  tasks = signal<Task[]>([]);
  paths = signal<LearningPath[]>([]);

  selectedPathId = signal<string | null>(null);

  // Form for path creation
  newPathTitle = '';
  newPathDescription = '';
  selectedTaskIds: string[] = [];

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.api.getTasks(user.id).subscribe((ts) => {
        this.tasks.set(Array.isArray(ts) ? ts : []);
        this.initDefaultPaths();
      });
    }
  }

  private initDefaultPaths(): void {
    const saved = localStorage.getItem('kognita_learning_paths');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.paths.set(parsed);
        if (parsed.length > 0) this.selectedPathId.set(parsed[0].id);
        return;
      } catch {}
    }

    // Default roadmap
    const ts = this.tasks();
    const defaultNodes: LearningPathNode[] = ts.slice(0, 4).map((t, idx) => ({
      id: 'node_' + idx,
      taskId: t.id,
      taskTitle: t.title,
      subjectName: t.subjectName,
      order: idx + 1,
      completed: t.status === 'completed',
      unlocked: idx === 0 || (idx > 0 && ts[idx - 1]?.status === 'completed'),
    }));

    const demoPath: LearningPath = {
      id: 'path_demo_1',
      title: 'Rota de Engenharia de Software & Banco de Dados',
      description: 'Caminho sequencial encadeado: Conclua os desafios na ordem para desbloquear o próximo módulo!',
      nodes: defaultNodes.length > 0 ? defaultNodes : [
        { id: 'n1', taskId: '1', taskTitle: '1. Modelagem Relacional & Normalização (3FN)', subjectName: 'SQL', order: 1, completed: true, unlocked: true },
        { id: 'n2', taskId: '2', taskTitle: '2. Queries Complexas com JOIN & Indexação B-Tree', subjectName: 'SQL', order: 2, completed: false, unlocked: true },
        { id: 'n3', taskId: '3', taskTitle: '3. Arquitetura de Microserviços & REST API', subjectName: 'Backend', order: 3, completed: false, unlocked: false },
        { id: 'n4', taskId: '4', taskTitle: '4. Deploy CI/CD com Docker & Kubernetes', subjectName: 'DevOps', order: 4, completed: false, unlocked: false },
      ],
      createdAt: new Date().toISOString(),
    };

    this.paths.set([demoPath]);
    this.selectedPathId.set(demoPath.id);
    this.saveToStorage([demoPath]);
  }

  selectedPath = computed(() => {
    return this.paths().find((p) => p.id === this.selectedPathId()) || null;
  });

  selectPath(id: string): void {
    this.selectedPathId.set(id);
  }

  toggleNodeComplete(node: LearningPathNode): void {
    if (!node.unlocked && !node.completed) {
      this.toast.error('Este módulo está bloqueado! Complete o módulo anterior primeiro.');
      return;
    }

    const currentPath = this.selectedPath();
    if (!currentPath) return;

    const updatedNodes = currentPath.nodes.map((n, index, arr) => {
      if (n.id === node.id) {
        const nextCompleted = !n.completed;
        if (nextCompleted) {
          this.confetti.fireConfetti({ count: 20 });
          this.toast.success(`Módulo "${n.taskTitle}" concluído! Próximo nível desbloqueado 🔓`);
        }
        return { ...n, completed: nextCompleted };
      }
      return n;
    });

    // Re-calculate unlocks
    for (let i = 0; i < updatedNodes.length; i++) {
      if (i === 0) {
        updatedNodes[i].unlocked = true;
      } else {
        updatedNodes[i].unlocked = updatedNodes[i - 1].completed;
      }
    }

    const updatedPaths = this.paths().map((p) => (p.id === currentPath.id ? { ...p, nodes: updatedNodes } : p));
    this.paths.set(updatedPaths);
    this.saveToStorage(updatedPaths);
  }

  createPath(): void {
    if (!this.newPathTitle.trim()) {
      this.toast.error('Informe um título para o Caminho de Aprendizado');
      return;
    }

    const selectedTasks = this.tasks().filter((t) => this.selectedTaskIds.includes(t.id));
    const nodes: LearningPathNode[] = selectedTasks.map((t, idx) => ({
      id: 'node_' + Date.now() + '_' + idx,
      taskId: t.id,
      taskTitle: t.title,
      subjectName: t.subjectName,
      order: idx + 1,
      completed: t.status === 'completed',
      unlocked: idx === 0,
    }));

    const newPath: LearningPath = {
      id: 'path_' + Date.now(),
      title: this.newPathTitle,
      description: this.newPathDescription || 'Trilha de estudos encadeada.',
      nodes,
      createdAt: new Date().toISOString(),
    };

    const updated = [newPath, ...this.paths()];
    this.paths.set(updated);
    this.selectedPathId.set(newPath.id);
    this.saveToStorage(updated);

    this.newPathTitle = '';
    this.newPathDescription = '';
    this.selectedTaskIds = [];
    this.toast.success('Novo Caminho de Aprendizado criado com sucesso!');
  }

  toggleTaskSelection(id: string): void {
    if (this.selectedTaskIds.includes(id)) {
      this.selectedTaskIds = this.selectedTaskIds.filter((t) => t !== id);
    } else {
      this.selectedTaskIds.push(id);
    }
  }

  private saveToStorage(paths: LearningPath[]): void {
    try {
      localStorage.setItem('kognita_learning_paths', JSON.stringify(paths));
    } catch {}
  }
}
