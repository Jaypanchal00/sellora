import { createServer } from 'node:http';
import { Readable } from 'node:stream';

// Standard Node-to-Web adapter for TanStack Start
const port = process.env.PORT || 10000;

async function start() {
  console.log('Starting Sellora server...');
  
  try {
    const { default: entry } = await import('./dist/server/server.js');
    console.log('Server entry loaded successfully.');

    createServer(async (req, res) => {
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
          // Handle set-cookie specifically if needed, but append works for most
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
