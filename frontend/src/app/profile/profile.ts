import { Component, inject, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  private savedName = this.auth.user()?.name || '';
  private savedEmail = this.auth.user()?.email || '';
  private savedAvatarUrl = this.auth.user()?.avatarUrl || '';

  name = this.savedName;
  email = this.savedEmail;
  avatarUrl = this.savedAvatarUrl;
  avatarError = signal(false);
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  saving = signal(false);

  hasUnsavedChanges(): boolean {
    if (this.name !== this.savedName) return true;
    if (this.email !== this.savedEmail) return true;
    if (this.avatarUrl !== this.savedAvatarUrl) return true;
    if (this.currentPassword || this.newPassword || this.confirmPassword) return true;
    return false;
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }

  save(): void {
    if (!this.name.trim() || !this.email.trim()) return;
    if (this.newPassword && this.newPassword !== this.confirmPassword) {
      this.toast.error('Senhas não conferem');
      return;
    }

    this.saving.set(true);
    const req: any = {};
    if (this.name !== this.auth.user()?.name) req.name = this.name;
    if (this.email !== this.auth.user()?.email) req.email = this.email;
    if (this.avatarUrl !== this.auth.user()?.avatarUrl) req.avatarUrl = this.avatarUrl || null;
    if (this.currentPassword && this.newPassword) {
      req.currentPassword = this.currentPassword;
      req.newPassword = this.newPassword;
    }

    if (Object.keys(req).length === 0) {
      this.toast.success('Nenhuma alteração para salvar');
      this.saving.set(false);
      return;
    }

    this.api.updateUser(this.auth.user()!.id, req).subscribe({
      next: (user) => {
        this.toast.success('Perfil atualizado');
        const current = this.auth.user();
        if (current) {
          this.auth.user.set({
            ...current,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
          });
          localStorage.setItem('kognita_user', JSON.stringify(this.auth.user()));
        }
        this.savedName = user.name;
        this.savedEmail = user.email;
        this.savedAvatarUrl = user.avatarUrl || '';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  exportData(): void {
    this.api.exportData().subscribe({
      next: (data: any) => {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kognita-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.toast.success('Data exported successfully');
      },
      error: () => this.toast.error('Failed to export data'),
    });
  }
}
