import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.html',
  styleUrl: './confirm.css',
})
export class Confirm {
  title = input<string>('');
  message = input.required<string>();
  confirmText = input('Excluir');
  cancelText = input('Cancelar');
  confirmStyle = input<'danger' | 'primary'>('danger');
  saving = input(false);
  processingText = input('Processando...');
  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
