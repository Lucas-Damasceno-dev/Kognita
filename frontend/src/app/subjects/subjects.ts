import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Subject } from '../models/subject';

@Component({
  selector: 'app-subjects',
  imports: [FormsModule],
  templateUrl: './subjects.html',
  styleUrl: './subjects.css',
})
export class Subjects implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  subjects: Subject[] = [];
  name = '';
  description = '';
  color = '#3B82F6';
  showForm = false;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.api.getSubjects(this.auth.user()!.id).subscribe(s => this.subjects = s);
  }

  create(): void {
    if (!this.name.trim()) return;
    this.api.createSubject({ name: this.name, description: this.description, color: this.color }, this.auth.user()!.id)
      .subscribe(() => {
        this.name = '';
        this.description = '';
        this.color = '#3B82F6';
        this.showForm = false;
        this.load();
      });
  }

  remove(id: string): void {
    this.api.deleteSubject(id).subscribe(() => this.load());
  }
}
