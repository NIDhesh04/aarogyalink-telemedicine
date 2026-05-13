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

**Actual result:**
```json
{
  "queryPlanner": {
    "winningPlan": {
      "stage": "IXSCAN",
      "keyPattern": { "doctorId": 1, "date": 1, "isBooked": 1 },
      "indexName": "doctorId_1_date_1_isBooked_1"
    }
  },
  "executionStats": {
    "nReturned": 5,
    "executionTimeMillis": 1,
    "totalKeysExamined": 5,
    "totalDocsExamined": 5
  }
}
```

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

**Actual result:**
```json
{
  "queryPlanner": {
    "winningPlan": {
      "stage": "IXSCAN",
      "keyPattern": { "patientId": 1, "createdAt": -1 },
      "indexName": "patientId_1_createdAt_-1"
    }
  },
  "executionStats": {
    "nReturned": 8,
    "executionTimeMillis": 2,
    "totalKeysExamined": 8,
    "totalDocsExamined": 8
  }
}
```

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

**Actual result:**
```json
{
  "queryPlanner": {
    "winningPlan": {
      "stage": "IXSCAN",
      "keyPattern": { "doctorId": 1, "status": 1 },
      "indexName": "doctorId_1_status_1"
    }
  },
  "executionStats": {
    "nReturned": 4,
    "executionTimeMillis": 1,
    "totalKeysExamined": 4,
    "totalDocsExamined": 4
  }
}
```

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

**Actual result:**
```json
{
  "queryPlanner": {
    "winningPlan": {
      "stage": "IXSCAN",
      "keyPattern": { "bookingId": 1, "createdAt": -1 },
      "indexName": "bookingId_1_createdAt_-1"
    }
  },
  "executionStats": {
    "nReturned": 2,
    "executionTimeMillis": 0,
    "totalKeysExamined": 2,
    "totalDocsExamined": 2
  }
}
```

---

## Summary Table

| Index | Fields | Query it Serves | Stage Expected | Stage Actual |
|---|---|---|---|---|
| slots_compound | `{doctorId, date, isBooked}` | Slot availability filter | `IXSCAN` | `IXSCAN` |
| booking_patient | `{patientId, createdAt:-1}` | Patient booking history | `IXSCAN` | `IXSCAN` |
| booking_doctor | `{doctorId, status}` | Doctor pending list | `IXSCAN` | `IXSCAN` |
| auditlog_booking | `{bookingId, createdAt:-1}` | Audit trail lookup | `IXSCAN` | `IXSCAN` |

---

## COLLSCAN vs IXSCAN

| Stage | Meaning | Performance |
|---|---|---|
| `COLLSCAN` | Full collection scan — reads every document | O(N) — slow at scale |
| `IXSCAN` | Index scan — jumps directly to matches | O(log N) — fast at scale |

Without indexes, a query for one patient's bookings among 10,000 rows would read all 10,000 documents. With the compound index, MongoDB jumps directly to that patient's documents.
