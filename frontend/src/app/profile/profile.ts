import { Component, inject, signal, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Confirm } from '../confirm/confirm';
import { Achievement } from '../models/achievement';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, Confirm],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private api = inject(ApiService);
  protected auth = inject(AuthService);
  private toast = inject(ToastService);

  achievements = signal<Achievement[]>([]);

  ngOnInit(): void {
    this.loadAchievements();
  }

  loadAchievements(): void {
    this.api.getAchievements().subscribe({
      next: (res) => this.achievements.set(res),
      error: () => this.toast.error('Erro ao carregar conquistas')
    });
  }

  private savedName = this.auth.user()?.name || '';
  private savedEmail = this.auth.user()?.email || '';
  private savedAvatarUrl = this.auth.user()?.avatarUrl || '';
  private savedGithubRepo = this.auth.user()?.githubRepo || '';
  private savedTitle = this.auth.user()?.title || 'Recruta do Código';
  private savedAvatarBorder = this.auth.user()?.avatarBorder || 'border-none';

  name = this.savedName;
  email = this.savedEmail;
  avatarUrl = this.savedAvatarUrl;
  githubRepo = this.savedGithubRepo;
  selectedTitle = this.savedTitle;
  selectedBorder = this.savedAvatarBorder;

  avatarError = signal(false);
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  saving = signal(false);

  availableTitles = [
    { level: 1, name: 'Recruta do Código' },
    { level: 3, name: 'Debugador Júnior' },
    { level: 5, name: 'Guerreiro de Código' },
    { level: 7, name: 'Mestre das Migrations' },
    { level: 10, name: 'Soberano dos Commits' }
  ];

  availableBorders = [
    { level: 1, id: 'border-none', name: 'Sem Moldura' },
    { level: 3, id: 'border-blue', name: 'Moderno Azul' },
    { level: 5, id: 'border-purple', name: 'Roxo Neon' },
    { level: 7, id: 'border-gold', name: 'Dourado Premium' },
    { level: 10, id: 'border-rainbow', name: 'Arco-íris Animado' }
  ];

  getUserLevel(): number {
    const xp = this.auth.user()?.totalExperience || 0;
    return 1 + Math.floor(xp / 100);
  }

  hasUnsavedChanges(): boolean {
    if (this.name !== this.savedName) return true;
    if (this.email !== this.savedEmail) return true;
    if (this.avatarUrl !== this.savedAvatarUrl) return true;
    if (this.githubRepo !== this.savedGithubRepo) return true;
    if (this.selectedTitle !== this.savedTitle) return true;
    if (this.selectedBorder !== this.savedAvatarBorder) return true;
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
    if (this.githubRepo !== this.auth.user()?.githubRepo) req.githubRepo = this.githubRepo || null;
    if (this.selectedTitle !== this.auth.user()?.title) req.title = this.selectedTitle;
    if (this.selectedBorder !== this.auth.user()?.avatarBorder) req.avatarBorder = this.selectedBorder;
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
            githubRepo: user.githubRepo,
            title: user.title,
            avatarBorder: user.avatarBorder,
          });
          localStorage.setItem('kognita_user', JSON.stringify(this.auth.user()));
        }
        this.savedName = user.name;
        this.savedEmail = user.email;
        this.savedAvatarUrl = user.avatarUrl || '';
        this.savedGithubRepo = user.githubRepo || '';
        this.savedTitle = user.title || 'Recruta do Código';
        this.savedAvatarBorder = user.avatarBorder || 'border-none';
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

  buyStreakFreeze(): void {
    const user = this.auth.user();
    if (!user) return;
    if (user.totalExperience < 200) {
      this.toast.error('Você precisa de pelo menos 200 XP para comprar um congelador.');
      return;
    }

    this.api.buyStreakFreeze().subscribe({
      next: (updated) => {
        this.toast.success('Congelador de Streak comprado com sucesso!');
        this.auth.user.set({
          ...user,
          totalExperience: updated.totalExperience,
          streakFreezes: updated.streakFreezes
        });
        localStorage.setItem('kognita_user', JSON.stringify(this.auth.user()));
      },
      error: () => {
        this.toast.error('Erro ao comprar congelador.');
      }
    });
  }

  
  showDeleteConfirm = signal(false);

  confirmDeleteAccount(): void {
    this.showDeleteConfirm.set(true);
  }

  deleteAccount(): void {
    const user = this.auth.user();
    if (!user) return;
    
    this.api.deleteUser(user.id).subscribe({
      next: () => {
        this.toast.success('Conta excluída permanentemente.');
        this.auth.logout(); // log user out and redirect
      },
      error: () => {
        this.toast.error('Erro ao excluir conta.');
        this.showDeleteConfirm.set(false);
      }
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
