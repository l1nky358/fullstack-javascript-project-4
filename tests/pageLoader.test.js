import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import nock from 'nock';
import { beforeEach, afterEach, describe, expect, test } from '@jest/globals';
import pageLoader from '../src/pageLoader.js';

const readFile = async (filePath) => {
  return fs.readFile(filePath, 'utf-8');
};

describe('Page Loader - Error Handling', () => {
  let tempDir;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    nock.cleanAll();
  });
  
  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    nock.cleanAll();
  });

  test('should throw error for invalid URL', async () => {
    const invalidUrls = [
      'not-a-url',
      'ftp://example.com',
      'example.com',
      'http://',
      'https://',
      ''
    ];
    
    for (const url of invalidUrls) {
      await expect(pageLoader(url, tempDir))
        .rejects
        .toThrow(/Invalid URL/);
    }
  });

  test('should handle 404 Not Found error', async () => {
    const url = 'https://example.com/non-existent';
    
    nock('https://example.com')
      .get('/non-existent')
      .reply(404, 'Not Found');
    
    await expect(pageLoader(url, tempDir))
      .rejects
      .toThrow('Failed to load page: 404 Not Found');
  });

  test('should handle 403 Forbidden error', async () => {
    const url = 'https://example.com/forbidden';
    
    nock('https://example.com')
      .get('/forbidden')
      .reply(403, 'Forbidden');
    
    await expect(pageLoader(url, tempDir))
      .rejects
      .toThrow('Failed to load page: 403 Forbidden');
  });

  test('should handle 500 Internal Server Error', async () => {
    const url = 'https://example.com/error';
    
    nock('https://example.com')
      .get('/error')
      .reply(500, 'Server Error');
    
    await expect(pageLoader(url, tempDir))
      .rejects
      .toThrow('Failed to load page: 500 Internal Server Error');
  });

  test('should handle DNS lookup error', async () => {
    const url = 'https://non-existent-domain.com';
    
    nock('https://non-existent-domain.com')
      .get('/')
      .replyWithError({
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND non-existent-domain.com'
      });
    
    await expect(pageLoader(url, tempDir))
      .rejects
      .toThrow('Failed to load page - host not found: non-existent-domain.com');
  });

  test('should handle connection refused error', async () => {
    const url = 'https://example.com:81';
    
    nock('https://example.com:81')
      .get('/')
      .replyWithError({
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED 93.184.216.34:81'
      });
    
    await expect(pageLoader(url, tempDir))
      .rejects
      .toThrow('Failed to load page - connection refused: example.com:81');
  });

  test('should handle timeout error', async () => {
    const url = 'https://example.com/slow';
    
    nock('https://example.com')
      .get('/slow')
      .replyWithError({
        code: 'ETIMEDOUT',
        message: 'timeout of 5000ms exceeded'
      });
    
    await expect(pageLoader(url, tempDir))
      .rejects
      .toThrow('Failed to load page - timeout: https://example.com/slow');
  });

  test('should throw error when output directory does not exist', async () => {
    const url = 'https://example.com/page';
    const nonExistentDir = path.join(tempDir, 'non-existent', 'deep', 'path');
    
    nock('https://example.com')
      .get('/page')
      .reply(200, '<html></html>');
    
    await expect(pageLoader(url, nonExistentDir))
      .rejects
      .toThrow(`Output directory does not exist: ${nonExistentDir}`);
  });

  test('should throw error when output directory is not writable', async () => {
    const url = 'https://example.com/page';
    const readOnlyDir = path.join(tempDir, 'readonly');
    await fs.mkdir(readOnlyDir);
    await fs.chmod(readOnlyDir, 0o444);
    
    nock('https://example.com')
      .get('/page')
      .reply(200, '<html></html>');
    
    if (process.platform !== 'win32') {
      await expect(pageLoader(url, readOnlyDir))
        .rejects
        .toThrow(`No write permission for output directory: ${readOnlyDir}`);
    }
    
    await fs.chmod(readOnlyDir, 0o755);
  });

  test('should throw error when output path is a file', async () => {
    const url = 'https://example.com/page';
    const filePath = path.join(tempDir, 'file.txt');
    await fs.writeFile(filePath, 'content');
    
    nock('https://example.com')
      .get('/page')
      .reply(200, '<html></html>');
    
    await expect(pageLoader(url, filePath))
      .rejects
      .toThrow(`Output path is not a directory: ${filePath}`);
  });

  test('should handle resource 404 error gracefully', async () => {
    const url = 'https://example.com/page';
    const htmlContent = '<img src="/missing.jpg">';
    
    nock('https://example.com')
      .get('/page')
      .reply(200, htmlContent);
    
    nock('https://example.com')
      .get('/missing.jpg')
      .reply(404, 'Not Found');
    
    const filepath = await pageLoader(url, tempDir);
    const savedHtml = await readFile(filepath);
    expect(savedHtml).toContain('/missing.jpg');
    expect(savedHtml).not.toContain('_files');
  });

  test('should handle resource network error gracefully', async () => {
    const url = 'https://example.com/page';
    const htmlContent = '<script src="/app.js"></script>';
    
    nock('https://example.com')
      .get('/page')
      .reply(200, htmlContent);
    
    nock('https://example.com')
      .get('/app.js')
      .replyWithError('Network error');
    
    const filepath = await pageLoader(url, tempDir);
    const savedHtml = await readFile(filepath);
    expect(savedHtml).toContain('/app.js');
  });

  test('should handle multiple resource failures', async () => {
    const url = 'https://example.com/page';
    const htmlContent = `
      <img src="/img1.jpg">
      <img src="/img2.jpg">
      <link rel="stylesheet" href="/style.css">
    `;
    
    nock('https://example.com')
      .get('/page')
      .reply(200, htmlContent);
    
    nock('https://example.com')
      .get('/img1.jpg')
      .reply(404);
    nock('https://example.com')
      .get('/img2.jpg')
      .reply(500);
    nock('https://example.com')
      .get('/style.css')
      .replyWithError('ECONNREFUSED');
    
    const filepath = await pageLoader(url, tempDir);
    const savedHtml = await readFile(filepath);
    expect(savedHtml).toContain('/img1.jpg');
    expect(savedHtml).toContain('/img2.jpg');
    expect(savedHtml).toContain('/style.css');
    
    const filesDir = path.join(tempDir, 'example-com-page_files');
    await expect(fs.stat(filesDir)).rejects.toThrow();
  });

  test('should download successful resources and skip failed ones', async () => {
    const url = 'https://example.com/page';
    const htmlContent = `
      <img src="/good.jpg">
      <img src="/bad.jpg">
      <link rel="stylesheet" href="/styles.css">
    `;
    
    nock('https://example.com')
      .get('/page')
      .reply(200, htmlContent);
    
    nock('https://example.com')
      .get('/good.jpg')
      .reply(200, Buffer.from('good'));
    
    nock('https://example.com')
      .get('/bad.jpg')
      .reply(404);
    
    nock('https://example.com')
      .get('/styles.css')
      .reply(200, 'body {}');
    
    const filepath = await pageLoader(url, tempDir);
    const savedHtml = await readFile(filepath);
    expect(savedHtml).toContain('example-com-page_files/example-com-good.jpg');
    expect(savedHtml).toContain('example-com-page_files/example-com-styles.css');
    expect(savedHtml).toContain('/bad.jpg');
    
    const filesDir = path.join(tempDir, 'example-com-page_files');
    const files = await fs.readdir(filesDir);
    expect(files).toContain('example-com-good.jpg');
    expect(files).toContain('example-com-styles.css');
    expect(files).not.toContain('example-com-bad.jpg');
    expect(files).toHaveLength(2);
  });

  test('should throw error when cannot write HTML file', async () => {
    const url = 'https://example.com/page';
    
    nock('https://example.com')
      .get('/page')
      .reply(200, '<html></html>');
    
    const badPath = path.join(tempDir, 'non-existent', 'file.html');
    
    await expect(pageLoader(url, path.dirname(badPath)))
      .rejects
      .toThrow(/Failed to save HTML file/);
  });

  test('should handle empty HTML page', async () => {
    const url = 'https://example.com/empty';
    
    nock('https://example.com')
      .get('/empty')
      .reply(200, '');
    
    const filepath = await pageLoader(url, tempDir);
    const savedContent = await readFile(filepath);
    expect(savedContent).toBe('');
  });

  test('should handle malformed HTML', async () => {
    const url = 'https://example.com/malformed';
    const malformedHtml = '<div><span>Unclosed tags';
    
    nock('https://example.com')
      .get('/malformed')
      .reply(200, malformedHtml);
    
    const filepath = await pageLoader(url, tempDir);
    const savedContent = await readFile(filepath);
    expect(savedContent).toContain('Unclosed tags');
  });

  test('should handle redirects', async () => {
    const url = 'https://example.com/redirect';
    
    nock('https://example.com')
      .get('/redirect')
      .reply(302, '', {
        Location: '/final'
      })
      .get('/final')
      .reply(200, '<html><body>Final page</body></html>');
    
    const filepath = await pageLoader(url, tempDir);
    const savedContent = await readFile(filepath);
    expect(savedContent).toContain('Final page');
  });
});

describe('Page Loader - Success Cases', () => {
  let tempDir;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    nock.cleanAll();
  });
  
  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    nock.cleanAll();
  });

  test('should successfully download page with all resources', async () => {
    const url = 'https://example.com/success';
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
      .get('/success')
      .reply(200, htmlContent)
      .get('/style.css')
      .reply(200, 'body {}')
      .get('/image.png')
      .reply(200, Buffer.from('png'))
      .get('/script.js')
      .reply(200, 'console.log()');
    
    const filepath = await pageLoader(url, tempDir);
    
    expect(filepath).toBe(path.join(tempDir, 'example-com-success.html'));
    
    const filesDir = path.join(tempDir, 'example-com-success_files');
    const files = await fs.readdir(filesDir);
    expect(files).toHaveLength(3);
  });
});