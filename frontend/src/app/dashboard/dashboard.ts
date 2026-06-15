import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { Subject } from '../models/subject';
import { Task } from '../models/task';
import { StudyGoal } from '../models/study-goal';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private auth = inject(AuthService);
  private api = inject(ApiService);

  subjects: Subject[] = [];
  pendingTasks: Task[] = [];
  goals: StudyGoal[] = [];

  ngOnInit(): void {
    const userId = this.auth.user()!.id;
    this.api.getSubjects(userId).subscribe(s => this.subjects = s);
    this.api.getTasks(userId).subscribe(t => this.pendingTasks = t.filter(x => x.status !== 'completed'));
    this.api.getGoals(userId).subscribe(g => this.goals = g);
  }
}
