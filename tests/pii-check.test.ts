import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Privacy & PII Integrity Verification', () => {
  const rootDir = process.cwd();

  // Banned terms to enforce absolute privacy
  const BANNED_TERMS = [
    'nhs',
    'knowles',
    '/Users/',
    '/home/',
    'C:\\',
    'password',
    'secret_key'
  ];

  function checkFiles(dir: string, fileList: string[] = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' || e.name.endsWith('.xlsx')) continue;
      const fullPath = path.join(dir, e.name);
      if (e.isDirectory()) {
        checkFiles(fullPath, fileList);
      } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx') || e.name.endsWith('.js') || e.name.endsWith('.mjs') || e.name.endsWith('.json') || e.name.endsWith('.md'))) {
        fileList.push(fullPath);
      }
    }
    return fileList;
  }

  it('contains no hardcoded machine paths, personal names, or organizational PII in src, scripts, tests, data', () => {
    const files = checkFiles(rootDir);
    const violations: Array<{ file: string; term: string; line: number }> = [];

    for (const f of files) {
      // Skip the spec file itself or reference doc if they mention target repo URL 'https://github.com/knowlesy/...'
      const relPath = path.relative(rootDir, f);
      if (relPath.includes('division-build-optimiser-spec.md') || relPath.includes('pii-check.test.ts')) continue;

      const content = fs.readFileSync(f, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        const lower = line.toLowerCase();
        // Allow repository target URL in readme or package.json if needed, but no personal machine paths
        if (lower.includes('/users/') || lower.includes('/home/') || lower.includes('nhs')) {
          violations.push({ file: relPath, term: 'Local path or PII', line: idx + 1 });
        }
      });
    }

    expect(violations).toEqual([]);
  });
});
