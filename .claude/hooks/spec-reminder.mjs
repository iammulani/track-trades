#!/usr/bin/env node
// Keeps the spec-driven workflow enforced by the harness rather than by memory.
//
//   spec-reminder.mjs index   (UserPromptSubmit) — lists the available specs
//   spec-reminder.mjs edit    (PreToolUse: Write|Edit) — names the spec for the file
//
// Both modes print a hook JSON payload whose additionalContext is injected into the
// model's context. Any failure exits 0 silently: a broken reminder must never block
// an edit.

import { readdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const specsDir = path.join(repoRoot, 'specs');

// Areas that own a spec but don't live under modules/ — everything else is derived.
const PATH_MAP = [{ prefix: 'backend/stock-scanner', spec: 'scanner-checklist' }];

const emit = (hookEventName, additionalContext) => {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName, additionalContext } }));
  process.exit(0);
};

const listSpecs = () =>
  readdirSync(specsDir)
    .filter((f) => f.endsWith('.spec.md'))
    .map((f) => f.replace('.spec.md', ''))
    .sort();

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
};

// "frontend/src/modules/watchlist/x.tsx" -> "watchlist"; plus the PATH_MAP entries.
const specNameFor = (relPath) => {
  const mapped = PATH_MAP.find((entry) => relPath.startsWith(entry.prefix));
  if (mapped) return mapped.spec;
  const match = relPath.match(/(?:^|\/)modules\/([^/]+)\//);
  return match ? match[1] : null;
};

const mode = process.argv[2];

try {
  if (mode === 'index') {
    const specs = listSpecs();
    if (specs.length === 0) process.exit(0);
    emit(
      'UserPromptSubmit',
      `This repo is spec-driven (see CLAUDE.md). Specs in specs/: ${specs.join(', ')}.\n` +
        `Before building or changing one of these features, read specs/<feature>.spec.md first. ` +
        `If a change conflicts with its spec, update the spec in the same change. ` +
        `A new feature needs a new spec plus a row in the specs/README.md index.`
    );
  }

  if (mode === 'edit') {
    const input = JSON.parse((await readStdin()) || '{}');
    const filePath = input?.tool_input?.file_path;
    if (!filePath) process.exit(0);

    const relPath = path.relative(repoRoot, path.resolve(filePath));
    if (relPath.startsWith('..')) process.exit(0); // outside the repo — not our business

    // Editing a spec itself is the workflow working. Say nothing.
    if (relPath.startsWith('specs/')) process.exit(0);

    const name = specNameFor(relPath);
    if (!name) process.exit(0);

    const specPath = path.join('specs', `${name}.spec.md`);
    const exists = existsSync(path.join(repoRoot, specPath));

    emit(
      'PreToolUse',
      exists
        ? `${relPath} belongs to the "${name}" feature, which is specified in ${specPath}. ` +
            `Read that spec before this edit if you have not already, and update it in this same ` +
            `change if the edit alters documented behaviour.`
        : `${relPath} belongs to the "${name}" feature, which has NO spec at ${specPath}. ` +
            `This repo is spec-driven: write the spec (template in specs/README.md) and add its ` +
            `row to the specs/README.md index as part of this change.`
    );
  }
} catch {
  // Never let a reminder break a tool call.
}

process.exit(0);
