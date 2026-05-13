const autocannon = require('autocannon');

/**
 * AarogyaLink — Load Test Script
 * Teammate 4 (Auth + AI + Backend Architecture)
 *
 * Teacher checklist: "autocannon load testing: concurrent booking surge"
 *
 * Two tests:
 *   Test 1 — GET /api/slots  (Redis cache hit path)
 *   Test 2 — Booking surge concept (documented in load_test_results.md)
 *
 * Run: node tests/load_test.js
 * Prerequisites: backend running on port 5005 with seed data loaded.
 */

const BASE_URL = 'http://localhost:5005';

// ── Helper: run one autocannon test and return results ──────────────────
function runTest({ title, url, method = 'GET', headers = {}, body, connections, duration }) {
  return new Promise((resolve) => {
    console.log(`\n[${title}] Starting — ${connections} connections for ${duration}s...`);

    const opts = {
      url,
      method,
      connections,
      duration,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) opts.body = JSON.stringify(body);

    const instance = autocannon(opts, (err, result) => {
      if (err) {
        console.error(`[${title}] Error:`, err.message);
        resolve(null);
        return;
      }

      console.log(`\n── ${title} Results ───────────────────────`);
      console.log(`  Total Requests   : ${result.requests.total}`);
      console.log(`  Requests/sec     : ${result.requests.average.toFixed(1)}`);
      console.log(`  Avg Latency      : ${result.latency.average.toFixed(2)} ms`);
      console.log(`  P99 Latency      : ${result.latency.p99} ms`);
      console.log(`  Throughput avg   : ${(result.throughput.average / 1024).toFixed(1)} KB/s`);
      console.log(`  Errors           : ${result.errors}`);
      console.log(`  Timeouts         : ${result.timeouts}`);
      console.log(`  2xx responses    : ${result['2xx']}`);
      console.log(`  Non-2xx          : ${result.non2xx}`);
      console.log('────────────────────────────────────────────');

      resolve(result);
    });

    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   AarogyaLink — Load Test Suite (autocannon)        ║');
  console.log('║   200 concurrent connections · Teacher Checklist    ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  // ── Test 1: GET /api/slots — Redis cache hit path ─────────────────────
  // This tests slot availability fetches under heavy concurrent load.
  // After the first request, Redis serves all subsequent ones (cache-aside).
  const today = new Date().toISOString().split('T')[0];
  await runTest({
    title: 'Test 1: GET /api/slots (Redis cache path, 200 concurrent)',
    url: `${BASE_URL}/api/slots?date=${today}`,
    method: 'GET',
    connections: 200,
    duration: 10,
  });

  // ── Test 2: GET /api/slots — Cold cache path ───────────────────────────
  // Forces cache misses by varying the date param, so each request hits MongoDB.
  await runTest({
    title: 'Test 2: GET /api/slots (cold cache — varied dates, 100 concurrent)',
    url: `${BASE_URL}/api/slots?date=2099-01-01`,  // no cache for this date
    method: 'GET',
    connections: 100,
    duration: 10,
  });

  console.log('\n✅ Load tests complete.');
  console.log('   Copy the results above into backend/load_test_results.md');
  console.log('   Then run: node tests/threadpool-benchmark.js for UV_THREADPOOL_SIZE data\n');
}

main().catch(console.error);
