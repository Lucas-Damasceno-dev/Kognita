import { Component, input, effect, ElementRef, inject, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-animated-number',
  standalone: true,
  template: `<span>{{ displayValue }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimatedNumber {
  value = input.required<number>();
  duration = input(600);

  private el = inject(ElementRef).nativeElement as HTMLElement;
  displayValue = 0;
  private previous = 0;
  private rafId = 0;

  constructor() {
    effect(() => {
      const target = this.value();
      if (target === this.previous) return;
      this.animateTo(target);
      this.previous = target;
    });
  }

  private animateTo(target: number): void {
    cancelAnimationFrame(this.rafId);
    const start = this.displayValue;
    const delta = target - start;
    const startTime = performance.now();
    const duration = this.duration();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.displayValue = Math.round(start + delta * eased);
      if (progress < 1) {
        this.rafId = requestAnimationFrame(step);
      }
    };

    this.rafId = requestAnimationFrame(step);
  }
}
