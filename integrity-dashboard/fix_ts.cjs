const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components/legacy-ui');

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('// @ts-nocheck')) {
        content = '// @ts-nocheck\n' + content;
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Patched', fullPath);
      }
    }
  }
}

processDir(dir);
console.log('Done');
