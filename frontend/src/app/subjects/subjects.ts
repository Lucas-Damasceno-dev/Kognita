import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of, timeout, tap, EMPTY } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Loading } from '../loading/loading';
import { Subject } from '../models/subject';

@Component({
  selector: 'app-subjects',
  imports: [FormsModule, Loading],
  templateUrl: './subjects.html',
  styleUrl: './subjects.css',
})
export class Subjects implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  subjects: Subject[] = [];
  name = '';
  description = '';
  color = '#3B82F6';
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
    this.api.getSubjects(user.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(15_000),
      catchError(() => { this.toast.error('Failed to load subjects'); return of([]); }),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: s => { 
        this.subjects = Array.isArray(s) ? s : []; 
      },
    });
  }

  create(): void {
    if (!this.name.trim()) return;
    this.saving = true;
    this.api.createSubject({ name: this.name, description: this.description, color: this.color }, this.auth.user()!.id)
      .subscribe({
        next: () => {
          this.toast.success('Subject created');
          this.name = '';
          this.description = '';
          this.color = '#3B82F6';
          this.showForm = false;
          this.saving = false;
          this.load();
        },
        error: () => {
          this.toast.error('Failed to create subject');
          this.saving = false;
        },
      });
  }

  remove(id: string): void {
    this.api.deleteSubject(id).subscribe({
      next: () => {
        this.toast.success('Subject deleted');
        this.load();
      },
      error: () => this.toast.error('Failed to delete subject'),
    });
  }
}
