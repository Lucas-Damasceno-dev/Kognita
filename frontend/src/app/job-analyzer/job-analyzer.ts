import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Loading } from '../loading/loading';
import { JobAnalysis } from '../models/job-analysis';

@Component({
  selector: 'app-job-analyzer',
  imports: [FormsModule, Loading],
  templateUrl: './job-analyzer.html',
  styleUrl: './job-analyzer.css',
})
export class JobAnalyzer {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  jobDescription = '';
  analysis: JobAnalysis | null = null;
  loading = signal(false);

  analyze(): void {
    if (!this.jobDescription.trim()) return;

    this.loading.set(true);
    this.api.analyzeJob({ jobDescription: this.jobDescription }).subscribe({
      next: (res) => {
        this.analysis = res;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.show('Erro ao analisar vaga', 'error');
      },
    });
  }
}
