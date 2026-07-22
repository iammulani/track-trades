#!/usr/bin/env node
// Sync checklist.md against a TradingView scanner result.
//
//   node build-checklist.mjs scanner-result.json
//   node build-checklist.mjs scanner-result.json --dry-run
//
// The scanner file is the source of truth for *which* stocks belong in the list:
//   - tickers in the scan but not in the checklist  -> added as "- [ ] TICKER"
//   - tickers in the checklist but not in the scan  -> moved to removed.md
//   - tickers in both                               -> left alone, tick + note kept
//
// removed.md is a running history, grouped by run date. If a stock shows up in a later
// scan it is pulled back into the checklist with its old tick state and note.
//
// See specs/scanner-checklist.spec.md.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const inputArg = args.find((a) => !a.startsWith('--'));

if (!inputArg) {
  console.error('Usage: node build-checklist.mjs <scanner-result.json> [--dry-run]');
  process.exit(1);
}

const inputPath = path.resolve(process.cwd(), inputArg);
const dir = path.dirname(inputPath);
const checklistPath = path.join(dir, 'checklist.md');
const removedPath = path.join(dir, 'removed.md');

// "- [x] NSE:FOO  some note" -> checked, ticker, note. Anything else is not an entry.
const ENTRY = /^\s*[-*]\s*\[([ xX])\]\s+(\S+)[ \t]*(.*)$/;
const DATE_HEADING = /^##\s+(\d{4}-\d{2}-\d{2})\s*$/;

const readTextOrEmpty = async (file) => {
  try {
    return await readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return '';
    throw err;
  }
};

// Lines that don't parse are skipped, never treated as corruption — a broken hand-edit
// costs one line, not the file.
const parseEntries = (text) => {
  const entries = [];
  for (const line of text.split('\n')) {
    const match = line.match(ENTRY);
    if (!match) continue;
    const [, tick, ticker, note] = match;
    entries.push({ ticker, checked: tick.toLowerCase() === 'x', note: note.trim() });
  }
  return entries;
};

// removed.md groups entries under "## YYYY-MM-DD" — the heading is the removal date.
const parseRemoved = (text) => {
  const groups = new Map();
  let current = null;
  for (const line of text.split('\n')) {
    const heading = line.match(DATE_HEADING);
    if (heading) {
      current = heading[1];
      if (!groups.has(current)) groups.set(current, []);
      continue;
    }
    const match = line.match(ENTRY);
    if (!match || !current) continue;
    const [, tick, ticker, note] = match;
    groups.get(current).push({ ticker, checked: tick.toLowerCase() === 'x', note: note.trim() });
  }
  return groups;
};

const formatEntry = ({ ticker, checked, note }) =>
  `- [${checked ? 'x' : ' '}] ${ticker}${note ? `  ${note}` : ''}`;

const renderChecklist = (entries, sourceName, today) => {
  const done = entries.filter((e) => e.checked).length;
  return [
    '# Scanner Checklist',
    '',
    `_${entries.length} stocks · ${done} reviewed · synced ${today} from ${sourceName}_`,
    '',
    ...entries.map(formatEntry),
    '',
  ].join('\n');
};

const renderRemoved = (groups) => {
  const dates = [...groups.keys()].filter((d) => groups.get(d).length > 0).sort().reverse();
  const sections = dates.flatMap((date) => [`## ${date}`, '', ...groups.get(date).map(formatEntry), '']);
  return ['# Removed from the checklist', '', ...sections].join('\n');
};

// Pull "NSE:ZYDUSLIFE" out of each scanner row, keeping the scanner's order.
const extractTickers = (scanner) => {
  const rows = Array.isArray(scanner) ? scanner : scanner?.data;
  if (!Array.isArray(rows)) throw new Error('No "data" array found in the scanner file');
  const tickers = rows
    .map((row) => (typeof row === 'string' ? row : row?.s))
    .filter((t) => typeof t === 'string' && t.length > 0);
  return [...new Set(tickers)];
};

const scanner = JSON.parse(await readFile(inputPath, 'utf8'));
const scanned = extractTickers(scanner);
const scannedSet = new Set(scanned);

const checklistText = await readTextOrEmpty(checklistPath);
const hadChecklist = checklistText.length > 0;
const checklist = parseEntries(checklistText);
const removedGroups = parseRemoved(await readTextOrEmpty(removedPath));

// First occurrence wins everywhere: a duplicated line is far more likely to be a stray
// hand-edit than an intentional correction, and the first copy is the annotated one.
// removed.md is rendered newest-first, so first-wins keeps the most recent removal too.
const keepFirst = (map, key, value) => {
  if (!map.has(key)) map.set(key, value);
  return map;
};

const checklistMap = checklist.reduce((map, e) => keepFirst(map, e.ticker, e), new Map());
const removedMap = new Map();
for (const [date, entries] of removedGroups) {
  for (const entry of entries) keepFirst(removedMap, entry.ticker, { ...entry, date });
}

const added = [];
const restored = [];
const dropped = [];

// Rebuild the checklist in scanner order so it always mirrors the latest scan.
const nextChecklist = scanned.map((ticker) => {
  const existing = checklistMap.get(ticker);
  if (existing) return existing;

  const previously = removedMap.get(ticker);
  if (previously) {
    restored.push(ticker);
    return { ticker, checked: previously.checked, note: previously.note };
  }

  added.push(ticker);
  return { ticker, checked: false, note: '' };
});

const today = new Date().toISOString().slice(0, 10);

// Anything left in the checklist that the scan no longer returns.
const removedToday = [];
for (const entry of checklist) {
  if (scannedSet.has(entry.ticker)) continue;
  dropped.push(entry.ticker);
  removedToday.push(entry);
}

// Restored tickers leave the history; today's drops join it.
for (const [date, entries] of removedGroups) {
  removedGroups.set(
    date,
    entries.filter((e) => !restored.includes(e.ticker))
  );
}
if (removedToday.length > 0) {
  const existingToday = removedGroups.get(today) ?? [];
  const seen = new Set(existingToday.map((e) => e.ticker));
  removedGroups.set(today, [...existingToday, ...removedToday.filter((e) => !seen.has(e.ticker))]);
}

const removedTotal = [...removedGroups.values()].reduce((n, entries) => n + entries.length, 0);

if (!dryRun) {
  await writeFile(checklistPath, renderChecklist(nextChecklist, path.basename(inputPath), today), 'utf8');
  if (removedTotal > 0) await writeFile(removedPath, renderRemoved(removedGroups), 'utf8');
}

const preview = (list) => (list.length > 8 ? `${list.slice(0, 8).join(', ')} …` : list.join(', '));
const reviewed = nextChecklist.filter((e) => e.checked).length;

console.log(`Source    : ${inputPath}`);
console.log(`Checklist : ${checklistPath}${hadChecklist ? '' : ' (created)'}`);
console.log(`Scanned   : ${scanned.length} tickers`);
console.log(`Added     : ${added.length}${added.length ? ` — ${preview(added)}` : ''}`);
console.log(`Restored  : ${restored.length}${restored.length ? ` — ${preview(restored)}` : ''}`);
console.log(`Removed   : ${dropped.length}${dropped.length ? ` — ${preview(dropped)}` : ''}`);
console.log(`Unchanged : ${nextChecklist.length - added.length - restored.length}`);
console.log(`Total     : ${nextChecklist.length} in checklist (${reviewed} reviewed), ${removedTotal} in removed.md`);
if (dryRun) console.log('\n(dry run — nothing written)');
