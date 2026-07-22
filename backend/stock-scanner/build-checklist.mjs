#!/usr/bin/env node
// Sync checklist.csv against a TradingView scanner result.
//
//   node build-checklist.mjs scanner-result.json
//   node build-checklist.mjs scanner-result.json --dry-run
//
// The scanner file is the source of truth for *which* stocks belong in the list:
//   - tickers in the scan but not in the checklist  -> added, status "new"
//   - tickers in the checklist but not in the scan  -> moved to removed.csv
//   - tickers in both                               -> left alone, your columns kept
//
// The review happens in Google Sheets, so the CSV has to survive that round trip:
// status / comment / date added are yours and are never rewritten by a sync.
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
const checklistPath = path.join(dir, 'checklist.csv');
const removedPath = path.join(dir, 'removed.csv');

const CHECKLIST_HEADER = ['ticker', 'status', 'comment', 'date added'];
const REMOVED_HEADER = [...CHECKLIST_HEADER, 'date removed'];
const NEW_STATUS = 'new';

// --- CSV (RFC 4180) -------------------------------------------------------------
// Hand-rolled to keep the tool dependency-free. A naive split(',') would shred every
// comment containing a comma, which is most of them.

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    if (row.some((f) => f !== '')) rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'; // escaped quote
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"' && field === '') {
      quoted = true;
      i += 1;
    } else if (char === ',') {
      endField();
      i += 1;
    } else if (char === '\r') {
      i += 1; // tolerate CRLF from Sheets/Excel
    } else if (char === '\n') {
      endRow();
      i += 1;
    } else {
      field += char;
      i += 1;
    }
  }
  if (field !== '' || row.length > 0) endRow();
  return rows;
};

const escapeField = (value) => {
  const str = String(value ?? '');
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

const toCsv = (header, rows) =>
  [header, ...rows].map((row) => row.map(escapeField).join(',')).join('\n') + '\n';

// --- reading --------------------------------------------------------------------

const readTextOrEmpty = async (file) => {
  try {
    return await readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return '';
    throw err;
  }
};

// Positional, not by header name: a Sheets export can reorder or requote anything, and
// a row without a ticker is a blank line rather than corruption.
const parseEntries = (text, withRemovedAt = false) => {
  const rows = parseCsv(text);
  const entries = [];
  for (const row of rows) {
    const ticker = (row[0] ?? '').trim();
    if (!ticker || ticker.toLowerCase() === 'ticker') continue; // header or blank
    const entry = {
      ticker,
      status: (row[1] ?? '').trim(),
      comment: row[2] ?? '',
      dateAdded: (row[3] ?? '').trim(),
    };
    if (withRemovedAt) entry.dateRemoved = (row[4] ?? '').trim();
    entries.push(entry);
  }
  return entries;
};

// First occurrence wins everywhere: a duplicated row is far more likely to be a stray
// edit than a correction, and the first copy is the annotated one. removed.csv is
// written newest-first, so first-wins also keeps the most recent removal.
const keepFirst = (map, key, value) => {
  if (!map.has(key)) map.set(key, value);
  return map;
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

// --- sync -----------------------------------------------------------------------

const scanner = JSON.parse(await readFile(inputPath, 'utf8'));
const scanned = extractTickers(scanner);
const scannedSet = new Set(scanned);

const checklistText = await readTextOrEmpty(checklistPath);
const hadChecklist = checklistText.length > 0;
const checklist = parseEntries(checklistText);
const removed = parseEntries(await readTextOrEmpty(removedPath), true);

const checklistMap = checklist.reduce((map, e) => keepFirst(map, e.ticker, e), new Map());
const removedMap = removed.reduce((map, e) => keepFirst(map, e.ticker, e), new Map());

const today = new Date().toISOString().slice(0, 10);
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
    // Original date added is kept — it answers "how long have I watched this".
    return {
      ticker,
      status: previously.status,
      comment: previously.comment,
      dateAdded: previously.dateAdded || today,
    };
  }

  added.push(ticker);
  return { ticker, status: NEW_STATUS, comment: '', dateAdded: today };
});

// Anything left in the checklist that the scan no longer returns.
const removedToday = [];
for (const entry of checklist) {
  if (scannedSet.has(entry.ticker)) continue;
  dropped.push(entry.ticker);
  removedToday.push({ ...entry, dateRemoved: today });
}

const restoredSet = new Set(restored);
const nextRemoved = [
  ...removedToday,
  ...removed.filter((e) => !restoredSet.has(e.ticker) && !scannedSet.has(e.ticker)),
];

const checklistRows = nextChecklist.map((e) => [e.ticker, e.status, e.comment, e.dateAdded]);
const removedRows = nextRemoved.map((e) => [e.ticker, e.status, e.comment, e.dateAdded, e.dateRemoved]);

if (!dryRun) {
  await writeFile(checklistPath, toCsv(CHECKLIST_HEADER, checklistRows), 'utf8');
  if (removedRows.length > 0) await writeFile(removedPath, toCsv(REMOVED_HEADER, removedRows), 'utf8');
}

const preview = (list) => (list.length > 8 ? `${list.slice(0, 8).join(', ')} …` : list.join(', '));
const untouched = nextChecklist.filter((e) => e.status === NEW_STATUS).length;

console.log(`Source    : ${inputPath}`);
console.log(`Checklist : ${checklistPath}${hadChecklist ? '' : ' (created)'}`);
console.log(`Scanned   : ${scanned.length} tickers`);
console.log(`Added     : ${added.length}${added.length ? ` — ${preview(added)}` : ''}`);
console.log(`Restored  : ${restored.length}${restored.length ? ` — ${preview(restored)}` : ''}`);
console.log(`Removed   : ${dropped.length}${dropped.length ? ` — ${preview(dropped)}` : ''}`);
console.log(`Unchanged : ${nextChecklist.length - added.length - restored.length}`);
console.log(`Total     : ${nextChecklist.length} in checklist (${untouched} still "${NEW_STATUS}"), ${nextRemoved.length} in removed.csv`);
if (dryRun) console.log('\n(dry run — nothing written)');
