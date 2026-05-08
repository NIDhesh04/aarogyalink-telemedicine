# UV_THREADPOOL_SIZE — Tuning Measurement & Analysis

> Teammate 3 (Infrastructure) · AarogyaLink Telemedicine Project

---

## 1. Background: How libuv Handles Async I/O

Node.js is single-threaded for JavaScript execution but relies on **libuv** to perform certain expensive operations asynchronously. libuv maintains an internal **threadpool** to offload work that cannot be handled by OS-level async primitives (e.g., `epoll`/`kqueue`).

Operations routed to the libuv threadpool include:

| Category | Examples |
|---|---|
| **Crypto** | `pbkdf2`, `scrypt`, `randomBytes`, `crypto.sign` |
| **File system** | `fs.readFile`, `fs.writeFile`, `fs.stat` |
| **DNS** | `dns.lookup` (not `dns.resolve`, which uses c-ares) |
| **Compression** | `zlib.deflate`, `zlib.gzip` |

By default, `UV_THREADPOOL_SIZE = 4`. If more than 4 of these operations are in-flight simultaneously, the extras **queue** and wait for a thread to become available. This introduces latency under concurrent load.

---

## 2. Why This Matters for AarogyaLink

Our PDF generation pipeline uses **pdfkit**, which performs synchronous in-memory rendering followed by `fs.createWriteStream` file I/O. When a doctor completes a consultation, the system:

1. Queues a BullMQ job
2. The BullMQ consumer spawns a native **worker thread** (`worker_threads`)
3. Inside that thread, pdfkit generates the PDF and writes it to disk

With the default pool size of 4, if multiple doctors complete consultations simultaneously, the file I/O portion of PDF generation competes for threadpool slots with other `fs` and `crypto` operations (like JWT `sign`/`verify` and `bcrypt` password hashing).

Setting `UV_THREADPOOL_SIZE = 16` in `server.js` ensures that up to 16 of these operations can proceed in parallel, reducing queue wait times.

---

## 3. Benchmark Methodology

**Script:** `backend/tests/threadpool-benchmark.js`

The benchmark fires **16 concurrent `crypto.pbkdf2` calls** (100,000 iterations each) — a CPU-heavy operation routed through the libuv threadpool. Each test run uses a child process with a specific `UV_THREADPOOL_SIZE` to ensure clean isolation.

```
Concurrent pbkdf2 tasks : 16
Iterations per task     : 100,000
Key length              : 64 bytes (SHA-512)
```

This simulates a worst-case scenario where many blocking operations compete for threadpool slots simultaneously — similar to a burst of concurrent bookings + PDF generations.

---

## 4. Benchmark Results

> **Instructions:** Run the benchmark and replace the placeholder values below.
>
> ```bash
> cd backend
> node tests/threadpool-benchmark.js
> ```

| UV_THREADPOOL_SIZE | Wall-Clock Time (ms) | Speedup vs Default |
|---|---|---|
| **4** (default) | ___ ms | 1.00x |
| **8** | ___ ms | ___x |
| **16** (our setting) | ___ ms | ___x |

### Expected Behavior

- **Size 4:** 16 tasks compete for 4 threads → 4 "rounds" of execution → ~4x the single-task time.
- **Size 8:** 16 tasks / 8 threads → 2 rounds → ~2x the single-task time.
- **Size 16:** 16 tasks / 16 threads → 1 round → near single-task time.

The improvement is most dramatic going from 4 → 8 (halves the wait). Going from 8 → 16 continues to help but with diminishing returns depending on CPU cores.

---

## 5. Trade-offs

| Factor | Small Pool (4) | Large Pool (16+) |
|---|---|---|
| Memory | Lower (fewer OS threads) | Higher (~1 MB stack per thread) |
| Context switching | Minimal | Moderate on low-core machines |
| Throughput under load | Limited by queuing | Higher parallelism |
| Idle overhead | Negligible | Threads stay alive but idle |

### Our Decision

We set `UV_THREADPOOL_SIZE = 16` because:

1. **Concurrent PDF generation** is a core requirement (multiple doctors completing consults).
2. **JWT operations** (`sign`/`verify`) happen on every authenticated request and also use the threadpool via OpenSSL.
3. Our deployment target (Docker container) typically gets 2–4 vCPUs, which can keep 16 threads busy without excessive context switching.
4. The ~16 MB additional memory cost (16 threads × ~1 MB stack) is negligible for a server process.

---

## 6. Where This Is Configured

```js
// backend/src/server.js — Line 2
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || 16;
```

> **Important:** `UV_THREADPOOL_SIZE` must be set **before** any libuv I/O occurs (i.e., before `require('fs')` or `require('crypto')` are first called). Setting it in `server.js` at the top of the file ensures this.

---

## 7. References

- [Node.js docs — UV_THREADPOOL_SIZE](https://nodejs.org/api/cli.html#uv_threadpool_sizesize)
- [libuv design overview — Thread pool](https://docs.libuv.org/en/v1.x/design.html#the-i-o-loop)
- [Node.js Crypto module — threadpool usage](https://nodejs.org/api/crypto.html)

---

*AarogyaLink · MERN Stack BTech · Project 11*
