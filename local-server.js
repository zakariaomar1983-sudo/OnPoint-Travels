const http = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = __dirname;

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon']
]);

function resolveRequestPath(requestUrl) {
  const parsedUrl = new URL(requestUrl, `http://${HOST}:${PORT}`);
  const decodedPath = decodeURIComponent(parsedUrl.pathname);
  const normalizedPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const filePath = path.normalize(path.join(PUBLIC_DIR, normalizedPath));
  const relativePath = path.relative(PUBLIC_DIR, filePath);

  if (
    relativePath.startsWith('..') ||
    path.isAbsolute(relativePath) ||
    relativePath.startsWith('.') ||
    relativePath.includes(`${path.sep}.`)
  ) {
    return null;
  }

  return filePath;
}

const server = http.createServer(async (req, res) => {
  const filePath = resolveRequestPath(req.url || '/');

  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  try {
    const body = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    res.writeHead(200, {
      'Content-Type': contentTypes.get(ext) || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(body);
  } catch (error) {
    const statusCode = error.code === 'ENOENT' ? 404 : 500;

    res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(statusCode === 404 ? 'Not found' : 'Server error');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`OnPoint Travels is running at http://${HOST}:${PORT}`);
});
