import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer as createNetServer } from 'node:net';
import { createServer } from 'vite';

let server;
let baseUrl;

before(async () => {
  const port = await new Promise((resolve, reject) => {
    const netServer = createNetServer();
    netServer.listen(0, '127.0.0.1', () => {
      const selectedPort = netServer.address().port;
      netServer.close(error => error ? reject(error) : resolve(selectedPort));
    });
  });
  server = await createServer({
    configFile: fileURLToPath(new URL('../vite.config.js', import.meta.url)),
    server: { host: '127.0.0.1', port, strictPort: true },
  });
  await server.listen();
  const address = server.httpServer.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await server?.close();
});

for (const route of ['/register', '/login', '/admin-login']) {
  test(`direct navigation to ${route} serves the SPA`, async () => {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /text\/html/);
    const html = await response.text();
    assert.match(html, /<div id="root"><\/div>/);
    assert.match(html.toLowerCase(), /src\/main\.jsx/);
  });
}

test('auth navigation targets registered routes', async () => {
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const welcome = await readFile(new URL('../src/pages/Welcome.jsx', import.meta.url), 'utf8');
  const authPages = await readFile(new URL('../src/pages/AuthPages.jsx', import.meta.url), 'utf8');

  assert.match(app, /path="\/register"/);
  assert.match(app, /path="\/login"/);
  assert.match(app, /path="\/admin-login"/);
  assert.match(welcome, /navigate\('\/admin-login'\)/);
  assert.match(authPages, /to="\/register"[^>]*>[\s\S]*?Sign Up/);
});
