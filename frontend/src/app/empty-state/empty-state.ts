import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-empty-state',
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  icon = input<'default' | 'tasks' | 'history' | 'analytics' | 'goals'>('default');
  title = input<string>('');
  description = input<string>('');
}
