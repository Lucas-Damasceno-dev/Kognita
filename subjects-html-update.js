const fs = require('fs');

let html = fs.readFileSync('frontend/src/app/subjects/subjects.html', 'utf8');

// replace delete button area
const target = `<button class="btn-ghost" type="button" (click)="confirmDelete(item.id, item.name)" aria-label="Excluir {{ item.name }}">✕</button>`;
const replacement = `<button type="button" class="btn btn-sm btn-ghost" (click)="archive(item)" title="Arquivar">📦</button>
            <button class="btn-ghost" type="button" (click)="confirmDelete(item.id, item.name)" aria-label="Excluir {{ item.name }}">✕</button>`;

html = html.replace(target, replacement);

fs.writeFileSync('frontend/src/app/subjects/subjects.html', html);
