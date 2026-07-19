import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from '../../models/subject';

export interface ScheduleSlot {
  dayName: string;
  subjectName: string;
  subjectColor: string;
  durationMinutes: number;
  recommendedTopic: string;
}

@Component({
  selector: 'app-auto-scheduler',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="scheduler-overlay" (click)="onClose()">
      <div class="scheduler-modal card glass-card-mesh" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <span class="badge">📅 AUTO-SCHEDULER INTELIGENTE</span>
            <h2>Gerador de Cronograma de Estudos</h2>
          </div>
          <button class="close-btn" (click)="onClose()" aria-label="Fechar">✕</button>
        </div>

        <div class="modal-body">
          <p class="description">
            O algoritmo calcula a distribuição ideal de matérias e sessões de Pomodoro com base na sua disponibilidade e data da prova.
          </p>

          <div class="form-grid">
            <div class="form-group">
              <label for="examDate">Data Alvo do Exame / Prova</label>
              <input type="date" id="examDate" [(ngModel)]="examDate" class="input-field" />
            </div>

            <div class="form-group">
              <label for="dailyHours">Horas Disponíveis por Dia</label>
              <select id="dailyHours" [(ngModel)]="dailyHours" class="input-field">
                <option [value]="1">1 hora / dia (Foco Leve)</option>
                <option [value]="2">2 horas / dia (Recomendado)</option>
                <option [value]="3">3 horas / dia (Intensivo)</option>
                <option [value]="4">4+ horas / dia (Modo Imersão)</option>
              </select>
            </div>
          </div>

          <button class="btn btn-primary generate-btn" (click)="generateSchedule()">
            ⚡ Gerar Cronograma Otimizado
          </button>

          @if (generatedSchedule().length > 0) {
            <div class="schedule-result animate-fade-in">
              <h3>🗓️ Seu Plano de Estudo Semanal Sugerido</h3>
              <div class="slots-list">
                @for (slot of generatedSchedule(); track $index) {
                  <div class="slot-card" [style.border-left-color]="slot.subjectColor">
                    <div class="slot-day">{{ slot.dayName }}</div>
                    <div class="slot-details">
                      <div class="slot-subject" [style.color]="slot.subjectColor">{{ slot.subjectName }}</div>
                      <div class="slot-topic">{{ slot.recommendedTopic }}</div>
                    </div>
                    <div class="slot-time">{{ slot.durationMinutes }} min</div>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="onClose()">Cancelar</button>
          @if (generatedSchedule().length > 0) {
            <button class="btn btn-success" (click)="applySchedule()">
              ✅ Aplicar ao Calendário & Dashboard
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scheduler-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .scheduler-modal {
      width: 100%;
      max-width: 580px;
      max-height: 85vh;
      overflow-y: auto;
      padding: 1.5rem;
      border-radius: 20px;
      box-shadow: var(--shadow-xl);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .badge {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--primary);
      letter-spacing: 0.08em;
    }

    .modal-header h2 {
      margin: 0.2rem 0 0;
      font-size: 1.35rem;
      color: var(--text);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }

    .close-btn:hover {
      background: var(--bg-hover);
      color: var(--text);
    }

    .description {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 1.25rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 0.4rem;
    }

    .input-field {
      width: 100%;
      box-sizing: border-box;
    }

    .generate-btn {
      width: 100%;
      justify-content: center;
      padding: 0.75rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
    }

    .schedule-result h3 {
      font-size: 1rem;
      color: var(--text);
      margin-bottom: 0.75rem;
    }

    .slots-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      max-height: 240px;
      overflow-y: auto;
      padding-right: 0.25rem;
    }

    .slot-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.65rem 0.85rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-left: 4px solid var(--primary);
      border-radius: 8px;
    }

    .slot-day {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-secondary);
      width: 80px;
    }

    .slot-details {
      flex: 1;
    }

    .slot-subject {
      font-size: 0.85rem;
      font-weight: 700;
    }

    .slot-topic {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .slot-time {
      font-size: 0.78rem;
      font-weight: 700;
      background: var(--bg-hover);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      color: var(--text-secondary);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }

    @media (max-width: 480px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AutoSchedulerComponent {
  @Input() subjects: Subject[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() scheduleApplied = new EventEmitter<ScheduleSlot[]>();

  examDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  dailyHours = 2;

  generatedSchedule = signal<ScheduleSlot[]>([]);

  onClose(): void {
    this.close.emit();
  }

  generateSchedule(): void {
    const subs = this.subjects || [];
    if (subs.length === 0) {
      this.generatedSchedule.set([
        { dayName: 'Segunda', subjectName: 'Matemática / Lógica', subjectColor: '#2563EB', durationMinutes: 50, recommendedTopic: 'Resolução de Exercícios & Conceitos Base' },
        { dayName: 'Terça', subjectName: 'Português & Gramática', subjectColor: '#7C3AED', durationMinutes: 50, recommendedTopic: 'Leitura Dramática & Interpretação de Texto' },
        { dayName: 'Quarta', subjectName: 'Conhecimentos Gerais', subjectColor: '#10B981', durationMinutes: 50, recommendedTopic: 'Revisão de Legislação e Atualidades' },
        { dayName: 'Quinta', subjectName: 'Matemática / Lógica', subjectColor: '#2563EB', durationMinutes: 50, recommendedTopic: 'Simulado Rápido de 10 Questões' },
        { dayName: 'Sexta', subjectName: 'Português & Gramática', subjectColor: '#7C3AED', durationMinutes: 50, recommendedTopic: 'Fixação via Flashcards' }
      ]);
      return;
    }

    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const slots: ScheduleSlot[] = [];

    days.forEach((day, index) => {
      const sub = subs[index % subs.length];
      slots.push({
        dayName: day,
        subjectName: sub.name,
        subjectColor: sub.color || '#2563EB',
        durationMinutes: this.dailyHours * 25,
        recommendedTopic: `Ciclo de Foco Pomodoro (${this.dailyHours * 25} min)`
      });
    });

    this.generatedSchedule.set(slots);
  }

  applySchedule(): void {
    this.scheduleApplied.emit(this.generatedSchedule());
    this.onClose();
  }
}
