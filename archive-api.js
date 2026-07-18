const fs = require('fs');

let code = fs.readFileSync('frontend/src/app/services/api.service.ts', 'utf8');

const newMethod = `
  deleteSubject(id: string): Observable<void> {
    return this.http.delete<void>(\`\${this.api}/subjects/\${id}\`);
  }

  archiveSubject(id: string): Observable<Subject> {
    return this.http.put<Subject>(\`\${this.api}/subjects/\${id}/archive\`, {});
  }
`;

code = code.replace(
  "  deleteSubject(id: string): Observable<void> {\n    return this.http.delete<void>(`${this.api}/subjects/${id}`);\n  }",
  newMethod
);

fs.writeFileSync('frontend/src/app/services/api.service.ts', code);
