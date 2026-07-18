import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Skeleton } from '../skeleton/skeleton';
import { User } from '../models/user';

@Component({
  selector: 'app-leaderboard',
  imports: [CommonModule, Skeleton],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css'
})
export class Leaderboard implements OnInit {
  private api = inject(ApiService);
  protected auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  users = signal<User[]>([]);
  loading = signal(true);
  currentFilter = signal<'xp' | 'streak'>('xp');

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getLeaderboard()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of([] as User[])),
        finalize(() => this.loading.set(false))
      )
      .subscribe(res => {
        this.users.set(res);
      });
  }

  setFilter(filter: 'xp' | 'streak'): void {
    this.currentFilter.set(filter);
  }

  getSortedUsers(): User[] {
    const list = [...this.users()];
    if (this.currentFilter() === 'xp') {
      return list.sort((a, b) => b.totalExperience - a.totalExperience);
    } else {
      return list.sort((a, b) => (b.streakCount || 0) - (a.streakCount || 0));
    }
  }

  getTopThree(): User[] {
    return this.getSortedUsers().slice(0, 3);
  }

  getRemainingUsers(): User[] {
    return this.getSortedUsers().slice(3);
  }

  getUserLevel(xp: number): number {
    return Math.floor(xp / 100) + 1;
  }
}
