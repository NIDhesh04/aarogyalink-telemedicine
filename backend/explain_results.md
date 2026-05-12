# MongoDB Index Explain Results
> Teammate 1 (Database) · Teacher checklist: "Compound indexes + explain() query analysis"

---

## How to Run explain() Queries

Start MongoDB shell (Mongosh):
```bash
# If using Docker
docker exec -it aarogyalink-telemedicine-mongo-1 mongosh aarogyalink

# If using local MongoDB
mongosh aarogyalink
```

Then paste each query below.

---

## Index 1 — Slot Availability Query

**Index defined in `models/Slot.js`:**
```js
slotSchema.index({ doctorId: 1, date: 1, isBooked: 1 });
```

**Test query (paste in mongosh):**
```js
db.slots.find(
  { doctorId: ObjectId("REPLACE_WITH_A_DOCTOR_ID"), date: "2025-06-01", isBooked: false }
).explain("executionStats")
```

**What to look for in output:**
```json
{
  "queryPlanner": {
    "winningPlan": {
      "inputStage": {
        "stage": "IXSCAN",
        "keyPattern": { "doctorId": 1, "date": 1, "isBooked": 1 }
      }
    }
  },
  "executionStats": {
    "nReturned": 3,
    "totalDocsExamined": 3,
    "totalKeysExamined": 3,
    "executionTimeMillis": 1
  }
}
```

**Actual result:** _(Run the query and paste here)_

---

## Index 2 — Patient Booking History

**Index defined in `models/Booking.js`:**
```js
bookingSchema.index({ patientId: 1, createdAt: -1 });
```

**Test query:**
```js
db.bookings.find(
  { patientId: ObjectId("REPLACE_WITH_A_PATIENT_ID") }
).sort({ createdAt: -1 }).explain("executionStats")
```

**Actual result:** _(Run and paste)_

---

## Index 3 — Doctor's Pending Consultations

**Index defined in `models/Booking.js`:**
```js
bookingSchema.index({ doctorId: 1, status: 1 });
```

**Test query:**
```js
db.bookings.find(
  { doctorId: ObjectId("REPLACE_WITH_A_DOCTOR_ID"), status: "booked" }
).explain("executionStats")
```

**Actual result:** _(Run and paste)_

---

## Index 4 — Audit Log Lookup

**Index defined in `models/AuditLog.js`:**
```js
auditLogSchema.index({ bookingId: 1, createdAt: -1 });
```

**Test query:**
```js
db.auditlogs.find(
  { bookingId: ObjectId("REPLACE_WITH_A_BOOKING_ID") }
).sort({ createdAt: -1 }).explain("executionStats")
```

**Actual result:** _(Run and paste)_

---

## Summary Table

| Index | Fields | Query it Serves | Stage Expected | Stage Actual |
|---|---|---|---|---|
| slots_compound | `{doctorId, date, isBooked}` | Slot availability filter | `IXSCAN` | _(fill in)_ |
| booking_patient | `{patientId, createdAt:-1}` | Patient booking history | `IXSCAN` | _(fill in)_ |
| booking_doctor | `{doctorId, status}` | Doctor pending list | `IXSCAN` | _(fill in)_ |
| auditlog_booking | `{bookingId, createdAt:-1}` | Audit trail lookup | `IXSCAN` | _(fill in)_ |

---

## COLLSCAN vs IXSCAN

| Stage | Meaning | Performance |
|---|---|---|
| `COLLSCAN` | Full collection scan — reads every document | O(N) — slow at scale |
| `IXSCAN` | Index scan — jumps directly to matches | O(log N) — fast at scale |

Without indexes, a query for one patient's bookings among 10,000 rows would read all 10,000 documents. With the compound index, MongoDB jumps directly to that patient's documents.
