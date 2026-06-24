import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ChallengeAttempt } from '../models/challenge-attempt';
import { Skeleton } from '../skeleton/skeleton';
import { EmptyState } from '../empty-state/empty-state';

@Component({
  selector: 'app-history',
  imports: [Skeleton, FormsModule, EmptyState],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class History implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  attempts = signal<ChallengeAttempt[]>([]);
  loading = signal(true);
  editingId = signal<string | null>(null);
  editingNotes = signal('');
  saving = signal(false);
  showMentorship = signal(false);
  pendingMentorshipAttempt: ChallengeAttempt | null = null;
  mentorshipReflection = signal('');
  savingMentorship = signal(false);

  ngOnInit() {
    const user = this.auth.user();
    if (user) {
      this.api.getHistory(user.id).subscribe({
        next: (res) => {
          this.attempts.set(res);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
    }
  }

  edit(attempt: ChallengeAttempt) {
    this.editingId.set(attempt.id);
    this.editingNotes.set(attempt.notes || '');
  }

  openMentorship(attempt: ChallengeAttempt) {
    this.pendingMentorshipAttempt = attempt;
    this.mentorshipReflection.set('');
    this.showMentorship.set(true);
  }

  save(attempt: ChallengeAttempt) {
    this.saving.set(true);
    const req = {
      taskId: attempt.taskId,
      usedAi: attempt.usedAi,
      notes: this.editingNotes(),
      howISolved: attempt.howISolved,
      date: attempt.date,
    };
    this.api.updateChallengeAttempt(attempt.id, req).subscribe({
      next: (updated) => {
        this.attempts.update((list) => list.map((a) => (a.id === updated.id ? updated : a)));
        this.editingId.set(null);
        this.saving.set(false);
      },
      error: () => {
        this.editingId.set(null);
        this.saving.set(false);
      },
    });
  }

  saveMentorship(): void {
    const attempt = this.pendingMentorshipAttempt;
    if (!attempt) return;
    const reflection = this.mentorshipReflection().trim();
    if (!reflection) {
      this.showMentorship.set(false);
      return;
    }
    this.savingMentorship.set(true);
    const existingNotes = attempt.notes || '';
    const combinedNotes = existingNotes
      ? `${existingNotes}\n\n[Reflexão de Mentoria]\n${reflection}`
      : `[Reflexão de Mentoria]\n${reflection}`;
    this.api
      .updateChallengeAttempt(attempt.id, {
        taskId: attempt.taskId,
        usedAi: attempt.usedAi,
        notes: combinedNotes,
        howISolved: attempt.howISolved,
        date: attempt.date,
      })
      .subscribe({
        next: (updated) => {
          this.attempts.update((list) => list.map((a) => (a.id === updated.id ? updated : a)));
          this.showMentorship.set(false);
          this.pendingMentorshipAttempt = null;
          this.mentorshipReflection.set('');
          this.savingMentorship.set(false);
        },
        error: () => {
          this.showMentorship.set(false);
          this.pendingMentorshipAttempt = null;
          this.savingMentorship.set(false);
        },
      });
  }

  closeMentorship(): void {
    this.showMentorship.set(false);
    this.pendingMentorshipAttempt = null;
    this.mentorshipReflection.set('');
  }
}
