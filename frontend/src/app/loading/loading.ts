import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  template: '<div class="spinner"><div class="spin"></div><span>{{ text() }}</span></div>',
  styles: [`
    .spinner { display: flex; align-items: center; gap: .75rem; padding: 2rem 0; color: #6b7280; font-size: .9rem; }
    .spin { width: 1.25rem; height: 1.25rem; border: 2px solid #e5e7eb; border-top-color: #6366f1; border-radius: 50%; animation: spin .6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class Loading {
  text = input('Loading...');
}
