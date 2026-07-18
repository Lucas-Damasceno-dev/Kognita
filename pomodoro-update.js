const fs = require('fs');

let code = fs.readFileSync('frontend/src/app/pomodoro/pomodoro.ts', 'utf8');

// Add imports
code = code.replace(
  "import { ToastService } from '../services/toast.service';",
  "import { ToastService } from '../services/toast.service';\nimport { Checkin } from '../checkin/checkin';\nimport { Confirm } from '../confirm/confirm';"
);

// Update Component imports
code = code.replace(
  "imports: [FormsModule],",
  "imports: [FormsModule, Checkin, Confirm],"
);

// Add signals
code = code.replace(
  "saving = signal(false);",
  "saving = signal(false);\n  showCheckin = signal(false);\n  showConfirmTaskComplete = signal(false);"
);

// We need to inject the logic in `onTimerComplete` right after saving the session.
// So we find `this.isBreak.set(true);` and replace it with:
// if (this.selectedTaskId) { this.showConfirmTaskComplete.set(true); } else { this.isBreak.set(true); }
const onTimerCompleteSuccessCode = `
          if (res) {
            this.sessionCount++;
            this.toast.success(\`Sessão salva! (\${duration} min)\`);
            this.sendNotification(
              'Kognita — Foco concluído! 🎯',
              \`\${duration} min de estudo registrados. Hora da pausa!\`,
            );
            this.timeLeft = this.breakDuration * 60;
            if (this.selectedTaskId) {
              this.showConfirmTaskComplete.set(true);
            } else {
              this.isBreak.set(true);
            }
          }
`;
code = code.replace(/if \(res\) \{[\s\S]*?this\.isBreak\.set\(true\);\s*\}/, onTimerCompleteSuccessCode.trim());

// We need to add the methods to handle the completion:
// handleTaskCompleteConfirm, handleTaskCompleteCancel, handleCheckin, handleCheckinCancel
const newMethods = `
  handleTaskCompleteConfirm(): void {
    this.showConfirmTaskComplete.set(false);
    this.showCheckin.set(true);
  }

  handleTaskCompleteCancel(): void {
    this.showConfirmTaskComplete.set(false);
    this.isBreak.set(true);
    // User didn't complete it, just go to break.
  }

  handleCheckin(usedAi: boolean): void {
    if (!this.selectedTaskId) return;
    const user = this.auth.user();
    if (!user) return;
    
    this.saving.set(true);
    this.api
      .createChallengeAttempt({ taskId: this.selectedTaskId, usedAi }, user.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.toast.success(usedAi ? 'Registrado (com IA)' : 'Desafio concluído sem IA!');
          this.api.updateTaskStatus(this.selectedTaskId, 'completed').subscribe(() => {
            this.selectedTaskId = ''; // Clear task
            this.onSubjectChange(); // Refresh task list
            this.showCheckin.set(false);
            this.isBreak.set(true); // Now we start the break
          });
        },
        error: () => {
          this.showCheckin.set(false);
          this.isBreak.set(true);
        },
      });
  }

  handleCheckinCancel(): void {
    this.showCheckin.set(false);
    this.isBreak.set(true);
  }
`;

code = code.replace("toggleZenMode(): void {", newMethods + "\n  toggleZenMode(): void {");

fs.writeFileSync('frontend/src/app/pomodoro/pomodoro.ts', code);
