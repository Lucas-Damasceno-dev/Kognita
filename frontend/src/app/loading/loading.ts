import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <div class="spinner"></div>
    <p>{{ text() }}</p>
  `,
  styleUrl: './loading.css',
})
export class Loading {
  text = input('Carregando...');
}
