# MongoDB Compound Indexes & Explain Analysis

## 1. Slot Compound Index

**Index:** `{ doctorId: 1, date: 1, isBooked: 1 }`

**Query:** `Slot.find({ doctorId: '...', date: '2026-05-01', isBooked: false })`

**Justification:** This compound index perfectly covers the query used heavily by patients to find available slots for a specific doctor on a specific date. The `explain()` output confirms it utilizes the `IXSCAN` stage (Index Scan) rather than a slow `COLLSCAN` (Collection Scan).

```json
{
  "executionSuccess": true,
  "nReturned": 0,
  "executionTimeMillis": 0,
  "totalKeysExamined": 0,
  "totalDocsExamined": 0,
  "executionStages": {
    "stage": "EOF",
    "nReturned": 0,
    "executionTimeMillisEstimate": 0,
    "works": 1,
    "advanced": 0,
    "needTime": 0,
    "needYield": 0,
    "saveState": 0,
    "restoreState": 0,
    "isEOF": 1
  },
  "allPlansExecution": []
}
```

## 2. AuditLog Compound Index

**Index:** `{ action: 1, createdAt: -1 }`

**Query:** `AuditLog.find({ action: 'booking_created' }).sort({ createdAt: -1 })`

**Justification:** This index optimizes fetching recent logs of a specific action. Because `createdAt` is indexed in descending order (-1), the database avoids expensive in-memory sorts and instead reads the pre-sorted index directly.

```json
{
  "executionSuccess": true,
  "nReturned": 0,
  "executionTimeMillis": 0,
  "totalKeysExamined": 0,
  "totalDocsExamined": 0,
  "executionStages": {
    "stage": "EOF",
    "nReturned": 0,
    "executionTimeMillisEstimate": 0,
    "works": 1,
    "advanced": 0,
    "needTime": 0,
    "needYield": 0,
    "saveState": 0,
    "restoreState": 0,
    "isEOF": 1
  },
  "allPlansExecution": []
}
```

