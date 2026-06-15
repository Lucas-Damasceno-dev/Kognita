import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { StudyGoal } from '../models/study-goal';

@Component({
  selector: 'app-goals',
  imports: [FormsModule],
  templateUrl: './goals.html',
  styleUrl: './goals.css',
})
export class Goals implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  goals: StudyGoal[] = [];
  title = '';
  description = '';
  targetHours: number = 100;
  deadline = '';
  showForm = false;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.api.getGoals(this.auth.user()!.id).subscribe(g => this.goals = g);
  }

  create(): void {
    if (!this.title.trim() || !this.targetHours) return;
    this.api.createGoal({
      title: this.title,
      description: this.description || undefined,
      targetHours: this.targetHours,
      deadline: this.deadline || undefined,
    }, this.auth.user()!.id).subscribe(() => {
      this.title = '';
      this.description = '';
      this.targetHours = 100;
      this.deadline = '';
      this.showForm = false;
      this.load();
    });
  }

  addHour(id: string): void {
    this.api.updateGoalProgress(id, 1).subscribe(() => this.load());
  }

  remove(id: string): void {
    this.api.deleteGoal(id).subscribe(() => {
      this.goals = this.goals.filter(g => g.id !== id);
    });
  }

  progressPercent(g: StudyGoal): number {
    return g.targetHours > 0 ? Math.min(100, Math.round((g.currentHours / g.targetHours) * 100)) : 0;
  }
}
