const fs = require('fs');

let html = fs.readFileSync('frontend/src/app/profile/profile.html', 'utf8');

const dangerZone = `
<hr />

<div class="card danger-zone" role="region" aria-labelledby="danger-heading" style="border-color: #ef4444; background: rgba(239, 68, 68, 0.05);">
  <h3 id="danger-heading" style="color: #ef4444; margin-top: 0;">Zona de Perigo</h3>
  <p style="color: var(--text-muted);">
    Ao excluir sua conta, todos os seus dados (matérias, desafios, sessões de estudo, histórico) serão apagados permanentemente. Esta ação não pode ser desfeita.
  </p>
  <button type="button" class="btn btn-sm" style="background: #ef4444; color: white; border: none; font-weight: bold;" (click)="confirmDeleteAccount()">Excluir Minha Conta</button>
</div>

@if (showDeleteConfirm()) {
  <app-confirm
    title="Excluir Conta Permanentemente?"
    message="Tem certeza absoluta? Todos os seus dados serão perdidos para sempre."
    confirmText="Sim, excluir conta"
    cancelText="Cancelar"
    confirmStyle="danger"
    (confirm)="deleteAccount()"
    (cancel)="showDeleteConfirm.set(false)"
  />
}
`;

// Insert at the end of the file
html += dangerZone;
fs.writeFileSync('frontend/src/app/profile/profile.html', html);
