const fs = require('fs');

let code = fs.readFileSync('frontend/src/app/subjects/subjects.ts', 'utf8');

const archiveMethod = `
  archive(item: Subject): void {
    if (confirm(\`Deseja arquivar a matéria "\${item.name}"? Ela não aparecerá mais nas listas principais.\`)) {
      this.api.archiveSubject(item.id).subscribe({
        next: () => {
          this.toast.success('Matéria arquivada com sucesso.');
          this.load();
        },
        error: () => this.toast.error('Erro ao arquivar matéria.')
      });
    }
  }
`;

code = code.replace("  confirmDelete(id: string, name: string): void {", archiveMethod + "\n  confirmDelete(id: string, name: string): void {");

fs.writeFileSync('frontend/src/app/subjects/subjects.ts', code);
