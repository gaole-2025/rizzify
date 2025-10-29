// Rebuild prompt catalogs (full text) from rules/prompt2.txt and rules/prompt3.txt
// - Cleans （nice）（男）（女）（男女） markers
// - Writes docs/catalog/prompt-catalog.full.p2.json and ...full.p3.json
// - Optionally removes part files if they exist

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

function splitSegments(raw) {
  const lines = raw.split(/\r?\n/);
  const segments = [];
  let current = [];
  const isSep = (s) => s.trim() === '' || /^-+$/.test(s.trim());
  for (const line of lines) {
    if (isSep(line)) {
      if (current.length) {
        const seg = current.join('\n').trim();
        if (seg) segments.push(seg);
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length) {
    const seg = current.join('\n').trim();
    if (seg) segments.push(seg);
  }
  return segments;
}

function cleanText(t) {
  return t
    .replace(/（\s*nice\s*）/g, '')
    .replace(/（\s*男\s*）/g, '')
    .replace(/（\s*女\s*）/g, '')
    .replace(/（\s*男女\s*）/g, '')
    .trim();
}

function buildItems(segments, source) {
  return segments.map((seg, i) => ({
    id: `${source}-${String(i + 1).padStart(3, '0')}`,
    source: source,
    gender: 'unisex',
    text: cleanText(seg)
  }));
}

function buildItemsWithIds(segments, ids, indexItems) {
  return segments.map((seg, i) => {
    const indexItem = indexItems && indexItems[i];
    return {
      id: ids[i],
      source: indexItem?.source || ids[i].split('-')[0],
      gender: indexItem?.gender || 'unisex',
      text: cleanText(seg)
    };
  });
}

async function readJson(p) {
  const raw = await fsp.readFile(p, 'utf8');
  return JSON.parse(raw);
}

async function writeJson(p, obj) {
  await fsp.mkdir(path.dirname(p), { recursive: true });
  await fsp.writeFile(p, JSON.stringify(obj, null, 2), 'utf8');
}

async function safeUnlink(p) {
  try { await fsp.unlink(p); } catch (_) {}
}

async function main() {
  const root = process.cwd();
  const rulesDir = path.join(root, 'rules');
  const docsDir = path.join(root, 'docs', 'catalog');

  const p2txt = await fsp.readFile(path.join(rulesDir, 'prompt2.txt'), 'utf8');
  const p3txt = await fsp.readFile(path.join(rulesDir, 'prompt3.txt'), 'utf8');

  const seg2 = splitSegments(p2txt);
  const seg3 = splitSegments(p3txt);

  // Try to align IDs with index files
  let idx2Ids = [];
  let idx3Ids = [];
  try {
    const idx2 = await readJson(path.join(docsDir, 'prompt-catalog.index.p2.json'));
    if (Array.isArray(idx2.items)) idx2Ids = idx2.items.map(it => it.id);
  } catch (e) {
    console.warn('[warn] could not read p2 index:', e.message);
  }
  try {
    const idx3 = await readJson(path.join(docsDir, 'prompt-catalog.index.p3.json'));
    if (Array.isArray(idx3.items)) idx3Ids = idx3.items.map(it => it.id);
  } catch (e) {
    console.warn('[warn] could not read p3 index:', e.message);
  }

  // Read index items for metadata
  let idx2Items = [];
  let idx3Items = [];
  try {
    const idx2 = await readJson(path.join(docsDir, 'prompt-catalog.index.p2.json'));
    if (Array.isArray(idx2.items)) idx2Items = idx2.items;
  } catch (e) {}
  try {
    const idx3 = await readJson(path.join(docsDir, 'prompt-catalog.index.p3.json'));
    if (Array.isArray(idx3.items)) idx3Items = idx3.items;
  } catch (e) {}

  const items2 = (idx2Ids.length === seg2.length)
    ? buildItemsWithIds(seg2, idx2Ids, idx2Items)
    : buildItems(seg2, 'p2');

  const items3 = (idx3Ids.length === seg3.length)
    ? buildItemsWithIds(seg3, idx3Ids, idx3Items)
    : buildItems(seg3, 'p3');

  await writeJson(path.join(docsDir, 'prompt-catalog.full.p2.json'), { version: '1.0', items: items2 });
  await writeJson(path.join(docsDir, 'prompt-catalog.full.p3.json'), { version: '1.0', items: items3 });

  // verify counts vs index
  let idx2 = 0, idx3 = 0;
  try { idx2 = (await readJson(path.join(docsDir, 'prompt-catalog.index.p2.json'))).items.length; } catch {}
  try { idx3 = (await readJson(path.join(docsDir, 'prompt-catalog.index.p3.json'))).items.length; } catch {}

  console.log(`[built] p2 full: ${items2.length} (index ${idx2 || 'n/a'})`);
  console.log(`[built] p3 full: ${items3.length} (index ${idx3 || 'n/a'})`);

  // remove part files if present
  const partFiles = [
    'prompt-catalog.full.p2.part1.json',
    'prompt-catalog.full.p2.part2.json',
    'prompt-catalog.full.p3.partA.json',
    'prompt-catalog.full.p3.partB.json',
    'prompt-catalog.full.p3.partC.json',
    'prompt-catalog.full.p3.partD.json',
  ].map(f => path.join(docsDir, f));
  for (const f of partFiles) await safeUnlink(f);
}

main().catch(err => { console.error(err.stack || err.message || err); process.exit(1); });
