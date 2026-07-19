import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ConfettiService } from '../services/confetti.service';
import { VaultSnapshot } from '../models/vault';

@Injectable({ providedIn: 'root' })
export class VaultService {
  private readonly storageKey = 'kognita_knowledge_vault';

  readonly snapshots = signal<VaultSnapshot[]>(this.loadVault());

  saveSnapshot(snap: Omit<VaultSnapshot, 'id' | 'timestamp'>): void {
    const newSnap: VaultSnapshot = {
      ...snap,
      id: 'snap_' + Date.now(),
      timestamp: new Date().toISOString(),
    };
    const updated = [newSnap, ...this.snapshots()];
    this.snapshots.set(updated);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch {}
  }

  private loadVault(): VaultSnapshot[] {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'snap_demo_1',
        timestamp: new Date().toISOString(),
        subjectName: 'Banco de Dados & SQL',
        subjectColor: '#7C3AED',
        durationMinutes: 50,
        type: 'pomodoro',
        summaryTitle: 'Sessão de Foco em Indexação B-Tree e Tuning de Queries',
        notesContent: 'Revisado comandos EXPLAIN ANALYZE e criação de índices compostos em colunas de busca frequente.',
        accuracyPercent: 92,
        tags: ['SQL', 'Performance'],
      },
      {
        id: 'snap_demo_2',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        subjectName: 'Arquitetura de Software',
        subjectColor: '#2563EB',
        durationMinutes: 25,
        type: 'note',
        summaryTitle: 'Caderno de Notas: Padrões Event-Driven & Message Queues',
        notesContent: 'Comparação entre Kafka e RabbitMQ para sistemas distribuídos com alta disponibilidade.',
        accuracyPercent: 88,
        tags: ['Architecture', 'Backend'],
      },
    ];
  }
}

import { Injectable } from '@angular/core';

@Component({
  selector: 'app-vault',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vault.html',
  styleUrl: './vault.css',
})
export class Vault implements OnInit {
  vaultSvc = inject(VaultService);
  private toast = inject(ToastService);

  searchQuery = signal('');
  selectedTag = signal<string | null>(null);

  filteredSnapshots = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const tag = this.selectedTag();
    let list = this.vaultSvc.snapshots();

    if (tag) {
      list = list.filter((s) => s.tags && s.tags.includes(tag));
    }

    if (q) {
      list = list.filter(
        (s) =>
          s.summaryTitle.toLowerCase().includes(q) ||
          (s.notesContent && s.notesContent.toLowerCase().includes(q)) ||
          s.subjectName.toLowerCase().includes(q)
      );
    }

    return list;
  });

  allTags = computed(() => {
    const set = new Set<string>();
    this.vaultSvc.snapshots().forEach((s) => s.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  });

  ngOnInit(): void {}

  exportAsJson(): void {
    const data = JSON.stringify(this.vaultSvc.snapshots(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kognita_cofre_conhecimento_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success('Backup do Cofre do Conhecimento exportado com sucesso! 📄');
  }

  exportAsMarkdown(): void {
    let md = `# 🏛️ Cofre do Conhecimento — Kognita\n\n`;
    md += `*Exportado em: ${new Date().toLocaleString('pt-BR')}*\n\n---\n\n`;

    this.vaultSvc.snapshots().forEach((s) => {
      md += `## 📚 ${s.summaryTitle}\n`;
      md += `- **Data**: ${new Date(s.timestamp).toLocaleString('pt-BR')}\n`;
      md += `- **Disciplina**: ${s.subjectName}\n`;
      md += `- **Duração**: ${s.durationMinutes} min\n`;
      if (s.tags?.length) md += `- **Tags**: ${s.tags.map((t) => '#' + t).join(' ')}\n`;
      if (s.notesContent) md += `\n### Anotações:\n${s.notesContent}\n`;
      md += `\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kognita_caderno_estudos_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success('Caderno de Estudos exportado em Markdown (.md)! 📝');
  }
}
