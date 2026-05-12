# AarogyaLink — Remaining Tasks Per Teammate

> Last updated: 2026-05-12

---

## Teammate 1 — Database

### Remaining
| Task | How to do it |
|---|---|
| Run `explain()` on 4 indexes | Open `mongosh aarogyalink` → paste the 4 queries from `backend/explain_results.md` |
| Fill results into `backend/explain_results.md` | Copy the `stage`, `nReturned`, `totalDocsExamined`, `executionTimeMillis` values from each query output |

---

## Teammate 2 — Frontend

### All code done ✅
All dashboards (Patient, Doctor, ASHA, Admin) are complete with `useMemo`, `useCallback`, and real API integration.

### Remaining — 1 manual step
| Task | How to do it |
|---|---|
| React Profiler screenshots (before/after `useMemo`) | See steps below |

**Steps:**
1. Start Docker Desktop → open two terminals:
   ```bash
   # Terminal 1
   cd backend && npm run seed && npm run dev

   # Terminal 2
   cd frontend && npm run dev
   ```
2. Open `http://localhost:5173` → log in as patient (`ravi@patient.com / password123`)
3. Open Chrome DevTools → **⚛️ Profiler** tab → click **Record**
4. Change the date picker on the Patient Dashboard
5. Stop recording → take a screenshot → save as `frontend/profiler_after_usememo.png`
6. Temporarily comment out the `useMemo` blocks in `PatientDashboard.jsx` (around lines 57–73) → repeat steps 3–5 → save as `frontend/profiler_before_usememo.png`
7. Restore the `useMemo` code

---

## Teammate 3 — Infrastructure

### Remaining
| Task | How to do it |
|---|---|
| Run threadpool benchmark → fill numbers | `node tests/threadpool-benchmark.js` → paste output into `backend/threadpool_results.md` |
| Verify `docker compose up --build` works | Run from project root, check all 4 services start |
| Deploy backend to Railway | Connect GitHub repo → set root dir to `backend/` → add env vars |
| Deploy frontend to Vercel | Connect GitHub repo → set root dir to `frontend/` → add `VITE_API_BASE_URL` |

---

## Teammate 4 — Auth + AI + Backend

### All code done ✅
JWT auth, RBAC, Claude API triage, Redis cache, SSE, load test scripts, and architecture docs are complete.

### Remaining — 2 manual steps
| Task | How to do it |
|---|---|
| Run load test → fill numbers in `load_test_results.md` | `node tests/load_test.js` → copy Req/sec, Latency, P99, Errors into the tables |
| Run event loop lag test → fill numbers in `load_test_results.md` | `node tests/eventloop_lag.js` → copy mean/max EL lag for Scenario A and B |

Both scripts require the backend to be running on port 5005.

---

## All Teammates — Shared

| Task | Status |
|---|---|
| Full end-to-end demo run (book → consult → PDF → email) | ❌ Not done |
| 10-minute demo video | ❌ Not done |
| Project report | ❌ Not done — use `backend/architecture_notes.md` for ready-made diagrams |

---

## Quick Summary

| Teammate | Code | Remaining Manual Steps |
|---|---|---|
| **Teammate 1** | ✅ Done (minimum) | Run `explain()` → fill `explain_results.md` |
| **Teammate 2** | ✅ 100% done | React Profiler screenshots |
| **Teammate 3** | ✅ Done | Threadpool benchmark + Docker verify + Deploy |
| **Teammate 4** | ✅ 100% done | Run `load_test.js` + `eventloop_lag.js` → fill numbers |
