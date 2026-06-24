import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of, tap } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Skeleton } from '../skeleton/skeleton';
import { StudySession } from '../models/study-session';
import { ChallengeAttempt } from '../models/challenge-attempt';

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
  totalHours = 0;
  totalSessions = 0;
  avgSessionMin = 0;

  ngOnInit(): void {
    this.auth.waitForUser().pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(user => {
        if (!user) return;
        this.loadData(user.id);
      }),
    ).subscribe();
  }

  private loadData(userId: string): void {
    this.loading.set(true);
    forkJoin({
      sessions: this.api.getSessions().pipe(catchError(() => of([] as StudySession[]))),
      history: this.api.getHistory().pipe(catchError(() => of([] as ChallengeAttempt[]))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      const sessions = Array.isArray(r.sessions) ? r.sessions : [];
      const history = Array.isArray(r.history) ? r.history : [];
      this.computeWeekly(sessions, history);
      this.computeMonthly(sessions, history);
      this.totalSessions = sessions.length;
      this.totalHours = Math.round(sessions.reduce((a, s) => a + s.durationMinutes, 0) / 60 * 10) / 10;
      this.avgSessionMin = sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + s.durationMinutes, 0) / sessions.length) : 0;
      this.loading.set(false);
    });
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
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
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

  get maxWeeklyHours(): number {
    return Math.max(...this.weeklyHours.map(w => w.hours), 1);
  }

  get maxMonthlyHours(): number {
    return Math.max(...this.monthlyHours.map(m => m.hours), 1);
  }

  get maxWeeklyChallenges(): number {
    return Math.max(...this.weeklyChallenges.map(w => w.count), 1);
  }

  switchView(v: 'weekly' | 'monthly'): void {
    this.view = v;
  }
}
