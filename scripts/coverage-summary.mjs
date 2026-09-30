#!/usr/bin/env node
/**
 * Prints the coverage summary and the per-package rollup.
 *
 * `nyc`'s own table lists every compiled file including the barrel
 * `index.js` files, which are almost entirely re-exports and drag the totals
 * down for no useful signal. This reports the numbers per package, and
 * separately for the files that actually contain logic.
 *
 * Usage: node scripts/coverage-summary.mjs [--json]
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SUMMARY = join(ROOT, 'coverage', 'coverage-summary.json');
const AS_JSON = process.argv.includes('--json');

if (!existsSync(SUMMARY)) {
  console.error('No coverage summary found. Run `pnpm coverage` first.');
  process.exit(1);
}

const summary = JSON.parse(readFileSync(SUMMARY, 'utf8'));

/** A file that is nothing but `export * from './x'` carries no logic. */
const isBarrel = (file) => {
  if (!file.endsWith('index.js')) return false;
  try {
    const source = readFileSync(file.replace(/\.js$/, '.ts'), 'utf8');
    const body = source
      .split('\n')
      .filter((line) => !line.trim().startsWith('*') && !line.trim().startsWith('/*') && !line.trim().startsWith('//'))
      .join('\n');
    return !/[a-zA-Z]/.test(body.replace(/export\s+\*?\s*from\s*['"][^'"]+['"];?/g, ''));
  } catch {
    return false;
  }
};

const entries = Object.entries(summary).filter(([file]) => file !== 'total');
const total = summary.total;

const pct = (value) => `${value.pct}%`;

const logic = entries.filter(([file]) => !isBarrel(file));
const barrels = entries.filter(([file]) => isBarrel(file));

/** Aggregates a set of per-file summaries. */
function rollup(files) {
  if (!files.length) return { statements: 0, branches: 0, functions: 0, lines: 0, count: 0 };
  const sum = (key) => files.reduce((total_, [, s]) => total_ + s[key].total, 0);
  const covered = (key) => files.reduce((total_, [, s]) => total_ + s[key].covered, 0);
  const ratio = (c, t) => (t === 0 ? 100 : (c / t) * 100);
  return {
    count: files.length,
    statements: ratio(covered('statements'), sum('statements')),
    branches: ratio(covered('branches'), sum('branches')),
    functions: ratio(covered('functions'), sum('functions')),
    lines: ratio(covered('lines'), sum('lines')),
  };
}

/** Reports a path relative to the repository root, with forward slashes. */
const entry = (file) => file.replace(/\\/g, '/').replace(new RegExp(`^${ROOT.replace(/\\/g, '/')}/`), '');

const report = {
  total: {
    statements: total.statements.pct,
    branches: total.branches.pct,
    functions: total.functions.pct,
    lines: total.lines.pct,
  },
  logic: rollup(logic),
  barrels: rollup(barrels),
  files: logic
    .map(([file, s]) => ({
      file: entry(file),
      statements: s.statements.pct,
      branches: s.branches.pct,
      functions: s.functions.pct,
      lines: s.lines.pct,
    }))
    .sort((a, b) => a.statements - b.statements),
};

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const row = (label, r) =>
  `${label.padEnd(22)}${`${r.statements.toFixed(1)}%`.padStart(9)}${`${r.branches.toFixed(1)}%`.padStart(9)}${`${r.functions.toFixed(1)}%`.padStart(9)}${`${r.lines.toFixed(1)}%`.padStart(9)}`;

console.log(`  ${'scope'.padEnd(22)}${'statements'.padStart(9)}${'branches'.padStart(9)}${'functions'.padStart(9)}${'lines'.padStart(9)}`);
console.log(`  ${'-'.repeat(58)}`);
console.log(`  ${row('all files', { statements: total.statements.pct, branches: total.branches.pct, functions: total.functions.pct, lines: total.lines.pct })}`);
console.log(`  ${row('logic only', report.logic)}`);
console.log(`  ${row('re-export barrels', report.barrels)} (${report.barrels.count} files, not meaningful)`);

console.log(`\n  Lowest coverage among files containing logic:`);
for (const file of report.files.slice(0, 8)) {
  const flag = file.statements < 90 ? '  <<' : '';
  console.log(`    ${file.statements.toFixed(1).padStart(6)}%  ${file.file}${flag}`);
}
console.log('');
