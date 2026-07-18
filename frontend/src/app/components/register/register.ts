import { Component, inject, HostListener, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = signal(false);

  hasUnsavedChanges(): boolean {
    return (
      this.name !== '' || this.email !== '' || this.password !== '' || this.confirmPassword !== ''
    );
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }

  submit(): void {
    if (this.password !== this.confirmPassword) {
      this.toast.error('Senhas não conferem');
      return;
    }
    this.loading.set(true);
    this.auth.register(this.name, this.email, this.password).subscribe({
      next: () => {
        this.toast.success('Conta criada! Faça login para continuar.');
        this.loading.set(false);
        this.name = '';
        this.email = '';
        this.password = '';
        this.confirmPassword = '';
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.toast.error(err.status === 409 ? 'Email já está em uso' : 'Falha ao criar conta');
        this.loading.set(false);
      },
    });
  }
}
