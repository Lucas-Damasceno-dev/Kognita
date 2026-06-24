import { Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div class="toast-container">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class.error]="t.type === 'error'" [class.info]="t.type === 'info'" [class.warning]="t.type === 'warning'">{{ t.message }}</div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; top: 1rem; right: 1rem; z-index: 9999;
      display: flex; flex-direction: column; gap: 0.5rem;
    }
    .toast {
      background: #15803d; color: white; padding: 0.75rem 1.25rem;
      border-radius: 10px; font-size: 0.9rem; font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.2s ease;
    }
    .toast.error { background: #b91c1c; }
    .toast.info { background: #0369a1; }
    .toast.warning { background: #b45309; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  `]
})
export class Toast {
  toast = inject(ToastService);
}
