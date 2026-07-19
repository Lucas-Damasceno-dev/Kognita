import { Component, inject, effect } from '@angular/core';
import { ConfettiService } from '../services/confetti.service';
import { AchievementService } from '../services/achievement.service';

@Component({
  selector: 'app-achievement',
  standalone: true,
  templateUrl: './achievement.html',
  styleUrl: './achievement.css',
})
export class Achievement {
  private confetti = inject(ConfettiService);
  service = inject(AchievementService);

  constructor() {
    effect(() => {
      if (this.service.current()) {
        this.confetti.fireConfetti({ count: 100 });
      }
    });
  }
}
