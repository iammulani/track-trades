#!/usr/bin/env node
/**
 * Merges backend/data/*.json into backend/db.json — the single file
 * json-server actually serves. Each file becomes one resource, named after
 * the file (data/trades.json -> the "trades" endpoint).
 *
 * Usage:
 *   node merge-db.js          # merge once
 *   node merge-db.js --watch  # merge, then re-merge whenever a data file changes
 */
const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, 'data')
const OUT_FILE = path.join(__dirname, 'db.json')

function build() {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'))
  const db = {}
  for (const file of files) {
    const key = path.basename(file, '.json')
    db[key] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'))
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(db, null, 2) + '\n')
  console.log(`[merge-db] merged ${files.join(', ')} -> db.json`)
}

build()

if (process.argv.includes('--watch')) {
  console.log(`[merge-db] watching ${path.relative(process.cwd(), DATA_DIR)}/*.json for changes...`)
  fs.watch(DATA_DIR, { persistent: true }, (_event, filename) => {
    if (filename && filename.endsWith('.json')) build()
  })
}
