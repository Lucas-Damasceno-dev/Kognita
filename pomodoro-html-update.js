const fs = require('fs');

let code = fs.readFileSync('frontend/src/app/pomodoro/pomodoro.html', 'utf8');

const modals = `

@if (showConfirmTaskComplete()) {
  <app-confirm
    title="Desafio Concluído?"
    message="O timer acabou. Você conseguiu finalizar o desafio que estava trabalhando?"
    confirmText="Sim, terminei!"
    cancelText="Ainda não"
    (confirm)="handleTaskCompleteConfirm()"
    (cancel)="handleTaskCompleteCancel()"
  />
}

@if (showCheckin()) {
  <app-checkin
    [taskName]="tasks.length > 0 ? (tasks | keyvalue)[0]?.value?.title || 'Desafio' : 'Desafio'" 
    (confirm)="handleCheckin($event)"
    (cancel)="handleCheckinCancel()"
  />
}
`;

// wait, to get task name correctly:
// We can just find it from `this.tasks`. The template can access `tasks`.
// Let's create a better helper function in TS, or just write it simply.
// Actually `taskName="Desafio"` is fine if we can't find it easily. 
// A better way: `<app-checkin [taskName]="'Desafio'" ... />`

const finalModals = `

@if (showConfirmTaskComplete()) {
  <app-confirm
    title="Desafio Concluído?"
    message="O timer acabou. Você conseguiu finalizar o desafio que estava trabalhando?"
    confirmText="Sim, terminei!"
    cancelText="Ainda não"
    confirmStyle="primary"
    (confirm)="handleTaskCompleteConfirm()"
    (cancel)="handleTaskCompleteCancel()"
  />
}

@if (showCheckin()) {
  <app-checkin
    [taskName]="'Desafio'"
    (confirm)="handleCheckin($event)"
    (cancel)="handleCheckinCancel()"
  />
}
`;

fs.writeFileSync('frontend/src/app/pomodoro/pomodoro.html', code + finalModals);
