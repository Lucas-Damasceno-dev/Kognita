import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of, tap } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Skeleton } from '../skeleton/skeleton';
import { StudySession } from '../models/study-session';
import { ChallengeAttempt } from '../models/challenge-attempt';
import { Flashcard } from '../models/flashcard';

@Component({
  selector: 'app-analytics',
  imports: [CommonModule, Skeleton],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class Analytics implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  view: 'weekly' | 'monthly' = 'weekly';

  weeklyHours: { label: string; hours: number }[] = [];
  monthlyHours: { label: string; hours: number }[] = [];
  weeklyChallenges: { label: string; count: number }[] = [];
  heatmapDays: { date: string; count: number; level: number; tooltip: string }[] = [];
  forgettingCurvePoints: { label: string; retention: number }[] = [];
  skillDistribution: { label: string; percentage: number; minutes: number }[] = [];
  totalHours = 0;
  totalSessions = 0;
  avgSessionMin = 0;

  ngOnInit(): void {
    this.auth
      .waitForUser()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((user) => {
          if (!user) return;
          this.loadData(user.id);
        }),
      )
      .subscribe();
  }

  totalAttemptsCount = 0;
  aiFreeAttemptsCount = 0;
  aiUsedAttemptsCount = 0;
  autonomyRatioPercent = 0;
  weeklyAutonomy: { label: string; aiFree: number; aiUsed: number }[] = [];

  private loadData(userId: string): void {
    this.loading.set(true);
    forkJoin({
      sessions: this.api.getSessions().pipe(catchError(() => of([] as StudySession[]))),
      history: this.api.getHistory().pipe(catchError(() => of([] as ChallengeAttempt[]))),
      flashcards: this.api.getFlashcards().pipe(catchError(() => of([] as Flashcard[]))),
      allAttempts: this.api.getChallengeAttempts().pipe(catchError(() => of([] as ChallengeAttempt[]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((r) => {
        const sessions = Array.isArray(r.sessions) ? r.sessions : [];
        const history = Array.isArray(r.history) ? r.history : [];
        const flashcards = Array.isArray(r.flashcards) ? r.flashcards : [];
        const allAttempts = Array.isArray(r.allAttempts) ? r.allAttempts : [];
        this.computeWeekly(sessions, history);
        this.computeMonthly(sessions, history);
        this.computeHeatmap(sessions, history);
        this.computeForgettingCurve(flashcards);
        this.computeSkillDistribution(sessions);
        this.computeAutonomy(allAttempts);
        this.totalSessions = sessions.length;
        this.totalHours =
          Math.round((sessions.reduce((a, s) => a + s.durationMinutes, 0) / 60) * 10) / 10;
        this.avgSessionMin =
          sessions.length > 0
             ? Math.round(sessions.reduce((a, s) => a + s.durationMinutes, 0) / sessions.length)
             : 0;
        this.loading.set(false);
      });
  }

  private computeAutonomy(attempts: ChallengeAttempt[]): void {
    const all = Array.isArray(attempts) ? attempts : [];
    this.totalAttemptsCount = all.length;
    this.aiFreeAttemptsCount = all.filter(a => !a.usedAi).length;
    this.aiUsedAttemptsCount = all.filter(a => a.usedAi).length;
    this.autonomyRatioPercent = this.totalAttemptsCount > 0 
      ? Math.round((this.aiFreeAttemptsCount * 100) / this.totalAttemptsCount) 
      : 0;

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const now = new Date();
    const weekMap = new Map<string, { aiFree: number; aiUsed: number }>();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      weekMap.set(key, { aiFree: 0, aiUsed: 0 });
    }

    for (const a of all) {
      if (!a.createdAt) continue;
      const key = a.createdAt.substring(0, 10);
      if (weekMap.has(key)) {
        if (a.usedAi) {
          weekMap.get(key)!.aiUsed++;
        } else {
          weekMap.get(key)!.aiFree++;
        }
      }
    }

    this.weeklyAutonomy = [];
    for (const [dateStr, val] of weekMap) {
      const d = new Date(dateStr + 'T00:00:00');
      const label = dayNames[d.getDay()];
      this.weeklyAutonomy.push({ label, aiFree: val.aiFree, aiUsed: val.aiUsed });
    }
  }

  private computeHeatmap(sessions: StudySession[], history: ChallengeAttempt[]): void {
    const activityMap = new Map<string, number>();

    // Count sessions
    for (const s of sessions) {
      const key = s.date; // YYYY-MM-DD
      activityMap.set(key, (activityMap.get(key) || 0) + 1);
    }

    // Count challenges (attempts)
    for (const h of history) {
      const key = h.createdAt.substring(0, 10); // YYYY-MM-DD
      activityMap.set(key, (activityMap.get(key) || 0) + 1);
    }

    // Generate dates starting from Sunday 52 weeks ago
    const today = new Date();
    const daysToShow = 365;
    const heatmapList = [];

    // Find the Sunday of the week 52 weeks ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToShow);
    const startDayOfWeek = startDate.getDay();
    // Adjust startDate to the nearest Sunday
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    const endDate = new Date(today);
    // Adjust endDate to the nearest Saturday to complete the last week
    const endDayOfWeek = endDate.getDay();
    endDate.setDate(endDate.getDate() + (6 - endDayOfWeek));

    const temp = new Date(startDate);
    while (temp <= endDate) {
      const key = temp.toISOString().split('T')[0];
      const count = activityMap.get(key) || 0;
      
      let level = 0;
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count >= 3 && count < 5) level = 3;
      else if (count >= 5) level = 4;

      const formattedDate = temp.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const tooltip = `${formattedDate}: ${count} ${count === 1 ? 'atividade' : 'atividades'}`;

      heatmapList.push({
        date: key,
        count,
        level,
        tooltip
      });

      temp.setDate(temp.getDate() + 1);
    }

    this.heatmapDays = heatmapList;
  }

  private computeWeekly(sessions: StudySession[], history: ChallengeAttempt[]): void {
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const now = new Date();
    const weekMap = new Map<string, { hours: number; challenges: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      weekMap.set(key, { hours: 0, challenges: 0 });
    }
    for (const s of sessions) {
      if (weekMap.has(s.date)) {
        weekMap.get(s.date)!.hours += s.durationMinutes / 60;
      }
    }
    for (const h of history) {
      const key = new Date(h.createdAt).toISOString().split('T')[0];
      if (weekMap.has(key)) {
        weekMap.get(key)!.challenges++;
      }
    }
    this.weeklyHours = [];
    this.weeklyChallenges = [];
    for (const [dateStr, val] of weekMap) {
      const d = new Date(dateStr + 'T00:00:00');
      const label = dayNames[d.getDay()];
      this.weeklyHours.push({ label, hours: Math.round(val.hours * 10) / 10 });
      this.weeklyChallenges.push({ label, count: val.challenges });
    }
  }

  private computeMonthly(sessions: StudySession[], history: ChallengeAttempt[]): void {
    const monthNames = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];
    const now = new Date();
    const monthMap = new Map<string, { hours: number; challenges: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, { hours: 0, challenges: 0 });
    }
    for (const s of sessions) {
      const key = s.date.substring(0, 7);
      if (monthMap.has(key)) {
        monthMap.get(key)!.hours += s.durationMinutes / 60;
      }
    }
    for (const h of history) {
      const key = h.createdAt.substring(0, 7);
      if (monthMap.has(key)) {
        monthMap.get(key)!.challenges++;
      }
    }
    this.monthlyHours = [];
    for (const [key, val] of monthMap) {
      const [, m] = key.split('-');
      const label = monthNames[parseInt(m) - 1];
      this.monthlyHours.push({ label, hours: Math.round(val.hours * 10) / 10 });
    }
  }

  private computeForgettingCurve(cards: Flashcard[]): void {
    this.forgettingCurvePoints = [];
    if (!cards || cards.length === 0) {
      // Mock curve for empty state
      for (let day = 0; day <= 30; day += 3) {
        const retention = Math.round(100 * Math.exp(-day / 10));
        this.forgettingCurvePoints.push({ label: `D+${day}`, retention });
      }
      return;
    }

    for (let day = 0; day <= 30; day += 3) {
      let totalRetention = 0;
      for (const card of cards) {
        const s = card.intervalDays > 0 ? card.intervalDays : 1;
        const retention = Math.exp(-day / s);
        totalRetention += retention;
      }
      const avgRetentionPercent = Math.round((totalRetention / cards.length) * 100);
      this.forgettingCurvePoints.push({ label: `D+${day}`, retention: avgRetentionPercent });
    }
  }

  private computeSkillDistribution(sessions: any[]): void {
    this.skillDistribution = [];
    if (!sessions || sessions.length === 0) {
      this.skillDistribution = [
        { label: 'Geral', percentage: 100, minutes: 0 }
      ];
      return;
    }

    const skillMap = new Map<string, number>();
    let totalMin = 0;
    for (const s of sessions) {
      const name = s.subjectName || 'Geral';
      skillMap.set(name, (skillMap.get(name) || 0) + s.durationMinutes);
      totalMin += s.durationMinutes;
    }

    if (totalMin === 0) {
      this.skillDistribution = [
        { label: 'Geral', percentage: 100, minutes: 0 }
      ];
      return;
    }

    const sorted = [...skillMap.entries()].sort((a, b) => b[1] - a[1]);
    for (const [name, mins] of sorted) {
      const pct = Math.round((mins / totalMin) * 100);
      this.skillDistribution.push({ label: name, percentage: pct, minutes: mins });
    }
  }

  get maxWeeklyHours(): number {
    return Math.max(...this.weeklyHours.map((w) => w.hours), 1);
  }

  get maxMonthlyHours(): number {
    return Math.max(...this.monthlyHours.map((m) => m.hours), 1);
  }

  get maxWeeklyChallenges(): number {
    return Math.max(...this.weeklyChallenges.map((w) => w.count), 1);
  }

  switchView(v: 'weekly' | 'monthly'): void {
    this.view = v;
  }

  exportPDF(): void {
    window.print();
  }
}
