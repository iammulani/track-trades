#!/usr/bin/env node
/**
 * Keeps backend/db.json (what json-server actually serves) and
 * backend/data/*.json (the git-tracked source you read/edit/commit) in sync,
 * in both directions:
 *
 *  - data/*.json -> db.json      whenever a data file changes (hand edits)
 *  - db.json -> data/*.json      whenever db.json changes (adds/edits/removes
 *                                 made through the running app)
 *
 * So anything you add through the app ends up back in backend/data/*.json —
 * commit that file whenever you want to snapshot your trades/watchlist.
 * Each direction is a no-op once the two sides already match, so the two
 * watchers can't loop off each other.
 *
 * Usage:
 *   node merge-db.js          # sync once (bootstraps db.json on first run)
 *   node merge-db.js --watch  # sync once, then keep syncing both directions
 *   node merge-db.js --reset  # discard db.json and rebuild it from data/*.json
 */
const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar')

const DATA_DIR = path.join(__dirname, 'data')
const OUT_FILE = path.join(__dirname, 'db.json')

function buildDbFromData() {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'))
  const db = {}
  for (const file of files) {
    db[path.basename(file, '.json')] = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'),
    )
  }
  const next = JSON.stringify(db, null, 2) + '\n'
  if (fs.existsSync(OUT_FILE) && fs.readFileSync(OUT_FILE, 'utf-8') === next) return
  fs.writeFileSync(OUT_FILE, next)
  console.log(`[merge-db] db.json <- ${files.join(', ')}`)
}

function exportDataFromDb() {
  const db = JSON.parse(fs.readFileSync(OUT_FILE, 'utf-8'))
  for (const [key, value] of Object.entries(db)) {
    if (key === '$schema') continue
    const file = path.join(DATA_DIR, `${key}.json`)
    const next = JSON.stringify(value, null, 2) + '\n'
    if (fs.existsSync(file) && fs.readFileSync(file, 'utf-8') === next) continue
    fs.writeFileSync(file, next)
    console.log(`[merge-db] data/${key}.json <- db.json`)
  }
}

if (process.argv.includes('--reset') && fs.existsSync(OUT_FILE)) {
  fs.unlinkSync(OUT_FILE)
}

buildDbFromData()

if (process.argv.includes('--watch')) {
  console.log('[merge-db] watching data/*.json and db.json for changes...')

  // chokidar (not raw fs.watch): lowdb writes db.json via a temp-file-then-rename,
  // which reliably kills a plain fs.watch() on a single file after the first
  // rename. chokidar re-establishes its watch across renames and debounces
  // partial writes, so it keeps seeing every change.
  const watchOpts = { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 100 } }

  chokidar.watch(DATA_DIR, watchOpts).on('all', (_event, filePath) => {
    if (filePath.endsWith('.json')) buildDbFromData()
  })

  chokidar.watch(OUT_FILE, watchOpts).on('all', () => {
    try {
      exportDataFromDb()
    } catch {
      // db.json mid-write; the next change event will retry
    }
  })
}
