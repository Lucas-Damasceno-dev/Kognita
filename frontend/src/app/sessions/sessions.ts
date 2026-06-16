import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, forkJoin, of, timeout, tap, EMPTY } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Loading } from '../loading/loading';
import { StudySession } from '../models/study-session';
import { Subject } from '../models/subject';

@Component({
  selector: 'app-sessions',
  imports: [FormsModule, Loading],
  templateUrl: './sessions.html',
  styleUrl: './sessions.css',
})
export class Sessions implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  sessions: StudySession[] = [];
  subjects: Subject[] = [];
  subjectId = '';
  durationMinutes = 0;
  notes = '';
  date = new Date().toISOString().split('T')[0];
  showForm = false;
  loading = signal(false);
  saving = false;

  ngOnInit(): void {
    this.auth.waitForUser().pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(20_000),
      catchError(() => {
        this.loading.set(false);
        return EMPTY;
      }),
      tap(user => {
        if (!user) {
          this.loading.set(false);
          return;
        }
        this.load();
      }),
    ).subscribe();
  }

  private load(): void {
    const user = this.auth.user();
    if (!user) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    forkJoin({
      sessions: this.api.getSessions(user.id).pipe(
        timeout(15_000),
        catchError(() => of([] as StudySession[])),
      ),
      subjects: this.api.getSubjects(user.id).pipe(
        timeout(15_000),
        catchError(() => of([] as Subject[])),
      ),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (r) => {
        this.sessions = Array.isArray(r.sessions) ? r.sessions : [];
        this.subjects = Array.isArray(r.subjects) ? r.subjects : [];
      },
      error: () => { 
        this.toast.error('Failed to load data'); 
      },
    });
  }

  create(): void {
    if (!this.subjectId || !this.durationMinutes) return;
    this.saving = true;
    this.api.createSession({
      subjectId: this.subjectId,
      durationMinutes: this.durationMinutes,
      notes: this.notes || undefined,
    }, this.auth.user()!.id).subscribe({
      next: () => {
        this.toast.success('Session created');
        this.subjectId = '';
        this.durationMinutes = 60;
        this.notes = '';
        this.showForm = false;
        this.saving = false;
        this.load();
      },
      error: () => {
        this.toast.error('Failed to create session');
        this.saving = false;
      },
    });
  }

  remove(id: string): void {
    this.api.deleteSession(id).subscribe({
      next: () => {
        this.toast.success('Session deleted');
        this.sessions = this.sessions.filter(s => s.id !== id);
      },
      error: () => this.toast.error('Failed to delete session'),
    });
  }
}
