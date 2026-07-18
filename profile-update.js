const fs = require('fs');

let code = fs.readFileSync('frontend/src/app/profile/profile.ts', 'utf8');

// Add Confirm import
code = code.replace(
  "import { ToastService } from '../services/toast.service';",
  "import { ToastService } from '../services/toast.service';\nimport { Confirm } from '../confirm/confirm';"
);

// Add Confirm to imports array
code = code.replace(
  "imports: [FormsModule],",
  "imports: [FormsModule, Confirm],"
);

// Add signals and methods
const methods = `
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
`;

code = code.replace("exportData(): void {", methods);

fs.writeFileSync('frontend/src/app/profile/profile.ts', code);
