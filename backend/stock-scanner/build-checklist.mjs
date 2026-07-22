#!/usr/bin/env node
// Sync checklist.json against a TradingView scanner result.
//
//   node build-checklist.mjs scanner-result.json
//   node build-checklist.mjs scanner-result.json --dry-run
//
// The scanner file is the source of truth for *which* stocks belong in the list:
//   - tickers in the scan but not in the checklist  -> added   (checked: false)
//   - tickers in the checklist but not in the scan  -> moved to removed.json
//   - tickers in both                               -> left alone, checked state kept
//
// removed.json is a running history. If a stock shows up in a later scan it is
// pulled back out of removed.json into the checklist with its old checked state.

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
const checklistPath = path.join(dir, 'checklist.json');
const removedPath = path.join(dir, 'removed.json');

// Missing file is fine — that's just an empty list. Malformed JSON is not.
const readList = async (file) => {
  let raw;
  try {
    raw = await readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { list: [], existed: false };
    throw err;
  }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`${file} exists but is not an array — refusing to overwrite it`);
  }
  return { list: parsed, existed: true };
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

const { list: checklist, existed: hadChecklist } = await readList(checklistPath);
const { list: removed } = await readList(removedPath);

const byTicker = (list) => new Map(list.filter((i) => i?.TICKER).map((i) => [i.TICKER, i]));
const checklistMap = byTicker(checklist);
const removedMap = byTicker(removed);

const added = [];
const restored = [];
const dropped = [];

// Rebuild the checklist in scanner order so it always mirrors the latest scan.
const nextChecklist = scanned.map((ticker) => {
  const existing = checklistMap.get(ticker);
  if (existing) return { TICKER: ticker, checked: Boolean(existing.checked) };

  const previously = removedMap.get(ticker);
  if (previously) {
    restored.push(ticker);
    return { TICKER: ticker, checked: Boolean(previously.checked) };
  }

  added.push(ticker);
  return { TICKER: ticker, checked: false };
});

// Anything left in the checklist that the scan no longer returns.
const removedAt = new Date().toISOString();
for (const item of checklist) {
  if (!item?.TICKER || scannedSet.has(item.TICKER)) continue;
  dropped.push(item.TICKER);
  removedMap.set(item.TICKER, {
    TICKER: item.TICKER,
    checked: Boolean(item.checked),
    removedAt,
  });
}
for (const ticker of restored) removedMap.delete(ticker);

const nextRemoved = [...removedMap.values()];

if (!dryRun) {
  await writeFile(checklistPath, `${JSON.stringify(nextChecklist, null, 2)}\n`, 'utf8');
  if (nextRemoved.length > 0 || dropped.length > 0) {
    await writeFile(removedPath, `${JSON.stringify(nextRemoved, null, 2)}\n`, 'utf8');
  }
}

const preview = (list) => (list.length > 8 ? `${list.slice(0, 8).join(', ')} …` : list.join(', '));

console.log(`Source    : ${inputPath}`);
console.log(`Checklist : ${checklistPath}${hadChecklist ? '' : ' (created)'}`);
console.log(`Scanned   : ${scanned.length} tickers`);
console.log(`Added     : ${added.length}${added.length ? ` — ${preview(added)}` : ''}`);
console.log(`Restored  : ${restored.length}${restored.length ? ` — ${preview(restored)}` : ''}`);
console.log(`Removed   : ${dropped.length}${dropped.length ? ` — ${preview(dropped)}` : ''}`);
console.log(`Unchanged : ${nextChecklist.length - added.length - restored.length}`);
console.log(`Total     : ${nextChecklist.length} in checklist, ${nextRemoved.length} in removed.json`);
if (dryRun) console.log('\n(dry run — nothing written)');
