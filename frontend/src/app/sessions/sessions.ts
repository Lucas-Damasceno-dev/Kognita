import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { StudySession } from '../models/study-session';
import { Subject } from '../models/subject';

@Component({
  selector: 'app-sessions',
  imports: [FormsModule],
  templateUrl: './sessions.html',
  styleUrl: './sessions.css',
})
export class Sessions implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  sessions: StudySession[] = [];
  subjects: Subject[] = [];
  subjectId = '';
  durationMinutes: number = 60;
  notes = '';
  showForm = false;

  ngOnInit(): void {
    const uid = this.auth.user()!.id;
    this.api.getSessions(uid).subscribe(s => this.sessions = s);
    this.api.getSubjects(uid).subscribe(s => this.subjects = s);
  }

  create(): void {
    if (!this.subjectId || !this.durationMinutes) return;
    this.api.createSession({
      subjectId: this.subjectId,
      durationMinutes: this.durationMinutes,
      notes: this.notes || undefined,
    }, this.auth.user()!.id).subscribe(() => {
      this.subjectId = '';
      this.durationMinutes = 60;
      this.notes = '';
      this.showForm = false;
      const uid = this.auth.user()!.id;
      this.api.getSessions(uid).subscribe(s => this.sessions = s);
    });
  }

  remove(id: string): void {
    this.api.deleteSession(id).subscribe(() => {
      this.sessions = this.sessions.filter(s => s.id !== id);
    });
  }
}
