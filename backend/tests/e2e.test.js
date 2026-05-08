/**
 * AarogyaLink — End-to-End Integration Tests
 * Tests the full booking lifecycle: Register → Slot → Book → Queue → Complete → PDF
 *
 * Teammate 3 (Infrastructure)
 *
 * Strategy:
 *   • MongoDB and Redis run for real — we verify actual DB state changes.
 *   • Nodemailer is mocked to prevent sending real emails.
 *   • BullMQ is mocked so we can assert queue interactions without a
 *     live worker, but we verify the mock was called with the right data.
 *   • The Gemini/Claude AI SDK is mocked to avoid external API calls.
 *
 * Prerequisites: MongoDB and Redis must be running locally.
 * Run with: npm test -- tests/e2e.test.js
 */

/* ─── Test environment variables (set BEFORE any app code loads) ─────────── */
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aarogyalink_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.JWT_SECRET = 'test_jwt_secret_key_e2e';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_key_e2e';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.EMAIL_USER = 'test@aarogyalink.com';
process.env.EMAIL_PASS = 'test_password';

/* ─── Mock external services BEFORE app loads ────────────────────────────── */

// Mock Google Generative AI — prevent real AI API calls
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => 'Chief Complaint: Fever and headache\nDuration: 3 days\nSeverity: Moderate',
          },
        }),
      }),
    })),
  };
});

// Mock Nodemailer — prevent real email sends during tests
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
  }),
}));

// Mock BullMQ — prevent real queue connections but track calls
const mockQueueAdd = jest.fn().mockResolvedValue({ id: 'mock-job-id' });
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: mockQueueAdd,
    close: jest.fn().mockResolvedValue(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(),
  })),
}));

const request = require('supertest');
const mongoose = require('mongoose');
const { client } = require('../src/config/redis');

// Direct model imports for verifying real DB state
const User = require('../src/models/User');
const Slot = require('../src/models/Slot');
const Booking = require('../src/models/Booking');
const AuditLog = require('../src/models/AuditLog');

let app;

/* ─── Test state shared across the ordered test flow ─────────────────────── */
const state = {
  doctorAccessToken: null,
  doctorId: null,
  patientAccessToken: null,
  patientId: null,
  slotId: null,
  bookingId: null,
};

const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

/* ─── Setup & Teardown ───────────────────────────────────────────────────── */

beforeAll(async () => {
  // Load app after env vars and mocks are set
  app = require('../src/app');

  // Wait for connections to stabilize
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Clean test database collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const col of collections) {
    await mongoose.connection.db.collection(col.name).deleteMany({});
  }

  // Flush Redis test keys
  await client.flushDb();
});

afterAll(async () => {
  // Clean up test data
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      await mongoose.connection.db.collection(col.name).deleteMany({});
    }
    await client.flushDb();
  } catch (_) {
    // Ignore cleanup errors during teardown
  }

  // Close connections
  await mongoose.disconnect();
  await client.quit();
});

/* ─── Test Suite ─────────────────────────────────────────────────────────── */

describe('AarogyaLink E2E — Full Booking Lifecycle', () => {

  // ─── Step 1: Registration ───────────────────────────────────────────────
  describe('Step 1: User Registration', () => {

    it('should register a new Doctor and persist in DB', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Dr. Test Sharma',
          email: 'dr.test@aarogyalink.com',
          password: 'securepass123',
          role: 'doctor',
          specialty: 'General Medicine',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toMatchObject({
        name: 'Dr. Test Sharma',
        email: 'dr.test@aarogyalink.com',
        role: 'doctor',
      });

      state.doctorAccessToken = res.body.accessToken;
      state.doctorId = res.body.user.id;

      // ── Verify real DB state ──
      const dbUser = await User.findById(state.doctorId);
      expect(dbUser).not.toBeNull();
      expect(dbUser.role).toBe('doctor');
      expect(dbUser.email).toBe('dr.test@aarogyalink.com');
    });

    it('should register a new Patient and persist in DB', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Ravi Test Kumar',
          email: 'ravi.test@patient.com',
          password: 'securepass123',
          role: 'patient',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toMatchObject({
        name: 'Ravi Test Kumar',
        role: 'patient',
      });

      state.patientAccessToken = res.body.accessToken;
      state.patientId = res.body.user.id;

      // ── Verify real DB state ──
      const dbUser = await User.findById(state.patientId);
      expect(dbUser).not.toBeNull();
      expect(dbUser.role).toBe('patient');
    });

    it('should reject duplicate email registration (409)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Doctor',
          email: 'dr.test@aarogyalink.com',
          password: 'securepass123',
          role: 'doctor',
        })
        .expect(409);

      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  // ─── Step 2: Slot Creation ──────────────────────────────────────────────
  describe('Step 2: Slot Creation', () => {

    it('should create a new availability slot and verify in DB', async () => {
      const res = await request(app)
        .post('/api/slots')
        .send({
          doctorId: state.doctorId,
          date: tomorrow,
          startTime: '10:00',
          endTime: '10:30',
          time: '10:00 AM',
        })
        .expect(201);

      expect(res.body).toHaveProperty('_id');
      expect(res.body.doctorId).toBe(state.doctorId);
      expect(res.body.isBooked).toBe(false);

      state.slotId = res.body._id;

      // ── Verify real DB state ──
      const dbSlot = await Slot.findById(state.slotId);
      expect(dbSlot).not.toBeNull();
      expect(dbSlot.isBooked).toBe(false);
      expect(dbSlot.date).toBe(tomorrow);
    });

    it('should list the slot as available via API', async () => {
      const res = await request(app)
        .get(`/api/slots?doctorId=${state.doctorId}&date=${tomorrow}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const slot = res.body.find(s => s._id === state.slotId);
      expect(slot).toBeDefined();
      expect(slot.isBooked).toBe(false);
    });
  });

  // ─── Step 3: Booking ────────────────────────────────────────────────────
  describe('Step 3: Booking the Slot', () => {

    it('should book the slot and verify DB + Redis state', async () => {
      // Reset the mock call count so we can isolate this test's calls
      mockQueueAdd.mockClear();

      const res = await request(app)
        .post('/api/bookings')
        .send({
          slotId: state.slotId,
          patientId: state.patientId,
          symptomBrief: 'Fever and headache for 3 days',
        })
        .expect(201);

      expect(res.body.message).toBe('Booking successful');
      expect(res.body.booking).toHaveProperty('_id');
      expect(res.body.booking.patientId).toBe(state.patientId);
      expect(res.body.booking.doctorId).toBe(state.doctorId);
      expect(res.body.booking.status).toBe('booked');
      expect(res.body.queuePos).toBe(1);

      state.bookingId = res.body.booking._id;

      // ── Verify real DB state — Booking created ──
      const dbBooking = await Booking.findById(state.bookingId);
      expect(dbBooking).not.toBeNull();
      expect(dbBooking.status).toBe('booked');
      expect(dbBooking.symptomBrief).toBe('Fever and headache for 3 days');

      // ── Verify real DB state — Slot marked as booked ──
      const dbSlot = await Slot.findById(state.slotId);
      expect(dbSlot.isBooked).toBe(true);
      expect(dbSlot.bookedBy.toString()).toBe(state.patientId);

      // ── Verify Redis sorted set — booking added to queue ──
      const queue = await client.zRange(`queue:${state.doctorId}`, 0, -1);
      expect(queue).toContain(state.bookingId);

      // ── Verify AuditLog was written ──
      const auditLog = await AuditLog.findOne({ targetId: state.bookingId });
      expect(auditLog).not.toBeNull();
      expect(auditLog.action).toBe('booking_created');
    });

    it('should reject double-booking the same slot (race-condition safety)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          slotId: state.slotId,
          patientId: state.patientId,
          symptomBrief: 'Trying to double book',
        })
        .expect(400);

      expect(res.body.error).toMatch(/already booked/i);
    });

    it('should reject booking with invalid slotId', async () => {
      await request(app)
        .post('/api/bookings')
        .send({
          slotId: 'invalid-id',
          patientId: state.patientId,
        })
        .expect(400);
    });

    it('should reject booking without patientId', async () => {
      await request(app)
        .post('/api/bookings')
        .send({
          slotId: state.slotId,
        })
        .expect(400);
    });
  });

  // ─── Step 4: Queue Verification ─────────────────────────────────────────
  describe('Step 4: Queue Position Check', () => {

    it('should return the patient position in the queue', async () => {
      const res = await request(app)
        .get(`/api/bookings/position/${state.doctorId}/${state.bookingId}`)
        .expect(200);

      expect(res.body.position).toBe(1);
      expect(res.body.patientsAhead).toBe(0);
      expect(res.body.total).toBe(1);
    });

    it('should return the full doctor queue', async () => {
      const res = await request(app)
        .get(`/api/bookings/queue/${state.doctorId}`)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.queue).toContain(state.bookingId);
    });

    it('should return 404 for a non-existent booking in queue', async () => {
      const fakeBookingId = new mongoose.Types.ObjectId().toString();

      await request(app)
        .get(`/api/bookings/position/${state.doctorId}/${fakeBookingId}`)
        .expect(404);
    });
  });

  // ─── Step 5: Complete Consultation ──────────────────────────────────────
  describe('Step 5: Completing the Consultation', () => {

    it('should complete the booking, update DB, and queue PDF job', async () => {
      // Clear mock to isolate this test
      mockQueueAdd.mockClear();

      const prescriptionText =
        'Paracetamol 500mg twice daily for 5 days. Rest and hydration advised.';

      const res = await request(app)
        .post(`/api/bookings/complete/${state.bookingId}`)
        .send({ prescription: prescriptionText })
        .expect(200);

      expect(res.body.message).toMatch(/completed/i);
      expect(res.body.booking.status).toBe('completed');
      expect(res.body.booking.prescription).toBe(prescriptionText);

      // ── Verify real DB state — Booking status updated ──
      const dbBooking = await Booking.findById(state.bookingId);
      expect(dbBooking.status).toBe('completed');
      expect(dbBooking.prescription).toBe(prescriptionText);

      // ── Verify BullMQ addPDFJob was called with correct data ──
      expect(mockQueueAdd).toHaveBeenCalledTimes(1);
      const jobCallArgs = mockQueueAdd.mock.calls[0];
      expect(jobCallArgs[0]).toBe('generate-prescription');
      expect(jobCallArgs[1]).toMatchObject({
        bookingId: expect.anything(),
        prescription: prescriptionText,
      });

      // ── Verify Redis queue — booking removed after completion ──
      const queue = await client.zRange(`queue:${state.doctorId}`, 0, -1);
      expect(queue).not.toContain(state.bookingId);
    });

    it('should return 404 when completing a non-existent booking', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await request(app)
        .post(`/api/bookings/complete/${fakeId}`)
        .send({ prescription: 'Test' })
        .expect(404);
    });
  });

  // ─── Step 6: Prescription Route ─────────────────────────────────────────
  describe('Step 6: Manual Prescription PDF Trigger', () => {

    it('should accept PDF generation for a completed booking (202)', async () => {
      mockQueueAdd.mockClear();

      const res = await request(app)
        .post('/api/prescriptions')
        .send({ bookingId: state.bookingId })
        .expect(202);

      expect(res.body.message).toMatch(/queued/i);
      expect(mockQueueAdd).toHaveBeenCalledTimes(1);
    });

    it('should reject PDF generation for a non-existent booking', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await request(app)
        .post('/api/prescriptions')
        .send({ bookingId: fakeId })
        .expect(404);
    });

    it('should reject PDF generation with an invalid bookingId', async () => {
      await request(app)
        .post('/api/prescriptions')
        .send({ bookingId: 'not-a-valid-id' })
        .expect(400);
    });
  });

  // ─── Step 7: Edge Cases & Final Verification ───────────────────────────
  describe('Step 7: Edge Cases', () => {

    it('should return 404 for completed booking in queue position check', async () => {
      await request(app)
        .get(`/api/bookings/position/${state.doctorId}/${state.bookingId}`)
        .expect(404);
    });

    it('should verify the slot remains marked as booked in DB', async () => {
      const dbSlot = await Slot.findById(state.slotId);
      expect(dbSlot).not.toBeNull();
      expect(dbSlot.isBooked).toBe(true);
    });

    it('should verify slot is booked via API', async () => {
      const res = await request(app)
        .get(`/api/slots/doctor/${state.doctorId}?date=${tomorrow}`)
        .expect(200);

      const slot = res.body.find(s => s._id === state.slotId);
      expect(slot).toBeDefined();
      expect(slot.isBooked).toBe(true);
    });

    it('health check should return running message', async () => {
      const res = await request(app)
        .get('/')
        .expect(200);

      expect(res.text).toMatch(/running/i);
    });
  });
});
