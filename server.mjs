import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');

// Parse port from env or args (-p 3000 or --port 3000)
function getPort() {
  const args = process.argv.slice(2);
  const pIndex = args.findIndex((arg) => arg === '-p' || arg === '--port');
  if (pIndex !== -1 && args[pIndex + 1]) {
    return parseInt(args[pIndex + 1], 10);
  }
  if (process.env.PORT) {
    return parseInt(process.env.PORT, 10);
  }
  return 3000;
}

const PORT = getPort();
const HOST = '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  let pathname = decodeURIComponent(req.url.split('?')[0]);

  // Strip leading /staging prefix if present (Caddy handle_path already strips, but this ensures both work)
  if (pathname === '/staging') {
    res.statusCode = 301;
    res.setHeader('Location', '/staging/');
    res.end();
    return;
  }
  if (pathname.startsWith('/staging/')) {
    pathname = pathname.slice('/staging'.length);
  }

  // Normalize path
  let relativePath = pathname.replace(/^\/+/, '');
  let filePath = path.join(DIST_DIR, relativePath);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  // If path is a directory or empty, check for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      filePath = indexPath;
    }
  } else if (!fs.existsSync(filePath)) {
    // Check if path.html exists (e.g. /member -> /member.html or /member/index.html)
    if (fs.existsSync(`${filePath}.html`)) {
      filePath = `${filePath}.html`;
    } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    }
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // Fallback to 404 or root index.html
    const notFoundPage = path.join(DIST_DIR, '404.html');
    if (fs.existsSync(notFoundPage)) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      fs.createReadStream(notFoundPage).pipe(res);
      return;
    }
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);

  // Cache headers
  if (pathname.startsWith('/_astro/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (ext === '.html') {
    res.setHeader('Cache-Control', 'no-cache');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }

  if (req.method === 'HEAD') {
    const stat = fs.statSync(filePath);
    res.setHeader('Content-Length', stat.size);
    res.end();
    return;
  }

  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    res.statusCode = 500;
    res.end('Internal Server Error');
  });
  stream.pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`MUSES Staging Server listening on http://${HOST}:${PORT}`);
});
