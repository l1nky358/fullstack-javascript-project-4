import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('entry point', () => {
  it('should export pageLoader function', async () => {
    const { default: pageLoader } = await import('./index.js');
    expect(pageLoader).toBeDefined();
    expect(typeof pageLoader).toBe('function');
  });

  it('should have bin file with shebang', () => {
    const binPath = path.join(__dirname, '../bin/page-loader.js');
    const content = fs.readFileSync(binPath, 'utf-8');
    expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
  });
});
