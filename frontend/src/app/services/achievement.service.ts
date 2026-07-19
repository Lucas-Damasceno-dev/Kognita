import { Injectable, signal } from '@angular/core';

export interface AchievementData {
  title: string;
  description: string;
  xpReward?: number;
}

@Injectable({ providedIn: 'root' })
export class AchievementService {
  readonly current = signal<AchievementData | null>(null);

  show(title: string, description: string, xpReward = 0): void {
    this.current.set({ title, description, xpReward });
  }

  dismiss(): void {
    this.current.set(null);
  }
}
