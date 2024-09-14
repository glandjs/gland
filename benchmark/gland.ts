import http from 'http';
import gland, { Context, NxtFunction } from '../dist';
import { performance } from 'perf_hooks';

const PORT = 3000;
const NUM_REQUESTS = 1000000;

async function runBenchmark() {
  const server = new gland();
  try {
    server.use('/', async (ctx: Context, nxt: NxtFunction) => {
      ctx.write('Middleware OK\n');
      ctx.end();
    });
    await startServer(server);
    console.log('Server running on port', PORT);

    // Add a short delay to ensure the server is fully started
    await new Promise((resolve) => setTimeout(resolve, 500));

    const startTime = performance.now();
    await benchmarkRequests(NUM_REQUESTS, 30);
    const endTime = performance.now();

    const duration = endTime - startTime;
    console.log(`Processed ${NUM_REQUESTS} requests in ${duration.toFixed(2)}ms`);
    console.log(`Average time per request: ${(duration / NUM_REQUESTS).toFixed(2)}ms`);
  } catch (err) {
    console.error('Error running benchmark:', err);
  } finally {
    server.close(() => {
      console.log('Server closed after benchmarking');
    });
  }
}

function startServer(server: gland): Promise<void> {
  return new Promise((resolve, reject) => {
    server.listen(PORT, 'localhost', () => {
      resolve();
    });
  });
}

async function benchmarkRequests(numRequests: number, batchSize: number): Promise<void> {
  for (let i = 0; i < numRequests; i += batchSize) {
    const batch = Array.from({ length: Math.min(batchSize, numRequests - i) }, () => makeRequest());
    await Promise.all(batch);
  }
}

function makeRequest(): Promise<number> {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const end = performance.now();
        resolve(end - start);
      });
    });

    req.on('error', (err) => {
      console.error(`Request error: ${err.message}`);
      reject(err);
    });

    req.end();
  });
}

runBenchmark();
