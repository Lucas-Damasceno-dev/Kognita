import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, catchError } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Skeleton } from '../skeleton/skeleton';

@Component({
  selector: 'app-calendar',
  imports: [CommonModule, RouterModule, Skeleton],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class CalendarView implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  currentDate = new Date();
  daysInMonth: { dayNumber: number; dateStr: string; isCurrentMonth: boolean; tasks: any[]; sessions: any[] }[] = [];
  tasks: any[] = [];
  sessions: any[] = [];
  loading = signal(true);

  weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  ngOnInit(): void {
    this.auth.waitForUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        if (user) {
          this.loadData();
        }
      });
  }

  private loadData(): void {
    this.loading.set(true);
    const userId = this.auth.user()!.id;

    forkJoin({
      tasks: this.api.getTasks(userId, undefined, undefined, undefined).pipe(catchError(() => of([]))),
      sessions: this.api.getSessions().pipe(catchError(() => of([])))
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => {
        this.tasks = Array.isArray(r.tasks) ? r.tasks : [];
        this.sessions = Array.isArray(r.sessions) ? r.sessions : [];
        this.generateCalendar();
        this.loading.set(false);
      });
  }

  generateCalendar(): void {
    this.daysInMonth = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevTotalDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      this.daysInMonth.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        tasks: this.filterTasks(dateStr),
        sessions: this.filterSessions(dateStr)
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      this.daysInMonth.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        tasks: this.filterTasks(dateStr),
        sessions: this.filterSessions(dateStr)
      });
    }

    // Next month padding to fill exactly 42 grid blocks
    const remainingCells = 42 - this.daysInMonth.length;
    for (let d = 1; d <= remainingCells; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      this.daysInMonth.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        tasks: this.filterTasks(dateStr),
        sessions: this.filterSessions(dateStr)
      });
    }
  }

  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  getMonthName(): string {
    return `${this.monthNames[this.currentDate.getMonth()]} de ${this.currentDate.getFullYear()}`;
  }

  private filterTasks(dateStr: string): any[] {
    return this.tasks.filter(t => {
      if (t.dueDate === dateStr) return true;
      if (t.createdAt && t.createdAt.startsWith(dateStr)) return true;
      if (t.updatedAt && t.status === 'completed' && t.updatedAt.startsWith(dateStr)) return true;
      return false;
    });
  }

  private filterSessions(dateStr: string): any[] {
    return this.sessions.filter(s => s.date === dateStr);
  }
}
