# AarogyaLink — Backend Architecture Notes
> Teammate 4 (Auth + AI + Backend Architecture)  
> For inclusion in the project report.

---

## 1. JWT Authentication Flow (Access + Refresh Token)

```
┌─────────────┐          POST /api/auth/login          ┌─────────────┐
│   Browser   │ ──────────────────────────────────────► │   Backend   │
│             │                                         │             │
│             │ ◄── accessToken (15 min, in body) ───── │  Generates  │
│             │ ◄── refreshToken (7 days, httpOnly) ─── │  two tokens │
└─────────────┘                                         └─────────────┘

On every subsequent request:
  Browser sends: Authorization: Bearer <accessToken>
  Backend verifies with JWT_SECRET → attaches req.user → continues

When accessToken expires (15 min):
┌─────────────┐     Any protected request returns 401     ┌─────────────┐
│  Axios Int. │ ─────────────────────────────────────────► │   Backend   │
│  (TM2)      │                                            │             │
│             │  POST /api/auth/refresh (cookie auto-sent) │             │
│             │ ──────────────────────────────────────────► │  Verifies   │
│             │ ◄── new accessToken ──────────────────────  │  refresh    │
│             │                                            │  cookie     │
│  Retry      │ ─── original request + new token ────────► │             │
│  original   │ ◄── 200 OK ──────────────────────────────  │             │
└─────────────┘                                            └─────────────┘

Security properties:
  - accessToken: short-lived (15m), stored in localStorage, used in Authorization header
  - refreshToken: long-lived (7d), httpOnly cookie — JS cannot read it
  - On logout: refreshToken cookie cleared, localStorage wiped
```

---

## 2. 4-Role RBAC Middleware Chain

```
Request → auth middleware → checkRole middleware → controller

auth middleware (middleware/auth.js):
  1. Extract Bearer token from Authorization header
  2. jwt.verify(token, JWT_SECRET) → decoded payload { id, role, name }
  3. Attach to req.user
  4. Call next() — or 401 if token missing/invalid/expired

checkRole middleware (middleware/rbac.js):
  1. Receives allowed roles array, e.g. ['doctor', 'admin']
  2. Checks req.user.role against the array
  3. If match → next()
  4. If no match → 403 Forbidden

Example route:
  router.post('/slots', auth, checkRole(['doctor', 'admin']), createSlot)
  router.get('/patients', auth, checkRole(['asha', 'admin']), getPatients)

Role capabilities:
  patient → book slots, view own bookings, view queue position
  doctor  → create slots, complete consultations, write prescriptions
  asha    → book on behalf of patients, view patient list
  admin   → view all, analytics, audit log
```

---

## 3. AI Triage Flow (Gemini API → Clinical Brief)

```
Patient Dashboard:
  Patient types: "I have fever for 3 days, 101°F, sore throat, body ache"
       ↓
  POST /api/bookings  {slotId, patientId, rawSymptoms: "..."}
       ↓
  booking.controller.js → generateClinicalBrief(rawSymptoms)
       ↓
  services/ai/triage.service.js
  → GoogleGenerativeAI("gemini-1.5-flash")
  → System prompt: "You are a senior clinical triage officer..."
  → Returns structured output:
       **Chief Complaint:** Fever with sore throat
       **Reported Duration:** 3 days
       **Severity:** Moderate
       **Key Symptoms:** Fever 101°F, sore throat, body ache
       **Red Flags:** None reported
       **Suggested Priority:** Routine
       ↓
  symptomBrief saved to Booking document in MongoDB
       ↓
Doctor Dashboard:
  GET /api/slots/doctor/:id → slot.routes.js fetches booking for each slot
  → Booking.symptomBrief attached to slot object
  → DoctorDashboard.jsx renders the AI brief before prescription textarea
  → Doctor can also click "AI Assist" → POST /api/bookings/ai-suggest
  → generatePrescriptionSuggestion(symptomBrief) → suggested prescription
```

---

## 4. Redis Cache-Aside Pattern (Slot Availability)

```
GET /api/slots?date=2025-06-01

  ┌─────────────────────────────────────────────────────┐
  │  slot.routes.js                                     │
  │                                                     │
  │  cacheKey = "slots:all:2025-06-01"                  │
  │                  ↓                                  │
  │  cachedSlots = await client.get(cacheKey)           │
  │                  ↓                                  │
  │  ┌───────────────┐      ┌────────────────────────┐  │
  │  │  Cache HIT    │      │  Cache MISS            │  │
  │  │               │      │                        │  │
  │  │  Return JSON  │      │  Query MongoDB         │  │
  │  │  from Redis   │      │  Slot.find({isBooked:  │  │
  │  │  (< 1ms)      │      │  false, date: ...})    │  │
  │  └───────────────┘      │         ↓              │  │
  │                         │  Save to Redis (EX 300)│  │
  │                         │  Return JSON           │  │
  │                         └────────────────────────┘  │
  └─────────────────────────────────────────────────────┘

Cache invalidation (on booking):
  booking.controller.js → createBooking()
    await client.del(`slots:all:${slot.date}`)      // date-specific cache
    await client.del(`slots:${slot.doctorId}:${slot.date}`)
    await client.del(`slots:all:any`)               // "any date" cache
    await client.del(`slots:${slot.doctorId}:any`)  // doctor+any date cache

TTL: 300 seconds (5 minutes)
Result: Slot availability checks hit Redis, not MongoDB, under normal load.
```

---

## 5. SSE Queue Position Update Flow

```
Patient books a slot:
  POST /api/bookings
    ↓
  Slot marked as booked (atomic findOneAndUpdate)
    ↓
  client.zAdd(`queue:${doctorId}`, { score: Date.now(), value: bookingId })
    ↓
  queueSSEManager.broadcastQueueUpdate(doctorId)
    ↓
  SSE Manager iterates connected clients:
    - For each bookingId in the Redis sorted set
    - Finds the SSE connection for that bookingId
    - Writes: data: { position: N, patientsAhead: N-1, total: T }

Patient frontend:
  useQueuePosition(doctorId, bookingId)   ← hooks/useQueuePosition.js
    ↓
  new EventSource('/api/sse/queue/:doctorId/:bookingId')
    ↓
  sse.routes.js → queueSSEManager.addClient(bookingId, res)
    ↓
  On every doctor action (next patient, complete, etc.)
  → SSE fires new position to patient's browser
  → React state updates → "#2 — 1 patient ahead" shown live

When consultation completes:
  POST /api/bookings/complete/:bookingId
    ↓
  client.zRem(`queue:${doctorId}`, bookingId)   // remove from queue
    ↓
  queueSSEManager.sendDone(bookingId)            // sends {done:true}
    ↓
  queueSSEManager.broadcastQueueUpdate(doctorId) // updates everyone else
    ↓
  Frontend: closes EventSource, shows "Consultation complete"
```

---

## 6. BullMQ + Worker Thread PDF Pipeline

```
Doctor completes consultation:
  POST /api/bookings/complete/:bookingId

  booking.controller.js:
    booking.status = 'completed'
    booking.prescription = prescriptionText
    await booking.save()
    await addPDFJob({ bookingId, patientName, doctorName, prescription })
           ↑
    services/queue/pdf.queue.js
    → new Queue('pdf-generation', { connection: Redis })
    → queue.add('generate-prescription', jobData)
           ↓
    Job stored in Redis

  workers/pdf.worker.js (BullMQ consumer):
    new BullMQWorker('pdf-generation', async (job) => {
      const absolutePath = await generatePDFInThread(job.data)
                                    ↑
      new Worker('./pdf.thread.js', { workerData: job.data })
      // pdf.thread.js: pdfkit renders PDF, writes to /public/prescriptions/
      // Posts message back: { success: true, filePath: '/path/to/file.pdf' }

      const prescriptionUrl = `/prescriptions/${basename(absolutePath)}`
      await Booking.findByIdAndUpdate(job.data.bookingId, { prescriptionUrl })
    })

Patient frontend:
  GET /api/bookings?patientId=xxx
  → b.prescriptionUrl is now set
  → "Download Prescription" link appears in history tab
```
