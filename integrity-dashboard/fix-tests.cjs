const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'tests/unit');

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix 'React' is defined but never used
      if (file === 'test-utils.tsx') {
        content = content.replace(/import React, \{ ReactElement \} from 'react';/, "import { ReactElement } from 'react';");
        content = content.replace(/import { render, RenderOptions } from '@testing-library\/react';/, "import { render } from '@testing-library/react';\nimport type { RenderOptions } from '@testing-library/react';");
        fs.writeFileSync(fullPath, content, 'utf8');
        continue;
      }

      // We will just do a simple regex replace for `: any` to `: unknown`
      if (content.includes(': any')) {
        content = content.replace(/: any/g, ': unknown');
      }
      if (content.includes('as any')) {
        content = content.replace(/as any/g, 'as unknown');
      }

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDir(dir);
console.log('Fixed tests');
