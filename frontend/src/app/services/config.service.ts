import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly challengeModeKey = 'kognita_challenge_mode';

  readonly challengeMode = signal(localStorage.getItem(this.challengeModeKey) === 'true');

  toggleChallengeMode(): void {
    this.challengeMode.update(v => !v);
    localStorage.setItem(this.challengeModeKey, String(this.challengeMode()));
  }
}
