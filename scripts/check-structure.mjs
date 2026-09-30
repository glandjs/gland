#!/usr/bin/env node
/**
 * Verifies the repository layout declared in `psx.yml`.
 *
 * psx 0.x validates its own built-in rules (README, LICENSE, tsconfig, …) but
 * does not yet evaluate the `custom` block, so the expected monorepo structure
 * is checked here instead. The contract therefore lives in one place —
 * `psx.yml` — and is enforced regardless of which tool reads it.
 *
 * Parses `psx.yml` with no dependencies: the file is a known-shape document we
 * wrote ourselves, so a full YAML parser would be more machinery than the job
 * needs.
 *
 * Usage: node scripts/check-structure.mjs [--fix]
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = join(ROOT, 'psx.yml');
const FIX = process.argv.includes('--fix');

/**
 * Reads the leaf paths out of `custom.files` and `custom.folders`.
 *
 * Only the two shapes this repository uses are handled: a `- path:` entry with
 * a nested `structure` map, and a list of bare file paths. Nesting is tracked
 * by indentation: a `structure:` key belongs to the most recent `- path:`
 * entry, and only lines indented past it are that entry's leaves.
 */
function parseExpectations(source) {
  const files = new Set();
  const folders = new Map();

  const lines = source.split(/\r?\n/);
  let section = null;
  let currentFolder = null;
  let currentIndent = 0;
  let insideStructure = false;
  /** Open nested `name:` levels inside the current `structure:` block. */
  const pathStack = [];

  for (const line of lines) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;

    // A line with no leading whitespace is a new top-level key, which closes
    // whatever section we were in.
    if (!/^\s/.test(line)) {
      section = null;
      currentFolder = null;
      continue;
    }

    const indent = line.length - line.trimStart().length;

    if (/^\s*files:\s*$/.test(line)) {
      section = 'files';
      currentFolder = null;
      continue;
    }
    if (/^\s*folders:\s*$/.test(line)) {
      section = 'folders';
      currentFolder = null;
      continue;
    }
    if (/^\s*structure:\s*$/.test(line)) {
      insideStructure = true;
      pathStack.length = 0;
      continue;
    }

    // Quotes are optional in YAML, and Prettier normalises them, so accept
    // both `'...'` and `"..."`.
    const entry = /^\s*-\s*path:\s*['"]?(.+?)['"]?\s*$/.exec(line);
    if (entry) {
      if (section === 'files') {
        files.add(entry[1].replace(/^\//, ''));
      } else if (section === 'folders') {
        currentFolder = entry[1];
        currentIndent = indent;
        insideStructure = false;
        pathStack.length = 0;
        folders.set(currentFolder, new Set());
      }
      continue;
    }

    // A `- path:` at a shallower indent, or any sibling list item, ends the
    // current folder entry. `- path:` is itself handled above, so this only
    // needs to catch lines that are neither a leaf nor a new entry.
    if (section === 'folders' && currentFolder && insideStructure && indent <= currentIndent) {
      currentFolder = null;
      insideStructure = false;
      pathStack.length = 0;
      continue;
    }

    if (section !== 'folders' || !currentFolder || !insideStructure) continue;

    // Drop any open level that is not an ancestor of the current indent, so
    // the stack always describes the path to this line.
    const unwind = (indent) => {
      while (pathStack.length && pathStack[pathStack.length - 1].indent >= indent) {
        pathStack.pop();
      }
    };

    // A leaf carries an extension, e.g. `index.ts: {}`. A bare `name:` opens a
    // nested level. The extension is what keeps `decorators:` from being
    // mistaken for a file.
    const leaf = /^(\s*)([A-Za-z0-9_.-]+\.[A-Za-z0-9]+):\s*\{\}\s*$/.exec(line);
    if (leaf) {
      unwind(leaf[1].length);
      folders.get(currentFolder).add([...pathStack.map((l) => l.name), leaf[2]].join('/'));
      continue;
    }

    const level = /^(\s*)([A-Za-z0-9_.-]+):\s*$/.exec(line);
    if (level) {
      unwind(level[1].length);
      pathStack.push({ indent: level[1].length, name: level[2] });
    }
  }

  return { files, folders };
}

const source = readFileSync(CONFIG, 'utf8');
const { files, folders } = parseExpectations(source);

if (files.size === 0 && folders.size === 0) {
  console.error('Could not read any expectations from psx.yml — has its shape changed?');
  process.exit(1);
}

const missing = [];

for (const file of files) {
  if (!existsSync(join(ROOT, file))) missing.push(file);
}

for (const [folder, leaves] of folders) {
  if (!existsSync(join(ROOT, folder))) {
    missing.push(`${folder}/`);
    continue;
  }
  for (const leaf of leaves) {
    if (!existsSync(join(ROOT, folder, leaf))) missing.push(`${folder}/${leaf}`);
  }
}

// --- report ----------------------------------------------------------------

const checked = files.size + [...folders.values()].reduce((n, set) => n + set.size, 0);

if (!missing.length) {
  console.log(`Structure OK — ${checked} path(s) declared in psx.yml are present.`);
  process.exit(0);
}

if (FIX) {
  for (const entry of missing) {
    const target = join(ROOT, entry);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, '', { flag: 'a' });
    console.log(`created  ${entry}`);
  }
  console.log(`\nCreated ${missing.length} missing path(s).`);
  process.exit(0);
}

console.error(`Structure check failed — ${missing.length} of ${checked} declared path(s) missing:\n`);
for (const entry of missing) console.error(`  missing  ${entry}`);
console.error('\nRun `pnpm run check:structure --fix` to create the missing paths.');
process.exit(1);
