import { Component, OnInit, inject, DestroyRef, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, forkJoin, of, timeout, tap, EMPTY } from 'rxjs';
import { ConfigService } from '../services/config.service';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import { Skeleton } from '../skeleton/skeleton';
import { Subject } from '../models/subject';
import { Task } from '../models/task';
import { StudyGoal } from '../models/study-goal';
import { StudySession } from '../models/study-session';
import { ChallengeStats, ChallengeAttempt } from '../models/challenge-attempt';
import { ChallengeGoal } from '../models/challenge-goal';
import { ErrorLog } from '../models/error-log';
import { ContributionHeatmap } from '../contribution-heatmap/contribution-heatmap';
import { ConfettiService } from '../services/confetti.service';
import { AchievementService } from '../services/achievement.service';
import { AnimatedNumber } from '../animated-number/animated-number';
import { SkillTreeComponent } from '../components/skill-tree/skill-tree';
import { ExamReadinessComponent } from '../components/exam-readiness/exam-readiness';
import { AutoSchedulerComponent, ScheduleSlot } from '../components/auto-scheduler/auto-scheduler';

import { NotesService } from '../services/notes.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    Skeleton,
    FormsModule,
    ContributionHeatmap,
    AnimatedNumber,
    SkillTreeComponent,
    ExamReadinessComponent,
    AutoSchedulerComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  notesSvc = inject(NotesService);
  recentNotes = computed(() => this.notesSvc.recentlyEdited());

  showAutoScheduler = signal(false);
  activeTab = signal<'foco' | 'evolucao'>('foco');

  toggleAutoScheduler(): void {
    this.showAutoScheduler.update(v => !v);
  }

  onScheduleApplied(slots: ScheduleSlot[]): void {
    this.toast.success('Cronograma otimizado aplicado com sucesso!');
    this.confetti.fireConfetti();
  }
  private auth = inject(AuthService);
  protected config = inject(ConfigService);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private confetti = inject(ConfettiService);
  private achievementSvc = inject(AchievementService);

  subjects = signal<Subject[]>([]);
  allTasks = signal<Task[]>([]);
  pendingTasks = signal<Task[]>([]);
  goals = signal<StudyGoal[]>([]);
  sessions = signal<StudySession[]>([]);
  errorLogs = signal<ErrorLog[]>([]);
  history = signal<ChallengeAttempt[]>([]);
  dailyQuestClaimed = signal<boolean>(false);

  donutCircumference = 2 * Math.PI * 50;
  dailyGoalHours = 2;
  hoursPerSubject = signal<{ name: string; hours: number; color: string }[]>([]);
  weeklyProgress = signal<{ day: string; hours: number }[]>([]);
  taskCompletionRate = signal(0);

  loading = signal(true);
  challengeStats = signal<ChallengeStats | null>(null);
  challengeGoals = signal<ChallengeGoal[]>([]);
  pendingPageSize = 5;
  pendingShowAll = signal(false);
  displayedPendingTasks = computed(() => this.pendingShowAll() ? this.pendingTasks() : this.pendingTasks().slice(0, this.pendingPageSize));
  activeChartTab = signal<'confidence' | 'hours' | 'weekly' | 'completion'>('confidence');

  todayStr = computed(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  questPomodoro = computed(() => this.sessions().some(s => s.date === this.todayStr()));
  
  questError = computed(() => this.errorLogs().some(e => {
    if (!e.createdAt) return false;
    return e.createdAt.split('T')[0] === this.todayStr();
  }));
  
  questNoAi = computed(() => this.history().some(h => {
    if (!h.createdAt) return false;
    return !h.usedAi && h.createdAt.split('T')[0] === this.todayStr();
  }));

  allQuestsCompleted = computed(() => this.questPomodoro() && this.questError() && this.questNoAi());
  completedQuestsCount = computed(() => (this.questPomodoro() ? 1 : 0) + (this.questNoAi() ? 1 : 0) + (this.questError() ? 1 : 0));
  xp = computed(() => this.auth.user()?.totalExperience ?? 0);

  maxHours = computed(() => Math.max(...this.hoursPerSubject().map((s) => s.hours), 1));
  maxWeekly = computed(() => Math.max(...this.weeklyProgress().map((w) => w.hours), 1));
  confidenceSkills = computed(() => (this.challengeStats()?.skills?.sort((a, b) => b.confidencePercent - a.confidencePercent) ?? []));
  streak = computed(() => this.challengeStats()?.currentStreak ?? 0);
  totalWithoutAi = computed(() => this.challengeStats()?.totalWithoutAi ?? 0);
  isNewUser = computed(() => !this.loading() && this.subjects().length === 0 && this.allTasks().length === 0 && this.sessions().length === 0);

  weeklySubject = computed(() => {
    const list = this.subjects();
    if (!list || list.length === 0) return null;
    const sorted = [...list].sort((a, b) => a.id.localeCompare(b.id));
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekOfYear = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
    return sorted[weekOfYear % sorted.length];
  });

  upcomingTasks = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    return this.allTasks()
      .filter((t) => {
        if (!t.dueDate || t.status === 'completed') return false;
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        return due >= today && due <= threeDaysFromNow;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  });

  reviewTasks = computed(() => {
    const today = this.todayStr();
    return this.allTasks().filter((t) => {
      return t.status === 'completed' && t.nextReviewDate && t.nextReviewDate <= today;
    });
  });

  reopenForReview(taskId: string): void {
    this.api.updateTaskStatus(taskId, 'in_progress').subscribe({
      next: () => {
        this.toast.success('Tarefa reaberta para revisão no Kanban!');
        // Recarregar os dados do dashboard
        const user = this.auth.user();
        if (user) this.loadDashboard(user);
      },
      error: () => {
        this.toast.error('Erro ao reabrir tarefa para revisão.');
      }
    });
  }

  ngOnInit(): void {
    this.auth
      .waitForUser()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(20_000),
        catchError(() => {
          this.loading.set(false);
          return EMPTY;
        }),
        tap((user) => {
          if (!user) {
            this.loading.set(false);
            return;
          }
          this.loadDashboard(user);
          this.checkAchievements();
        }),
      )
      .subscribe();
  }

  private loadDashboard(user: { id: string }): void {
    forkJoin({
      subjects: this.api.getSubjects(user.id).pipe(timeout(15_000), catchError(() => of([] as Subject[]))),
      tasks: this.api.getTasks(user.id).pipe(timeout(15_000), catchError(() => of([] as Task[]))),
      goals: this.api.getGoals(user.id).pipe(timeout(15_000), catchError(() => of([] as StudyGoal[]))),
      sessions: this.api.getSessions().pipe(timeout(15_000), catchError(() => of([] as StudySession[]))),
      challengeStats: this.api.getChallengeStats().pipe(timeout(15_000), catchError(() => of(null))),
      challengeGoals: this.api.getChallengeGoals().pipe(timeout(15_000), catchError(() => of([] as ChallengeGoal[]))),
      errorLogs: this.api.getErrorLogs().pipe(timeout(15_000), catchError(() => of([] as ErrorLog[]))),
      history: this.api.getHistory().pipe(timeout(15_000), catchError(() => of([] as ChallengeAttempt[]))),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (r) => {
          this.subjects.set(Array.isArray(r.subjects) ? r.subjects : []);
          this.allTasks.set(Array.isArray(r.tasks) ? r.tasks : []);
          this.pendingTasks.set(this.allTasks().filter((x) => x && x.status !== 'completed'));
          this.goals.set(Array.isArray(r.goals) ? r.goals : []);
          this.sessions.set(Array.isArray(r.sessions) ? r.sessions : []);
          this.challengeStats.set(r.challengeStats);
          this.challengeGoals.set(Array.isArray(r.challengeGoals) ? r.challengeGoals : []);
          this.errorLogs.set(Array.isArray(r.errorLogs) ? r.errorLogs : []);
          this.history.set(Array.isArray(r.history) ? r.history : []);
          
          const userId = user.id;
          const today = this.todayStr();
          const claimed = localStorage.getItem(`claimed_daily_quest_${userId}_${today}`) === 'true';
          this.dailyQuestClaimed.set(claimed);

          this.computeCharts();
          this.checkGoalReminders();
          this.checkAchievements();
        },
        error: () => {},
      });
  }

  private shownAchievements = new Set<string>();

  private checkAchievements(): void {
    const streak = this.streak();
    if (streak >= 7 && !this.shownAchievements.has('streak7')) {
      this.shownAchievements.add('streak7');
      this.achievementSvc.show('Guardião do Foco', 'Mantenha 7 dias de estudo consecutivos!', 50);
    }
    if (streak >= 30 && !this.shownAchievements.has('streak30')) {
      this.shownAchievements.add('streak30');
      this.achievementSvc.show('Mestre da Disciplina', '30 dias consecutivos de estudo!', 200);
    }
    const totalTasks = this.allTasks().length;
    if (totalTasks >= 10 && !this.shownAchievements.has('tasks10')) {
      this.shownAchievements.add('tasks10');
      this.achievementSvc.show('Os 10 Desafios', 'Criou 10 desafios para si mesmo.', 30);
    }
    if (totalTasks >= 50 && !this.shownAchievements.has('tasks50')) {
      this.shownAchievements.add('tasks50');
      this.achievementSvc.show('Mestre dos Desafios', 'Criou 50 desafios!', 100);
    }
    const totalSessions = this.sessions().length;
    if (totalSessions >= 20 && !this.shownAchievements.has('session20')) {
      this.shownAchievements.add('session20');
      this.achievementSvc.show('20 Sessões', 'Completou 20 sessões de estudo.', 50);
    }
  }

  private computeCharts(): void {
    const subjectMap = new Map<string, { name: string; hours: number; color: string }>();
    for (const subj of this.subjects()) {
      subjectMap.set(subj.id, { name: subj.name, hours: 0, color: subj.color });
    }
    for (const ses of this.sessions()) {
      const entry = subjectMap.get(ses.subjectId);
      if (entry) {
        entry.hours += ses.durationMinutes / 60;
      }
    }
    this.hoursPerSubject.set(Array.from(subjectMap.values()).filter((s) => s.hours > 0));

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      weekMap.set(key, 0);
    }
    for (const ses of this.sessions()) {
      if (weekMap.has(ses.date)) {
        weekMap.set(ses.date, weekMap.get(ses.date)! + ses.durationMinutes / 60);
      }
    }
    this.weeklyProgress.set(Array.from(weekMap.entries()).map(([dateStr, hours]) => {
      const d = new Date(dateStr + 'T00:00:00');
      return { day: dayNames[d.getDay()], hours: Math.round(hours * 10) / 10 };
    }));

    const completed = this.allTasks().filter((t) => t.status === 'completed').length;
    const total = this.allTasks().length;
    this.taskCompletionRate.set(total > 0 ? Math.round((completed / total) * 100) : 0);
  }

  quickSubjectId = '';
  quickDuration = 25;
  saving = signal(false);
  completingTaskId = signal<string | null>(null);

  quickAddSession(): void {
    if (!this.quickSubjectId || !this.quickDuration) {
      this.toast.error('Selecione uma matéria e duração');
      return;
    }
    const user = this.auth.user();
    if (!user) return;
    this.saving.set(true);
    const now = new Date().toISOString().split('T')[0];
    this.api
      .createSession(
        {
          subjectId: this.quickSubjectId,
          durationMinutes: this.quickDuration,
          notes: '',
          date: now,
        },
        user.id,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success(`Sessão de ${this.quickDuration}min registrada!`);
          this.saving.set(false);
          this.refreshAfterSession(user.id);
        },
        error: () => {
          this.saving.set(false);
        },
      });
  }

  quickCompleteTask(task: Task): void {
    this.completingTaskId.set(task.id);
    this.api
      .updateTaskStatus(task.id, 'completed')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.completingTaskId.set(null)),
      )
      .subscribe({
        next: () => {
          this.toast.show('Tarefa concluída!', 'success', {
            label: 'Desfazer',
            fn: () => {
              this.api.updateTaskStatus(task.id, 'pending').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
                this.toast.success('Tarefa restaurada');
                const user = this.auth.user();
                if (user) this.refreshAfterTask(user.id);
              });
            },
          });
          this.confetti.fireConfetti({ count: 30 });
          const user = this.auth.user();
          if (user) this.refreshAfterTask(user.id);
        },
        error: () => {},
      });
  }

  private refreshAfterSession(userId: string): void {
    forkJoin({
      sessions: this.api.getSessions().pipe(catchError(() => of([] as StudySession[]))),
      challengeStats: this.api.getChallengeStats().pipe(catchError(() => of(null))),
      challengeGoals: this.api.getChallengeGoals().pipe(catchError(() => of([] as ChallengeGoal[]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((r) => {
        this.sessions.set(Array.isArray(r.sessions) ? r.sessions : []);
        this.challengeStats.set(r.challengeStats);
        this.challengeGoals.set(Array.isArray(r.challengeGoals) ? r.challengeGoals : []);
        this.computeCharts();
      });
  }

  private refreshAfterTask(userId: string): void {
    forkJoin({
      tasks: this.api.getTasks(userId).pipe(catchError(() => of([] as Task[]))),
      challengeStats: this.api.getChallengeStats().pipe(catchError(() => of(null))),
      challengeGoals: this.api.getChallengeGoals().pipe(catchError(() => of([] as ChallengeGoal[]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((r) => {
        this.allTasks.set(Array.isArray(r.tasks) ? r.tasks : []);
        this.pendingTasks.set(this.allTasks().filter((x) => x.status !== 'completed'));
        this.challengeStats.set(r.challengeStats);
        this.challengeGoals.set(Array.isArray(r.challengeGoals) ? r.challengeGoals : []);
        this.computeCharts();
      });
  }

  startPomodoro(task: Task): void {
    this.router.navigate(['/pomodoro'], { queryParams: { subjectId: task.subjectId } });
  }

  isTaskOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(task.dueDate) < today;
  }

  private checkGoalReminders(): void {
    const today = new Date();
    for (const goal of this.challengeGoals()) {
      const deadline = new Date(goal.deadlineDate);
      const daysUntilDeadline = Math.ceil(
        (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilDeadline >= 0 && daysUntilDeadline <= 3) {
        if (goal.currentCount < goal.targetCount) {
          this.toast.info(
            `Meta de desafio quase vencendo: ${goal.currentCount}/${goal.targetCount} concluídos. Faltam ${daysUntilDeadline} dias.`,
          );
        }
      }
    }
  }

  claimDailyQuest(): void {
    if (!this.allQuestsCompleted() || this.dailyQuestClaimed()) return;
    
    this.api.claimDailyQuest()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedUser) => {
          this.auth.user.set(updatedUser);
          localStorage.setItem('kognita_user', JSON.stringify(updatedUser));
          const userId = updatedUser.id;
          const today = this.todayStr();
          localStorage.setItem(`claimed_daily_quest_${userId}_${today}`, 'true');
          this.dailyQuestClaimed.set(true);
          this.toast.success('Parabéns! Você resgatou +50 XP da missão diária de hoje! 🏆');
          this.confetti.fireConfetti({ count: 60 });
          this.checkAchievements();
        },
        error: () => {
          this.toast.error('Erro ao resgatar recompensa diária.');
        }
      });
  }
}
