import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import nock from 'nock';
import { beforeEach, afterEach, describe, expect, test, jest } from '@jest/globals';
import pageLoader from '../src/pageLoader.js';

jest.mock('listr2', () => ({
  Listr: class MockListr {
    constructor(tasks) {
      this.tasks = tasks;
    }
    
    async run() {
      const ctx = {};
      for (const task of this.tasks) {
        if (task.task) {
          await task.task(ctx);
        }
      }
      return ctx;
    }
  }
}));

const readFile = async (filePath) => {
  return fs.readFile(filePath, 'utf-8');
};

describe('Page Loader', () => {
  let tempDir;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    nock.cleanAll();
  });
  
  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    nock.cleanAll();
  });

  test('should download page with resources and show progress', async () => {
    const url = 'https://example.com/page';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="/style.css">
        </head>
        <body>
          <img src="/image.png">
          <script src="/script.js"></script>
        </body>
      </html>
    `;
    
    nock('https://example.com')
      .get('/page')
      .reply(200, htmlContent)
      .get('/style.css')
      .reply(200, 'body {}')
      .get('/image.png')
      .reply(200, Buffer.from('png'))
      .get('/script.js')
      .reply(200, 'console.log()');
    
    const filepath = await pageLoader(url, tempDir);
    
    expect(filepath).toBe(path.join(tempDir, 'example-com-page.html'));
    
    const filesDir = path.join(tempDir, 'example-com-page_files');
    const files = await fs.readdir(filesDir);
    expect(files).toHaveLength(3);
    expect(files).toContain('example-com-style.css');
    expect(files).toContain('example-com-image.png');
    expect(files).toContain('example-com-script.js');
  });
});