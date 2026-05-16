# UV_THREADPOOL_SIZE Benchmark Results
> Teammate 3 (Infrastructure) · Teacher checklist: "UV_THREADPOOL_SIZE tuning (default 4 → observe → increase)"

---

## What Is UV_THREADPOOL_SIZE?

Node.js uses **libuv**, a C library that handles I/O operations asynchronously. libuv maintains a thread pool for tasks that cannot be made truly non-blocking at the OS level — including:
- File system reads/writes (`fs.readFile`, `fs.writeFile`)
- DNS lookups (`dns.lookup`)
- Crypto operations (`crypto.pbkdf2`, `bcrypt.hash`)
- **zlib compression**
- Any code explicitly run in a `worker_thread`

The default pool size is **4 threads**. This means if 5 CPU-bound or blocking I/O operations are queued simultaneously, the 5th must wait — adding latency.

**Setting `UV_THREADPOOL_SIZE=16`** allows 16 parallel such operations, reducing wait time under concurrent load.

---

## Configuration in AarogyaLink

```js
// backend/src/server.js — MUST be line 1-2, before any require() calls
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || 16;
```

Also set via `.env`:
```env
UV_THREADPOOL_SIZE=16
```

---

## How to Run the Benchmark

```bash
cd backend
node tests/threadpool-benchmark.js
```

**What it does:**
1. Runs 16 concurrent `crypto.pbkdf2` operations (CPU-bound — uses the libuv thread pool)
2. Records wall-clock time for all 16 operations to complete
3. Shows difference between UV_THREADPOOL_SIZE = 4, 8, and 16

---

## Benchmark Methodology

```
Test: 16 parallel crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512')
      ↓
Each pbkdf2 call is CPU-bound and runs in the libuv thread pool
      ↓
UV_THREADPOOL_SIZE=4   → only 4 threads active at a time → queue builds up
UV_THREADPOOL_SIZE=8   → 8 threads  → less queuing → faster wall time
UV_THREADPOOL_SIZE=16  → 16 threads → minimal queuing → fastest wall time
      ↓
Speedup = wall_clock_time_size4 / wall_clock_time_sizeN
```

---

## Results Table

| UV_THREADPOOL_SIZE | Wall-Clock Time | Speedup vs Size=4 | Notes |
|---|---|---|---|
| **4** (Node.js default) | 146.08 ms | 1.00× (baseline) | 16 tasks compete for 4 threads — heavy queuing |
| **8** | 80.20 ms | 1.82× speedup | Queue pressure cut in half |
| **16** (our setting) | 65.68 ms | 2.22× speedup | Optimal — all 16 tasks get a thread immediately |

> **Benchmark environment:** Node.js v24.12.0, WSL2 Ubuntu, 16 concurrent `crypto.pbkdf2` tasks × 100,000 iterations each. Run date: 2026-05-16.

---

## Why UV_THREADPOOL_SIZE=16 for AarogyaLink?

AarogyaLink has **three concurrent thread-pool consumers** under production load:

| Operation | Thread Pool Use | Frequency |
|---|---|---|
| `bcrypt.hash` (user login/register) | Heavy CPU | Every auth request |
| PDF generation (`pdfkit` in worker_thread) | File I/O + CPU | Per consultation |
| DNS lookups (Nodemailer SMTP) | Blocking DNS | Every email |

With the default size=4, concurrent logins + PDF generation + email sends could queue behind each other. With size=16, all three can run simultaneously without blocking the main event loop.

---

## Worker Threads vs UV Thread Pool

| | UV Thread Pool | Worker Threads |
|---|---|---|
| **Purpose** | Async I/O + crypto | CPU-bound JS code |
| **Count** | `UV_THREADPOOL_SIZE` | Controlled by `new Worker()` |
| **Use in AarogyaLink** | bcrypt, DNS, file I/O | PDF generation (pdfkit) |

Both keep the main event loop free.

---

## Event Loop Lag Proof

```bash
node tests/eventloop_lag.js
```

- **Scenario A (blocking):** PDF on main thread → event loop lag spikes (20–100ms)
- **Scenario B (worker_thread):** PDF offloaded → event loop lag near zero (<2ms)

See [`load_test_results.md`](load_test_results.md) for full results.
