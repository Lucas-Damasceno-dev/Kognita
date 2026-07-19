import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  action?: { label: string; fn: () => void };
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 0;

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', action?: { label: string; fn: () => void }): void {
    const toast: Toast = { id: this.nextId++, message, type, action };
    this.toasts.update((t) => {
      const next = [...t, toast];
      if (next.length > 4) next.shift();
      return next;
    });
    const duration = action ? 5000 : 3000;
    setTimeout(() => this.toasts.update((t) => t.filter((x) => x.id !== toast.id)), duration);
  }

  success(msg: string) {
    this.show(msg, 'success');
  }
  error(msg: string) {
    this.show(msg, 'error');
  }
  info(msg: string) {
    this.show(msg, 'info');
  }
  warning(msg: string) {
    this.show(msg, 'warning');
  }
}
