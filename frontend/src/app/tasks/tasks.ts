import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Task } from '../models/task';
import { Subject } from '../models/subject';

@Component({
  selector: 'app-tasks',
  imports: [FormsModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  tasks: Task[] = [];
  subjects: Subject[] = [];
  title = '';
  priority: string = 'medium';
  subjectId = '';
  showForm = false;

  ngOnInit(): void {
    const uid = this.auth.user()!.id;
    this.api.getTasks(uid).subscribe(t => this.tasks = t);
    this.api.getSubjects(uid).subscribe(s => this.subjects = s);
  }

  create(): void {
    if (!this.title.trim()) return;
    this.api.createTask({
      title: this.title,
      priority: this.priority,
      subjectId: this.subjectId || undefined,
    }, this.auth.user()!.id).subscribe(() => {
      this.title = '';
      this.priority = 'medium';
      this.subjectId = '';
      this.showForm = false;
      const uid = this.auth.user()!.id;
      this.api.getTasks(uid).subscribe(t => this.tasks = t);
    });
  }

  toggleStatus(task: Task): void {
    const next = task.status === 'completed' ? 'pending' : 'completed';
    this.api.updateTaskStatus(task.id, next).subscribe(() => {
      const uid = this.auth.user()!.id;
      this.api.getTasks(uid).subscribe(t => this.tasks = t);
    });
  }

  remove(id: string): void {
    this.api.deleteTask(id).subscribe(() => {
      this.tasks = this.tasks.filter(t => t.id !== id);
    });
  }
}
