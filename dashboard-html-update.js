const fs = require('fs');
let html = fs.readFileSync('frontend/src/app/dashboard/dashboard.html', 'utf8');

html = html.replace(
  '<h3>Crie sua primeira matéria</h3>',
  '<h3>Crie matérias ou Importe um Roadmap</h3>'
);
html = html.replace(
  '<p>Organize seus estudos por matérias — cada uma com cor e nome.</p>',
  '<p>Comece criando uma matéria manualmente ou use a aba <strong>Importar</strong>.</p>'
);

fs.writeFileSync('frontend/src/app/dashboard/dashboard.html', html);
