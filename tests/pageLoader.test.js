import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import nock from 'nock';
import { beforeEach, afterEach, describe, expect, test } from '@jest/globals';
import pageLoader from '../src/pageLoader.js';

describe('Page Loader', () => {
  let tempDir;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  });
  
  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    nock.cleanAll();
  });
  
  test('should download page and save to file', async () => {
    const url = 'https://ru.hexlet.io/courses';
    const content = '<html><body>Test page</body></html>';
    
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, content);
    
    const filepath = await pageLoader(url, tempDir);
    
    const expectedFileName = 'ru-hexlet-io-courses.html';
    const expectedPath = path.join(tempDir, expectedFileName);
    
    expect(filepath).toBe(expectedPath);
    
    const savedContent = await fs.readFile(expectedPath, 'utf-8');
    expect(savedContent).toBe(content);
  });
  
  test('should generate correct filename from URL', async () => {
    const testCases = [
      {
        url: 'https://ru.hexlet.io/courses',
        expected: 'ru-hexlet-io-courses.html',
      },
      {
        url: 'http://example.com/page.html',
        expected: 'example-com-page-html.html',
      },
      {
        url: 'https://site.com/path/to/page',
        expected: 'site-com-path-to-page.html',
      },
    ];
    
    for (const { url, expected } of testCases) {
      nock(new URL(url).origin)
        .get(new URL(url).pathname)
        .reply(200, 'content');
      
      const filepath = await pageLoader(url, tempDir);
      expect(path.basename(filepath)).toBe(expected);
    }
  });
  
  test('should handle HTTP errors', async () => {
    const url = 'https://ru.hexlet.io/non-existent';
    
    nock('https://ru.hexlet.io')
      .get('/non-existent')
      .reply(404);
    
    await expect(pageLoader(url, tempDir))
      .rejects
      .toThrow('Failed to load page: 404 Not Found');
  });
  
  test('should handle network errors', async () => {
    const url = 'https://ru.hexlet.io/courses';
    
    nock('https://ru.hexlet.io')
      .get('/courses')
      .replyWithError('Network error');
    
    await expect(pageLoader(url, tempDir))
      .rejects
      .toThrow('Failed to load page: Network error');
  });
  
  test('should use current directory when output not specified', async () => {
    const url = 'https://ru.hexlet.io/courses';
    const content = '<html><body>Test page</body></html>';
    
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, content);
    
    const originalCwd = process.cwd();
    process.chdir(tempDir);
    
    try {
      const filepath = await pageLoader(url);
      const expectedPath = path.join(tempDir, 'ru-hexlet-io-courses.html');
      expect(filepath).toBe(expectedPath);
      
      const savedContent = await fs.readFile(expectedPath, 'utf-8');
      expect(savedContent).toBe(content);
    } finally {
      process.chdir(originalCwd);
    }
  });
  
  test('should handle invalid output directory', async () => {
    const url = 'https://ru.hexlet.io/courses';
    const nonExistentDir = path.join(tempDir, 'non-existent', 'subdir');
    
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, 'content');
    
    await expect(pageLoader(url, nonExistentDir))
      .rejects
      .toThrow();
  });
});