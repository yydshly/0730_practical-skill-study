#!/usr/bin/env node
/**
 * fix-neuform-demos.js
 *
 * Converts NeuForm sandboxed demo pages into self-contained standalone HTML.
 * Reads assets from local filesystem and inlines them as data URIs.
 *
 * Usage: node scripts/fix-neuform-demos.js
 */

const fs = require('fs');
const path = require('path');

const GHP_BASE = 'https://yydshly.github.io/0730_practical-skill-study/mengto-skills-study';

const SANDBOXED = [
  'media/aura-asset-images','web-design/agency-grid-layout-minimal','web-design/background-grid-webgl',
  'web-design/beautiful-shadows','web-design/blue-cloudy-clean-modern','web-design/book-serif-index',
  'web-design/clean-minimal-beige-light-mode','web-design/company-logos','web-design/container-lines',
  'web-design/corner-diagonals','web-design/corner-lasers','web-design/css-border-gradient',
  'web-design/dither-background','web-design/dither-laser-dark-mode','web-design/editorial-tech',
  'web-design/framed-grid-layout','web-design/glass-dark-mode-clock','web-design/globe-particles',
  'web-design/gooey-blob-system','web-design/gsap','web-design/gsap-scrolltrigger-storytelling',
  'web-design/high-contrast-skeuomorphic-clean','web-design/image-first-grid-layout',
  'web-design/light-mode-paper-technical','web-design/marquee-loop','web-design/masked-reveal',
  'web-design/mesh-gradient-dark-blue-clean','web-design/nested-container-clean-agency',
  'web-design/nested-container-frames','web-design/number-details','web-design/orange-clean-paper-saas',
  'web-design/progressive-blur','web-design/skeuomorphic-ui','web-design/solar-duotone-bold',
  'web-design/split-layout-technical','web-design/technical-wireframe-info-layout',
  'web-design/webgl-3d-object','web-design/webgl-laser'
];

function mimeType(ext) {
  const map = {
    '.js': 'application/javascript', '.css': 'text/css',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif',
    '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.avif': 'image/avif',
    '.ico': 'image/x-icon',
  };
  return map['.' + ext.toLowerCase()] || 'application/octet-stream';
}

function toDataURI(buf, ext) {
  return 'data:' + mimeType(ext) + ';base64,' + buf.toString('base64');
}

// Resolve a path like "../../../assets/runtime/xxx.js" relative to demoDir
// to an absolute path in the local filesystem.
function resolveAsset(refPath, demoDir) {
  // refPath like "assets/page-01.jpg" or "../../../assets/runtime/xxx.js"
  if (refPath.startsWith('../../../assets/')) {
    // 4 levels up from demo/ → repo root assets/
    const rel = refPath.replace('../../../assets/', '');
    return path.resolve(demoDir, '..', '..', '..', '..', 'assets', rel);
  }
  if (refPath.startsWith('assets/')) {
    return path.resolve(demoDir, refPath);
  }
  return path.resolve(demoDir, refPath);
}

// Given a demo's refPath (as in the original HTML), return the GitHub Pages URL
function ghpagesURL(refPath, demoDir, skillDir) {
  // "../../../assets/runtime/xxx.js" → "assets/runtime/xxx.js"
  let normalized = refPath;
  if (normalized.startsWith('../../../assets/')) {
    normalized = 'assets/' + normalized.replace('../../../assets/', '');
  } else if (normalized.startsWith('assets/')) {
    // keep as-is
  }
  return GHP_BASE + '/' + skillDir + '/demo/' + normalized;
}

async function fetchAndInline(filePaths, demoDir, skillDir) {
  const results = {};
  for (const fp of filePaths) {
    if (!fp) continue;
    // Try local first
    const localPath = resolveAsset(fp, demoDir);
    let buf = null;
    if (fs.existsSync(localPath)) {
      buf = fs.readFileSync(localPath);
    } else {
      // Try GitHub Pages URL
      const url = ghpagesURL(fp, demoDir, skillDir);
      // We can't fetch in this version, will be handled by runtime fallback
      continue;
    }
    if (buf) {
      const ext = path.extname(fp);
      results[fp] = toDataURI(buf, ext);
    }
  }
  return results;
}

function extractInline(html, tag, attr, src) {
  // For script tags with src, we need to inline the content
  // This is complex - return empty for now
  return '';
}

async function processDemo(skillDir) {
  const demoDir = path.join('agent-skills', skillDir, 'demo');
  const indexPath = path.join(demoDir, 'index.html');
  const content = fs.readFileSync(indexPath, 'utf8');

  // Extract encodedHtml
  const htmlBlockMatch = content.match(/const encodedHtml = "([\s\S]*?)";\s*const assetFiles/);
  if (!htmlBlockMatch) return { status: 'skip', reason: 'no encodedHtml' };
  const encoded = htmlBlockMatch[1];

  // Extract arrays
  const assetArrMatch = content.match(/const assetFiles = (\[[\s\S]*?\]);/);
  const runtimeArrMatch = content.match(/const runtimeFiles = (\[[\s\S]*?\]);/);
  if (!assetArrMatch || !runtimeArrMatch) return { status: 'skip', reason: 'missing arrays' };

  let assetFiles, runtimeFiles;
  try {
    assetFiles = JSON.parse(assetArrMatch[1]);
    runtimeFiles = JSON.parse(runtimeArrMatch[1]);
  } catch(e) {
    return { status: 'skip', reason: 'parse error' };
  }

  // Decode inner HTML
  let innerHtml;
  try {
    innerHtml = Buffer.from(encoded, 'base64').toString('utf8');
  } catch(e) {
    return { status: 'skip', reason: 'decode error' };
  }

  if (innerHtml.length < 100) return { status: 'skip', reason: 'HTML too short' };

  // Remove CSP meta tag
  innerHtml = innerHtml.replace(/<meta[^>]*Content-Security-Policy[^>]*>/gi, '');

  // Load all assets from local filesystem
  const allFiles = [...assetFiles, ...runtimeFiles];
  const replacements = {};
  let loaded = 0, missed = 0;

  for (const fp of allFiles) {
    if (!fp) continue;
    const localPath = resolveAsset(fp, demoDir);
    if (fs.existsSync(localPath)) {
      const buf = fs.readFileSync(localPath);
      const ext = path.extname(fp);
      replacements[fp] = toDataURI(buf, ext);
      replacements[fp.replace(/^\.\.\//, '')] = replacements[fp];
      loaded++;
    } else {
      missed++;
    }
  }

  // Apply replacements
  let fixedHtml = innerHtml;
  for (const [oldUrl, dataUri] of Object.entries(replacements)) {
    if (oldUrl && dataUri) {
      fixedHtml = fixedHtml.split(oldUrl).join(dataUri);
    }
  }

  // Remove postMessage bootstrap script
  fixedHtml = fixedHtml.replace(/<script data-neuform-asset-bootstrap>[\s\S]*?<\/script>/, '');

  // For scripts pointing to runtime files that we couldn't load,
  // replace src with a comment so the page doesn't break on load
  fixedHtml = fixedHtml.replace(
    /<script([^>]*)src="[^"]*runtime[^"]*"([^>]*)><\/script>/gi,
    '<script$1type="text/plain"$2><\/script>'
  );

  // Add minimal wrapper if needed
  const hasDoctype = /<(!DOCTYPE|doctype)/i.test(fixedHtml);
  const hasHtml = /<html/i.test(fixedHtml);
  let finalHtml;
  if (!hasDoctype && !hasHtml) {
    finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${skillDir} Demo</title>
</head>
<body>
${fixedHtml}
</body>
</html>`;
  } else {
    finalHtml = fixedHtml;
  }

  // Write
  const outPath = path.join(demoDir, 'index-standalone.html');
  fs.writeFileSync(outPath, finalHtml, 'utf8');

  return { status: 'ok', loaded, missed, size: finalHtml.length };
}

async function main() {
  console.log('NeuForm Demo Fixer - Self-Contained HTML Generator\n');

  const results = { ok: 0, skip: 0, fail: 0, total: SANDBOXED.length };
  for (const skillDir of SANDBOXED) {
    process.stdout.write(skillDir + '... ');
    try {
      const r = await processDemo(skillDir);
      if (r.status === 'ok') {
        console.log(`OK (${r.loaded} assets, ${r.missed} missed, ${Math.round(r.size/1024)}KB)`);
        results.ok++;
      } else {
        console.log(`SKIP: ${r.reason}`);
        results.skip++;
      }
    } catch(e) {
      console.log('ERROR: ' + e.message);
      results.fail++;
    }
  }

  console.log('\n--- Results ---');
  console.log('OK:   ', results.ok, '/', results.total);
  console.log('Skip: ', results.skip);
  console.log('Fail: ', results.fail);
}

main().catch(console.error);
