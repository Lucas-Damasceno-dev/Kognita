import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Loading } from '../loading/loading';

@Component({
  selector: 'app-rubber-duck',
  imports: [FormsModule, CommonModule, Loading],
  templateUrl: './rubber-duck.html',
  styleUrl: './rubber-duck.css'
})
export class RubberDuck {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  step = signal<number>(1); // 1 to 5 steps
  
  title = '';
  expectedBehavior = '';
  actualBehavior = '';
  attempts = '';
  solution = '';

  isSaving = signal<boolean>(false);

  nextStep(): void {
    if (this.step() === 1 && !this.title.trim()) {
      this.toast.error('Por favor, informe o título do seu problema.');
      return;
    }
    if (this.step() === 2 && !this.expectedBehavior.trim()) {
      this.toast.error('Por favor, explique o comportamento esperado.');
      return;
    }
    if (this.step() === 3 && !this.actualBehavior.trim()) {
      this.toast.error('Por favor, descreva o que realmente está acontecendo.');
      return;
    }
    if (this.step() === 4 && !this.attempts.trim()) {
      this.toast.error('Por favor, diga o que você já tentou.');
      return;
    }

    this.step.update(s => s + 1);
  }

  prevStep(): void {
    if (this.step() > 1) {
      this.step.update(s => s - 1);
    }
  }

  saveToDiary(): void {
    if (!this.solution.trim()) {
      this.toast.error('Por favor, digite qual foi a solução encontrada!');
      return;
    }

    this.isSaving.set(true);
    const user = this.auth.user();
    if (!user) {
      this.toast.error('Usuário não autenticado.');
      this.isSaving.set(false);
      return;
    }

    const descriptionText = `### Comportamento Esperado:\n${this.expectedBehavior}\n\n### O que está Acontecendo:\n${this.actualBehavior}\n\n### Tentativas Realizadas:\n${this.attempts}`;

    const req = {
      title: `[Rubber Duck SOS] ${this.title}`,
      description: descriptionText,
      solution: this.solution
    };

    this.api.createErrorLog(req, user.id).subscribe({
      next: () => {
        this.toast.success('Eureka! Solução salva no Diário de Erros.');
        this.reset();
      },
      error: () => {
        this.toast.error('Erro ao salvar no Diário de Erros.');
        this.isSaving.set(false);
      }
    });
  }

  reset(): void {
    this.step.set(1);
    this.title = '';
    this.expectedBehavior = '';
    this.actualBehavior = '';
    this.attempts = '';
    this.solution = '';
    this.isSaving.set(false);
  }
}
