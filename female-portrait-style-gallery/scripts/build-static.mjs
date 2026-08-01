import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

function stripModuleSyntax(source) {
  return source
    .replace(/\r\n?/g, '\n')
    .replace(/^\s*import\s+[^;]+;\s*$/gm, '')
    .replace(/^(\s*)export\s+(?=(?:const|let|var|function|class)\b)/gm, '$1');
}

export async function buildClassicBundle({ rootDir }) {
  const root = fileURLToPath(rootDir);
  const sources = await Promise.all([
    readFile(join(root, 'js/gallery.js'), 'utf8'),
    readFile(join(root, 'js/styles.js'), 'utf8'),
    readFile(join(root, 'js/main.js'), 'utf8'),
  ]);
  const classic = sources.map(stripModuleSyntax).join('\n\n');
  return `(() => {\n'use strict';\n${classic}\n})();\n`;
}

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const rootDir = new URL('../', import.meta.url);
  const output = await buildClassicBundle({ rootDir });
  await writeFile(join(dirname(fileURLToPath(import.meta.url)), '../js/app.js'), output, 'utf8');
}
