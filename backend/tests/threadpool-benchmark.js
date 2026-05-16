#!/usr/bin/env node
/**
 * threadpool-benchmark.js
 * Measures the effect of UV_THREADPOOL_SIZE on libuv-backed async operations.
 *
 * Teammate 3 (Infrastructure)
 *
 * How it works:
 *   Node.js offloads certain async work (crypto, dns, zlib, fs) to a libuv
 *   threadpool whose default size is 4. If we fire more concurrent operations
 *   than the pool size, the extras must wait. By increasing the pool size we
 *   reduce that queuing delay.
 *
 *   This script runs N concurrent crypto.pbkdf2 calls (CPU-heavy, libuv-backed)
 *   and measures total wall-clock time at different UV_THREADPOOL_SIZE values.
 *
 * Usage:
 *   node tests/threadpool-benchmark.js
 *
 * Expected output:
 *   UV_THREADPOOL_SIZE=4  → ~X ms  (some tasks queue behind others)
 *   UV_THREADPOOL_SIZE=8  → ~Y ms  (fewer queue waits)
 *   UV_THREADPOOL_SIZE=16 → ~Z ms  (near-optimal for this workload)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Configuration ──────────────────────────────────────────────────────────

const CONCURRENT_TASKS = 16;         // Number of parallel pbkdf2 calls
const PBKDF2_ITERATIONS = 100_000;   // CPU cost per call
const POOL_SIZES = [4, 8, 16];       // Values to benchmark

// ── Write the worker script to a temp file (avoids node -e parsing issues) ─

const WORKER_SCRIPT = `
const crypto = require('crypto');

const CONCURRENT = ${CONCURRENT_TASKS};
const ITERATIONS = ${PBKDF2_ITERATIONS};

function runPbkdf2() {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2('password', 'salt', ITERATIONS, 64, 'sha512', (err, key) => {
      if (err) {
        reject(err);
      } else {
        resolve(key);
      }
    });
  });
}

async function main() {
  const start = process.hrtime.bigint();

  // Fire all tasks concurrently — they compete for the threadpool
  await Promise.all(Array.from({ length: CONCURRENT }, () => runPbkdf2()));

  const elapsed = Number(process.hrtime.bigint() - start) / 1e6; // ms
  // Output only the number so the parent can parse it
  process.stdout.write(elapsed.toFixed(2));
}

main().catch(err => { console.error(err); process.exit(1); });
`;

const tmpFile = path.join(os.tmpdir(), `threadpool_worker_${process.pid}.js`);
fs.writeFileSync(tmpFile, WORKER_SCRIPT);

// ── Runner ─────────────────────────────────────────────────────────────────

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║   AarogyaLink — UV_THREADPOOL_SIZE Benchmark (libuv)       ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log();
console.log(`  Concurrent pbkdf2 tasks : ${CONCURRENT_TASKS}`);
console.log(`  Iterations per task     : ${PBKDF2_ITERATIONS.toLocaleString()}`);
console.log(`  Pool sizes to test      : ${POOL_SIZES.join(', ')}`);
console.log();
console.log('  Running benchmarks (this may take a minute)...');
console.log();

const results = [];

for (const size of POOL_SIZES) {
  // Spawn a child process with a specific UV_THREADPOOL_SIZE
  const elapsed = execSync(`node "${tmpFile}"`, {
    env: { ...process.env, UV_THREADPOOL_SIZE: String(size) },
    encoding: 'utf-8',
    timeout: 60_000,
  }).trim();

  const ms = parseFloat(elapsed);
  results.push({ size, ms });

  const bar = '█'.repeat(Math.round(ms / 50));
  console.log(`  UV_THREADPOOL_SIZE = ${String(size).padStart(2)}  →  ${ms.toFixed(2).padStart(9)} ms  ${bar}`);
}

console.log();

// ── Speedup comparison ─────────────────────────────────────────────────────

const baseline = results[0].ms;
console.log('  ── Speedup vs default (size=4) ──');
for (const r of results) {
  const speedup = ((baseline / r.ms)).toFixed(2);
  console.log(`  Size ${String(r.size).padStart(2)}:  ${speedup}x`);
}

console.log();
console.log('  ✅ Done. Copy these numbers into threadpool_results.md');
console.log();

// Cleanup temp file
try { fs.unlinkSync(tmpFile); } catch (_) {}
