import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 0;

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success'): void {
    const toast: Toast = { id: this.nextId++, message, type };
    this.toasts.update((t) => [...t, toast]);
    setTimeout(() => this.toasts.update((t) => t.filter((x) => x.id !== toast.id)), 3000);
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
