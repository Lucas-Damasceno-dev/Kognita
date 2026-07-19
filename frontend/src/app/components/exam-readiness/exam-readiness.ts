import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from '../../models/subject';
import { Task } from '../../models/task';
import { StudySession } from '../../models/study-session';
import { ErrorLog } from '../../models/error-log';

@Component({
  selector: 'app-exam-readiness',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="readiness-card card glass-card-mesh">
      <div class="readiness-header">
        <div class="title-wrap">
          <span class="readiness-badge">📊 PREVISÃO INTELIGENTE</span>
          <h3>Prontidão para Prova / Exame</h3>
        </div>
        <div class="score-pill" [class.high]="score() >= 75" [class.medium]="score() >= 50 && score() < 75">
          {{ score() }}%
        </div>
      </div>

      <div class="readiness-body">
        <div class="gauge-container">
          <svg viewBox="0 0 100 50" class="gauge-svg">
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="var(--border)"
              stroke-width="10"
              stroke-linecap="round"
            />
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              [attr.stroke]="scoreColor()"
              stroke-width="10"
              stroke-linecap="round"
              [attr.stroke-dasharray]="125.6"
              [attr.stroke-dashoffset]="125.6 * (1 - score() / 100)"
              style="transition: stroke-dashoffset 1s ease-out;"
            />
          </svg>
          <div class="score-number">{{ score() }}<span class="pct">%</span></div>
          <div class="score-status">{{ statusLabel() }}</div>
        </div>

        <div class="metrics-grid">
          <div class="metric-row">
            <span class="metric-name">🎯 Conclusão de Tarefas</span>
            <div class="metric-bar-wrap">
              <div class="metric-bar" [style.width.%]="taskRate()" style="background: var(--primary);"></div>
            </div>
            <span class="metric-val">{{ taskRate() }}%</span>
          </div>

          <div class="metric-row">
            <span class="metric-name">⏱️ Consistência de Pomodoro</span>
            <div class="metric-bar-wrap">
              <div class="metric-bar" [style.width.%]="sessionRate()" style="background: var(--accent);"></div>
            </div>
            <span class="metric-val">{{ sessionRate() }}%</span>
          </div>

          <div class="metric-row">
            <span class="metric-name">🛡️ Diário de Erros (Resolução)</span>
            <div class="metric-bar-wrap">
              <div class="metric-bar" [style.width.%]="errorLogRate()" style="background: var(--success);"></div>
            </div>
            <span class="metric-val">{{ errorLogRate() }}%</span>
          </div>
        </div>
      </div>

      <div class="readiness-diagnostic">
        <div class="diag-icon">💡</div>
        <div class="diag-text">
          <strong>Diagnóstico IA:</strong> {{ diagnosticText() }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .readiness-card {
      padding: 1.5rem;
      border-radius: 16px;
      margin-bottom: 1.5rem;
    }

    .readiness-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .readiness-badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--primary);
      margin-bottom: 0.25rem;
    }

    .title-wrap h3 {
      margin: 0;
      font-size: 1.2rem;
      color: var(--text);
    }

    .score-pill {
      font-size: 1.25rem;
      font-weight: 800;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      background: var(--warning-subtle);
      color: var(--warning);
      border: 1px solid var(--warning);
    }

    .score-pill.high {
      background: var(--success-subtle);
      color: var(--success);
      border-color: var(--success);
    }

    .score-pill.medium {
      background: var(--info-subtle);
      color: var(--info);
      border-color: var(--info);
    }

    .readiness-body {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 1.5rem;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .gauge-container {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .gauge-svg {
      width: 140px;
      height: 75px;
      overflow: visible;
    }

    .score-number {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text);
      line-height: 1;
      margin-top: -15px;
    }

    .score-number .pct {
      font-size: 1rem;
      color: var(--text-muted);
    }

    .score-status {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    .metrics-grid {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .metric-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.82rem;
    }

    .metric-name {
      width: 190px;
      color: var(--text-secondary);
      font-weight: 500;
      white-space: nowrap;
    }

    .metric-bar-wrap {
      flex: 1;
      height: 8px;
      background: var(--bg-hover);
      border-radius: 999px;
      overflow: hidden;
    }

    .metric-bar {
      height: 100%;
      border-radius: 999px;
      transition: width 0.6s ease;
    }

    .metric-val {
      width: 40px;
      text-align: right;
      font-weight: 700;
      color: var(--text);
    }

    .readiness-diagnostic {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      background: var(--primary-subtle);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 12px;
      font-size: 0.85rem;
      color: var(--text);
    }

    .diag-icon {
      font-size: 1.2rem;
    }

    .diag-text strong {
      color: var(--primary);
    }

    @media (max-width: 640px) {
      .readiness-body {
        grid-template-columns: 1fr;
      }
      .metric-name {
        width: 140px;
      }
    }
  `]
})
export class ExamReadinessComponent {
  @Input() tasks: Task[] = [];
  @Input() subjects: Subject[] = [];
  @Input() sessions: StudySession[] = [];
  @Input() errorLogs: ErrorLog[] = [];

  taskRate = computed(() => {
    const list = this.tasks || [];
    if (list.length === 0) return 60;
    const completed = list.filter(t => t.status === 'completed').length;
    return Math.round((completed / list.length) * 100);
  });

  sessionRate = computed(() => {
    const count = (this.sessions || []).length;
    return Math.min(100, Math.round(count * 8));
  });

  errorLogRate = computed(() => {
    const logs = this.errorLogs || [];
    if (logs.length === 0) return 90;
    const resolved = logs.filter((l: any) => l.resolved || l.status === 'resolved').length;
    return Math.round((resolved / logs.length) * 100);
  });

  score = computed(() => {
    return Math.round((this.taskRate() * 0.4) + (this.sessionRate() * 0.35) + (this.errorLogRate() * 0.25));
  });

  scoreColor = computed(() => {
    const s = this.score();
    if (s >= 75) return 'var(--success, #10b981)';
    if (s >= 50) return 'var(--primary, #3b82f6)';
    return 'var(--warning, #f59e0b)';
  });

  statusLabel = computed(() => {
    const s = this.score();
    if (s >= 80) return 'Prontidão Excelente';
    if (s >= 65) return 'Boa Preparação';
    if (s >= 50) return 'Em Evolução';
    return 'Atenção Necessária';
  });

  diagnosticText = computed(() => {
    const s = this.score();
    if (s >= 80) {
      return 'Você mantém uma excelente retenção e taxa de conclusão! Continue revisando o Diário de Erros para fixar os tópicos mais complexos.';
    } else if (s >= 60) {
      return 'Sua prontidão está sólida. Aumente o foco em sessões de Pomodoro para as matérias com menor volume de horas nesta semana.';
    } else {
      return 'Recomendamos priorizar o cumprimento das tarefas pendentes e registrar mais revisões no Pomodoro para elevar seu grau de retenção.';
    }
  });
}
