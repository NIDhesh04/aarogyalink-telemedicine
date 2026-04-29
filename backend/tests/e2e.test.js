/**
 * AarogyaLink — End-to-End Integration Tests
 * Tests the full booking lifecycle: Register → Slot → Book → Queue → Complete
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
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-for-e2e-testing';
process.env.EMAIL_USER = 'test@aarogyalink.com';
process.env.EMAIL_PASS = 'test_password';

/* ─── Mock external services BEFORE app loads ────────────────────────────── */

// Mock Anthropic SDK — prevent real AI API calls
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'Chief Complaint: Fever and headache\nDuration: 3 days\nSeverity: Moderate' }],
      }),
    },
  }));
});

// Mock Nodemailer — prevent real email sends
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
  }),
}));

// Mock BullMQ — prevent real queue connections
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
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

let app;

/* ─── Test state shared across the ordered test flow ─────────────────────── */
const state = {
  doctorToken: null,
  doctorId: null,
  patientToken: null,
  patientId: null,
  slotId: null,
  bookingId: null,
};

/* ─── Setup & Teardown ───────────────────────────────────────────────────── */

beforeAll(async () => {
  // Load app after env vars and mocks are set
  app = require('../src/app');

  // Wait for connections to stabilize
  await new Promise((resolve) => setTimeout(resolve, 1000));

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

    it('should register a new Doctor', async () => {
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

      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        name: 'Dr. Test Sharma',
        email: 'dr.test@aarogyalink.com',
        role: 'doctor',
      });

      state.doctorToken = res.body.token;
      state.doctorId = res.body.user.id;
    });

    it('should register a new Patient', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Ravi Test Kumar',
          email: 'ravi.test@patient.com',
          password: 'securepass123',
          role: 'patient',
        })
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        name: 'Ravi Test Kumar',
        email: 'ravi.test@patient.com',
        role: 'patient',
      });

      state.patientToken = res.body.token;
      state.patientId = res.body.user.id;
    });

    it('should reject duplicate email registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Doctor',
          email: 'dr.test@aarogyalink.com',
          password: 'securepass123',
          role: 'doctor',
        })
        .expect(400);

      expect(res.body.error).toMatch(/already exists/i);
    });
  });

  // ─── Step 2: Slot Creation ──────────────────────────────────────────────
  describe('Step 2: Slot Creation', () => {

    it('should create a new availability slot for the Doctor', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

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
    });

    it('should list the slot as available', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

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

    it('should book the slot successfully', async () => {
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
    });

    it('should reject double-booking the same slot', async () => {
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

    it('should complete the booking and trigger PDF generation', async () => {
      const res = await request(app)
        .post(`/api/bookings/complete/${state.bookingId}`)
        .send({
          prescription: 'Paracetamol 500mg twice daily for 5 days. Rest and hydration advised.',
        })
        .expect(200);

      expect(res.body.message).toMatch(/completed/i);
      expect(res.body.booking.status).toBe('completed');
      expect(res.body.booking.prescription).toBe(
        'Paracetamol 500mg twice daily for 5 days. Rest and hydration advised.'
      );

      // Verify BullMQ addPDFJob was called (via the mocked Queue.add)
      const { Queue } = require('bullmq');
      const mockQueueInstance = Queue.mock.results[0]?.value;
      if (mockQueueInstance) {
        expect(mockQueueInstance.add).toHaveBeenCalled();
      }
    });

    it('should remove the booking from the Redis queue after completion', async () => {
      const res = await request(app)
        .get(`/api/bookings/queue/${state.doctorId}`)
        .expect(200);

      expect(res.body.total).toBe(0);
      expect(res.body.queue).not.toContain(state.bookingId);
    });

    it('should return 404 when completing a non-existent booking', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await request(app)
        .post(`/api/bookings/complete/${fakeId}`)
        .send({ prescription: 'Test' })
        .expect(404);
    });
  });

  // ─── Step 6: Edge Cases & Validation ────────────────────────────────────
  describe('Step 6: Edge Cases', () => {

    it('should return the booking as completed in queue position check', async () => {
      await request(app)
        .get(`/api/bookings/position/${state.doctorId}/${state.bookingId}`)
        .expect(404);
    });

    it('should verify the completed slot is marked as booked', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

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
