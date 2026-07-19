import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';

import { StudySession } from '../models/study-session';
import { ChallengeAttempt } from '../models/challenge-attempt';

export interface HeatmapDay {
  dateStr: string;
  formattedDate: string;
  dayOfWeek: number;
  monthName: string;
  sessionsCount: number;
  attemptsCount: number;
  attemptsWithoutAiCount: number;
  totalActivities: number;
  totalWithoutAi: number;
  studyMinutes: number;
  level: number;
  isFuture: boolean;
  isToday: boolean;
}

export interface MonthHeader {
  name: string;
  colIndex: number;
  colSpan: number;
}

function extractDateStr(item: { date?: string; createdAt?: string }): string | null {
  if (item.date) {
    if (item.date.includes('T')) {
      return item.date.split('T')[0];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
      return item.date;
    }
  }
  if (item.createdAt) {
    if (item.createdAt.includes('T')) {
      return item.createdAt.split('T')[0];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(item.createdAt)) {
      return item.createdAt;
    }
  }
  return null;
}

@Component({
  standalone: true,
  selector: 'app-contribution-heatmap',
  templateUrl: './contribution-heatmap.html',
  styleUrl: './contribution-heatmap.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContributionHeatmap {
  sessions = input<StudySession[]>([]);
  attempts = input<ChallengeAttempt[]>([]);

  colorTheme = signal<'emerald' | 'cyan' | 'purple'>('emerald');
  hoveredDay = signal<HeatmapDay | null>(null);
  tooltipPos = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  todayStr = computed(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  weeks = computed(() => {
    const sessionsList = this.sessions();
    const attemptsList = this.attempts();

    const sessionMap = new Map<string, { count: number; minutes: number }>();
    for (const s of sessionsList) {
      const dStr = extractDateStr(s);
      if (!dStr) continue;
      const existing = sessionMap.get(dStr) || { count: 0, minutes: 0 };
      existing.count += 1;
      existing.minutes += s.durationMinutes || 0;
      sessionMap.set(dStr, existing);
    }

    const attemptMap = new Map<string, { count: number; withoutAiCount: number }>();
    for (const a of attemptsList) {
      const dStr = extractDateStr(a);
      if (!dStr) continue;
      const existing = attemptMap.get(dStr) || { count: 0, withoutAiCount: 0 };
      existing.count += 1;
      if (!a.usedAi) {
        existing.withoutAiCount += 1;
      }
      attemptMap.set(dStr, existing);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const currentSaturday = new Date(today);
    const dayOfWeek = currentSaturday.getDay();
    currentSaturday.setDate(currentSaturday.getDate() + (6 - dayOfWeek));

    const startDate = new Date(currentSaturday);
    startDate.setDate(currentSaturday.getDate() - (52 * 7 - 1));
    startDate.setHours(0, 0, 0, 0);

    const months = [
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
    const fullMonths = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    const daysOfWeek = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];

    const weeksArr: HeatmapDay[][] = [];
    const curr = new Date(startDate);

    for (let w = 0; w < 52; w++) {
      const weekDays: HeatmapDay[] = [];
      for (let d = 0; d < 7; d++) {
        const year = curr.getFullYear();
        const month = String(curr.getMonth() + 1).padStart(2, '0');
        const dayNum = String(curr.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayNum}`;

        const currTime = curr.getTime();
        const isFuture = currTime > todayTime;
        const isToday = dateStr === this.todayStr();

        const sesData = sessionMap.get(dateStr) || { count: 0, minutes: 0 };
        const attData = attemptMap.get(dateStr) || { count: 0, withoutAiCount: 0 };

        const sessionsCount = sesData.count;
        const attemptsCount = attData.count;
        const attemptsWithoutAiCount = attData.withoutAiCount;

        const totalActivities = sessionsCount + attemptsCount;
        const totalWithoutAi = sessionsCount + attemptsWithoutAiCount;
        const studyMinutes = sesData.minutes;

        let level = 0;
        if (!isFuture && totalActivities > 0) {
          if (totalActivities === 1) level = 1;
          else if (totalActivities <= 3) level = 2;
          else if (totalActivities <= 5) level = 3;
          else level = 4;
        }

        const formattedDate = `${daysOfWeek[curr.getDay()]}, ${curr.getDate()} de ${fullMonths[curr.getMonth()]} de ${year}`;

        weekDays.push({
          dateStr,
          formattedDate,
          dayOfWeek: curr.getDay(),
          monthName: months[curr.getMonth()],
          sessionsCount,
          attemptsCount,
          attemptsWithoutAiCount,
          totalActivities,
          totalWithoutAi,
          studyMinutes,
          level,
          isFuture,
          isToday,
        });

        curr.setDate(curr.getDate() + 1);
      }
      weeksArr.push(weekDays);
    }

    return weeksArr;
  });

  monthHeaders = computed<MonthHeader[]>(() => {
    const weeksArr = this.weeks();
    if (weeksArr.length === 0) return [];

    const headers: MonthHeader[] = [];
    let currentMonth = '';
    let currentStart = 0;

    for (let w = 0; w < weeksArr.length; w++) {
      const month = weeksArr[w][3].monthName;
      if (month !== currentMonth) {
        if (currentMonth !== '') {
          const lastHeader = headers[headers.length - 1];
          if (lastHeader) {
            lastHeader.colSpan = w - currentStart;
          }
        }
        headers.push({ name: month, colIndex: w, colSpan: 1 });
        currentMonth = month;
        currentStart = w;
      }
    }

    if (headers.length > 0) {
      const lastHeader = headers[headers.length - 1];
      lastHeader.colSpan = weeksArr.length - currentStart;
    }

    return headers;
  });

  totalActiveDays = computed(() => {
    let count = 0;
    for (const week of this.weeks()) {
      for (const day of week) {
        if (!day.isFuture && day.totalActivities > 0) {
          count++;
        }
      }
    }
    return count;
  });

  totalChallenges = computed(() => {
    let count = 0;
    for (const week of this.weeks()) {
      for (const day of week) {
        if (!day.isFuture) {
          count += day.attemptsCount;
        }
      }
    }
    return count;
  });

  longestStreak = computed(() => {
    let maxStreak = 0;
    let currentRun = 0;

    const allDays: HeatmapDay[] = [];
    for (const week of this.weeks()) {
      for (const day of week) {
        if (!day.isFuture) {
          allDays.push(day);
        }
      }
    }

    for (const day of allDays) {
      if (day.totalActivities > 0) {
        currentRun++;
        if (currentRun > maxStreak) {
          maxStreak = currentRun;
        }
      } else {
        currentRun = 0;
      }
    }

    return maxStreak;
  });

  currentStreak = computed(() => {
    const allDays: HeatmapDay[] = [];
    for (const week of this.weeks()) {
      for (const day of week) {
        if (!day.isFuture) {
          allDays.push(day);
        }
      }
    }

    if (allDays.length === 0) return 0;

    let streak = 0;
    const lastIndex = allDays.length - 1;

    const todayDay = allDays[lastIndex];
    let startIndex = lastIndex;

    if (todayDay && todayDay.isToday && todayDay.totalActivities === 0) {
      startIndex = lastIndex - 1;
    }

    for (let i = startIndex; i >= 0; i--) {
      if (allDays[i].totalActivities > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  });

  onDayHover(day: HeatmapDay, event: MouseEvent): void {
    if (day.isFuture) return;
    this.hoveredDay.set(day);
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = Math.min(Math.max(rect.left + rect.width / 2 - 100, 10), window.innerWidth - 220);
    const y = rect.top - 105;
    this.tooltipPos.set({ x, y: y < 10 ? rect.bottom + 10 : y });
  }

  onDayLeave(): void {
    this.hoveredDay.set(null);
  }
}
