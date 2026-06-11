const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components/legacy-ui');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace ../constants with ../../constants
    content = content.replace(/'\.\.\/constants'/g, "'../../constants'");
    content = content.replace(/"\.\.\/constants"/g, '"../../constants"');
    
    // Replace ../firebase with ../../firebase
    content = content.replace(/'\.\.\/firebase'/g, "'../../firebase'");
    content = content.replace(/"\.\.\/firebase"/g, '"../../firebase"');

    // Replace ../utils/useIsMobile with ../../utils/useIsMobile
    content = content.replace(/'\.\.\/utils/g, "'../../utils");
    content = content.replace(/"\.\.\/utils/g, '"../../utils');
    
    fs.writeFileSync(filePath, content);
});

console.log('Patched imports in legacy-ui components');
