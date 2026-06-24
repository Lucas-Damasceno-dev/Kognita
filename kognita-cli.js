const fs = require('fs');
const path = require('path');

const rootDir = process.env.LEARNING_DIR || '/home/lucasd/Documents/dev/learning/';
const userId = process.env.USER_ID; 
const apiEndpoint = 'http://localhost:8080/api/import/file-structure';

if (!userId) {
    console.error('USER_ID environment variable is required');
    process.exit(1);
}

function scanDirectory(dir) {
    const structure = [];
    if (!fs.existsSync(dir)) {
        console.error(`Directory not found: ${dir}`);
        return [];
    }
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        if (item.isDirectory()) {
            const category = item.name;
            const tasks = [];
            const files = fs.readdirSync(path.join(dir, item.name));
            for (const file of files) {
                if (!fs.statSync(path.join(dir, item.name, file)).isDirectory()) {
                    tasks.push(file);
                }
            }
            structure.push({ category, tasks });
        }
    }
    return structure;
}

const data = scanDirectory(rootDir);

fetch(`${apiEndpoint}?userId=${userId}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
})
.then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log('Import successful');
})
.catch(error => {
    console.error('Import failed:', error);
});
