import { Component, inject } from '@angular/core';
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
  loading = false;

  submit(): void {
    if (this.password !== this.confirmPassword) {
      this.toast.error('Passwords do not match');
      return;
    }
    this.loading = true;
    this.auth.register(this.name, this.email, this.password).subscribe({
      next: () => {
        this.toast.success('Account created!');
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.toast.error(err.status === 409 ? 'Email already in use' : 'Registration failed');
        this.loading = false;
      },
    });
  }
}
