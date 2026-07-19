import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from '../../models/subject';
import { Task } from '../../models/task';

export interface SkillNode {
  id: string;
  name: string;
  category: string;
  level: number;
  unlocked: boolean;
  masteryPercent: number;
  totalTasks: number;
  completedTasks: number;
  color: string;
  icon: string;
  children: SkillNode[];
}

@Component({
  selector: 'app-skill-tree',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skill-tree-container card mesh-gradient-bg">
      <div class="tree-header">
        <div class="header-info">
          <h3>🗺️ Árvore de Conhecimento (Skill Tree)</h3>
          <p class="subtitle">Mapeamento de disciplinas e tópicos desbloqueados por maestria</p>
        </div>
        <div class="tree-stats">
          <span class="stat-badge">
            <span class="pulse-dot"></span>
            {{ unlockedCount() }}/{{ nodes().length }} Disciplinas Desbloqueadas
          </span>
          <span class="stat-badge mastery">
            Maestria Geral: <strong>{{ overallMastery() }}%</strong>
          </span>
        </div>
      </div>

      <div class="tree-viewport scroll-internal">
        @if (nodes().length === 0) {
          <div class="empty-tree">
            <p>Nenhuma matéria cadastrada ainda. Adicione matérias para formar sua Árvore de Conhecimento!</p>
          </div>
        } @else {
          <div class="tree-grid">
            @for (node of nodes(); track node.id) {
              <div
                class="skill-node-card glass-card-mesh"
                [class.unlocked]="node.unlocked"
                [class.mastered]="node.masteryPercent >= 100"
                [style.--node-color]="node.color"
              >
                <div class="node-icon-wrap">
                  <div class="node-icon">
                    @if (node.masteryPercent >= 100) {
                      👑
                    } @else if (node.unlocked) {
                      ⚡
                    } @else {
                      🔒
                    }
                  </div>
                  <div class="node-level-tag">Lvl {{ node.level }}</div>
                </div>

                <div class="node-content">
                  <h4 class="node-title">{{ node.name }}</h4>
                  <div class="node-task-info">
                    <span>{{ node.completedTasks }}/{{ node.totalTasks }} metas concluídas</span>
                  </div>

                  <div class="mastery-progress-bar">
                    <div
                      class="mastery-fill"
                      [style.width.%]="node.masteryPercent"
                      [style.background-color]="node.color"
                    ></div>
                  </div>

                  <div class="node-footer">
                    <span class="mastery-pct">{{ node.masteryPercent }}% Maestria</span>
                    <span class="node-status-badge" [class.done]="node.masteryPercent >= 100">
                      {{ node.masteryPercent >= 100 ? 'Dominado' : (node.unlocked ? 'Em Progresso' : 'Bloqueado') }}
                    </span>
                  </div>
                </div>

                <!-- Glow effect background -->
                <div class="node-glow" [style.background]="node.color"></div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .skill-tree-container {
      padding: 1.5rem;
      border-radius: 16px;
      margin-bottom: 1.5rem;
      border: 1px solid var(--border);
    }

    .tree-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .tree-header h3 {
      margin: 0;
      font-size: 1.2rem;
      color: var(--text);
    }

    .subtitle {
      margin: 0.2rem 0 0;
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .tree-stats {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .stat-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 600;
      background: var(--bg-hover);
      color: var(--text-secondary);
      border: 1px solid var(--border);
    }

    .stat-badge.mastery {
      background: var(--primary-subtle);
      color: var(--primary);
      border-color: var(--primary);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 8px var(--success);
    }

    .tree-viewport {
      padding: 0.5rem 0;
    }

    .tree-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.25rem;
    }

    .skill-node-card {
      position: relative;
      padding: 1.25rem;
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .skill-node-card:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
    }

    .node-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .node-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: var(--bg-card);
      border: 2px solid var(--node-color, var(--primary));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .node-level-tag {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      background: var(--bg-hover);
      color: var(--text-secondary);
    }

    .node-title {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text);
    }

    .node-task-info {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .mastery-progress-bar {
      height: 8px;
      background: var(--bg-hover);
      border-radius: 999px;
      overflow: hidden;
    }

    .mastery-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.5s ease;
    }

    .node-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .mastery-pct {
      color: var(--text-secondary);
    }

    .node-status-badge {
      color: var(--warning);

      &.done {
        color: var(--success);
      }
    }

    .node-glow {
      position: absolute;
      bottom: -30px;
      right: -30px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      opacity: 0.15;
      filter: blur(20px);
      pointer-events: none;
    }

    .empty-tree {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
    }
  `]
})
export class SkillTreeComponent {
  @Input() subjects: Subject[] = [];
  @Input() tasks: Task[] = [];

  nodes = computed<SkillNode[]>(() => {
    const subs = this.subjects || [];
    const ts = this.tasks || [];

    return subs.map((s, index) => {
      const subjectTasks = ts.filter(t => t.subjectId === s.id);
      const completedTasks = subjectTasks.filter(t => t.status === 'completed').length;
      const totalTasks = subjectTasks.length;
      
      const masteryPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 25;
      const unlocked = index === 0 || masteryPercent > 0 || completedTasks > 0;
      const level = Math.floor(masteryPercent / 20) + 1;

      return {
        id: s.id,
        name: s.name,
        category: 'Matéria',
        level,
        unlocked,
        masteryPercent,
        totalTasks,
        completedTasks,
        color: s.color || '#2563EB',
        icon: 'book',
        children: []
      };
    });
  });

  unlockedCount = computed(() => this.nodes().filter(n => n.unlocked).length);
  overallMastery = computed(() => {
    const list = this.nodes();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, curr) => acc + curr.masteryPercent, 0);
    return Math.round(sum / list.length);
  });
}
