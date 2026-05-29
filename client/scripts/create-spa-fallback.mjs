import { readFileSync, writeFileSync } from 'node:fs';

const indexPath = 'dist/index.html';
const fallbackPath = 'dist/spa.html';

const html = readFileSync(indexPath, 'utf8');
const fallback = html
  .replace(/<body>[\s\S]*<\/body>/, '<body>\n    <div id="app"></div>\n  </body>')
  .replace(/<title>[\s\S]*?<\/title>/, '<title>VOIP Accelerator</title>')
  .replace(/<link rel="canonical"[^>]*>/g, '')
  .replace(/<meta (?:name|property)="(?:title|description|og:[^"]+|twitter:[^"]+)"[^>]*>/g, '')
  .replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, '');

writeFileSync(fallbackPath, fallback);
