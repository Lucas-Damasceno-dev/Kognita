import { Component, OnInit, inject, signal, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, catchError, finalize } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Skeleton } from '../skeleton/skeleton';
import { Subject } from '../models/subject';
import { Task } from '../models/task';
import { StudySession } from '../models/study-session';
import { ChallengeStats, ChallengeAttempt } from '../models/challenge-attempt';

@Component({
  selector: 'app-reports',
  imports: [CommonModule, Skeleton],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {
  private api = inject(ApiService);
  protected auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  
  // Weekly data
  subjects = signal<Subject[]>([]);
  tasksCompleted = signal<number>(0);
  challengesNoAi = signal<number>(0);
  errorsSolved = signal<number>(0);
  pomodoroMinutes = signal<number>(0);
  sessionsCount = signal<number>(0);
  studyHours = signal<number>(0);
  streak = signal<number>(0);
  
  weeklyReportMarkdown = computed(() => {
    const user = this.auth.user();
    if (!user) return '';
    
    const subjectsList = this.subjects().map(s => s.name).join(', ') || 'Nenhuma matéria registrada';
    const hours = this.studyHours().toFixed(1);
    
    return `## 📊 Relatório Semanal de Competência Técnica — Kognita
- 🧑‍💻 **Estudante:** ${user.name} (Nível ${Math.floor(user.totalExperience / 100) + 1})
- ⏱️ **Foco Técnico:** Dediquei **${hours} horas** em ${this.sessionsCount()} sessões de estudos focados.
- 🎒 **Matérias Estudadas:** ${subjectsList}.
- 🛡️ **Autonomia Prática:** Completei **${this.challengesNoAi()} desafios práticos sem IA** (Provando capacidade real!).
- 🐞 **Resolução de Erros:** Analisei, documentei e superei **${this.errorsSolved()} erros** no Diário de Erros.
- 🔥 **Resiliência:** Sequência activa de **${this.streak()} dias** consecutivos construindo autonomia.

*Relatório gerado automaticamente pelo Kognita — Meu Diário de Competência Técnica.*`;
  });

  ngOnInit(): void {
    this.auth.waitForUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        if (user) {
          this.loadWeeklyData(user.id);
        }
      });
  }

  loadWeeklyData(userId: string): void {
    this.loading.set(true);
    
    // Get start of current week (last Sunday)
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    sunday.setHours(0, 0, 0, 0);
    
    const formattedSunday = sunday.toISOString().split('T')[0];

    forkJoin({
      subjects: this.api.getSubjects(userId).pipe(catchError(() => of([] as Subject[]))),
      tasks: this.api.getTasks(userId).pipe(catchError(() => of([] as Task[]))),
      sessions: this.api.getSessions().pipe(catchError(() => of([] as StudySession[]))),
      challengeStats: this.api.getChallengeStats().pipe(catchError(() => of(null))),
      errorLogs: this.api.getErrorLogs().pipe(catchError(() => of([] as any[]))),
      history: this.api.getHistory().pipe(catchError(() => of([] as ChallengeAttempt[])))
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res: any) => {
          this.subjects.set(res.subjects);
          
          // Tasks completed this week
          const weeklyTasks = res.tasks.filter((t: any) => t.status === 'completed' && t.updatedAt && new Date(t.updatedAt) >= sunday);
          this.tasksCompleted.set(weeklyTasks.length);
          
          // Challenge attempts without AI this week
          if (res.challengeStats) {
            this.streak.set(res.challengeStats.currentStreak || 0);
          }
          const weeklyHistory = (res.history || []).filter((h: any) => !h.usedAi && h.createdAt && new Date(h.createdAt) >= sunday);
          this.challengesNoAi.set(weeklyHistory.length);

          // Error logs resolved/created this week
          const weeklyErrors = res.errorLogs.filter((e: any) => {
            const date = e.createdAt ? new Date(e.createdAt) : new Date();
            return date >= sunday;
          });
          this.errorsSolved.set(weeklyErrors.length);

          // Study sessions this week
          const weeklySessions = res.sessions.filter((s: any) => new Date(s.date + 'T00:00:00') >= sunday);
          this.sessionsCount.set(weeklySessions.length);
          
          let minutes = 0;
          weeklySessions.forEach((s: any) => minutes += s.durationMinutes);
          this.pomodoroMinutes.set(minutes);
          this.studyHours.set(minutes / 60);
        }
      });
  }

  copyReport(): void {
    navigator.clipboard.writeText(this.weeklyReportMarkdown()).then(() => {
      this.toast.success('Relatório copiado para a área de transferência! 📋');
    }).catch(() => {
      this.toast.error('Erro ao copiar relatório.');
    });
  }
}
