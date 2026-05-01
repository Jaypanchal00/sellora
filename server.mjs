import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { join } from 'node:path';

// Standard Node-to-Web adapter for TanStack Start
const port = process.env.PORT || 10000;

async function start() {
  console.log('Starting Sellora server...');
  
  try {
    let serverPath = join(process.cwd(), 'dist', 'server', 'server.js');
    try {
      await import('node:fs/promises').then(fs => fs.access(serverPath));
    } catch (e) {
      serverPath = join(process.cwd(), 'dist', 'server', 'index.js');
    }
    
    console.log(`Loading server from: ${serverPath}`);
    const { default: entry } = await import(serverPath);
    console.log('Server entry loaded successfully.');

    const clientDir = join(process.cwd(), 'dist', 'client');

    createServer(async (req, res) => {
      // 1. Handle static files from dist/client
      const filePath = join(clientDir, req.url === '/' ? 'index.html' : req.url);
      try {
        const stats = await import('node:fs/promises').then(fs => fs.stat(filePath));
        if (stats.isFile()) {
          const content = await import('node:fs/promises').then(fs => fs.readFile(filePath));
          const ext = filePath.split('.').pop();
          const mimeTypes = {
            html: 'text/html',
            js: 'application/javascript',
            css: 'text/css',
            png: 'image/png',
            jpg: 'image/jpeg',
            svg: 'image/svg+xml',
            ico: 'image/x-icon',
          };
          res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
          res.end(content);
          return;
        }
      } catch (e) {
        // Not a static file, continue to TanStack handler
      }

      // 2. Handle TanStack Start request
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const url = new URL(req.url, `${protocol}://${host}`);
      
      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? Readable.toWeb(req) : null,
        duplex: 'half'
      });

      try {
        const response = await entry.fetch(request);
        
        res.statusCode = response.status;
        response.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });
        
        if (response.body) {
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        }
        res.end();
      } catch (err) {
        console.error('Request handler error:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }).listen(port, '0.0.0.0', () => {
      console.log(`Sellora is live at http://0.0.0.0:${port}`);
    });
  } catch (err) {
    console.error('Failed to load server entry:', err);
    process.exit(1);
  }
}

start();
