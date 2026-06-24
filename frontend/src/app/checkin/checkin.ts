import { Component, input, output, signal, inject, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { ConfigService } from '../services/config.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ChallengeStats } from '../models/challenge-attempt';
import { ChallengeGoal } from '../models/challenge-goal';

@Component({
  selector: 'app-checkin',
  imports: [FormsModule],
  templateUrl: './checkin.html',
  styleUrl: './checkin.css',
})
export class Checkin implements OnInit {
  protected config = inject(ConfigService);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  readonly taskName = input.required<string>();
  readonly confirm = output<boolean>();
  readonly cancel = output<void>();

  stats = signal<ChallengeStats | null>(null);
  goals = signal<ChallengeGoal[]>([]);

  notes = '';
  saving = signal(false);

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user) return;
    this.api.getChallengeStats().pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => of(null)),
    ).subscribe(s => this.stats.set(s));
    this.api.getChallengeGoals().pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => of([])),
    ).subscribe(g => this.goals.set(Array.isArray(g) ? g : []));
  }

  onYes(): void {
    this.confirm.emit(true);
  }

  onNo(): void {
    this.confirm.emit(false);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
