import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_DIR = path.resolve(__dirname, '../../docs/wiki');
const OUTPUT_FILE = path.resolve(__dirname, '../src/assets/wiki.json');
const DEPLOYMENTS_SRC = path.resolve(__dirname, '../../deployments.json');
const DEPLOYMENTS_DEST = path.resolve(__dirname, '../src/assets/deployments.json');

function getMarkdownFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      fileList = getMarkdownFiles(path.join(dir, file), fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

function generateWikiData() {
  const files = getMarkdownFiles(WIKI_DIR);
  const wikiData = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const parsed = matter(content);
      
      // Only include pages with frontmatter
      if (parsed.data && parsed.data.title) {
        wikiData.push({
          id: path.basename(file, '.md'),
          title: parsed.data.title,
          type: parsed.data.type || 'unknown',
          tags: parsed.data.tags || [],
          confidence: parsed.data.confidence || 'unknown',
          updated: parsed.data.updated || null,
          content: parsed.content,
        });
      }
    } catch (e) {
      console.warn(`[Wiki Sync] Warning: could not parse ${file}: ${e.message}`);
    }
  }

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(wikiData, null, 2));
  console.log(`[Wiki Sync] Successfully synced ${wikiData.length} wiki pages to src/assets/wiki.json`);

  // Sync deployments.json
  if (fs.existsSync(DEPLOYMENTS_SRC)) {
    fs.copyFileSync(DEPLOYMENTS_SRC, DEPLOYMENTS_DEST);
    console.log(`[Deployments Sync] Copied deployments.json to src/assets/deployments.json`);
  } else {
    console.warn(`[Deployments Sync] deployments.json not found in root.`);
  }
}

generateWikiData();
