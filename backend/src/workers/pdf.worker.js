/**
 * pdf.worker.js — BullMQ Consumer + Native worker_threads Bridge
 *
 * Teammate 3 (Infrastructure)
 *
 * Architecture:
 *   BullMQ pulls jobs from Redis ──► this handler spawns a native
 *   Node.js Worker thread (pdf.thread.js) ──► thread runs pdfkit
 *   off the main event loop ──► result posted back via parentPort
 *   ──► this handler writes prescriptionUrl to the Booking document.
 *
 * Teacher checklist items covered:
 *   ✅ libuv / worker_threads — PDF runs in new Worker('./pdf.thread.js')
 *   ✅ BullMQ job queue       — producer/consumer pattern preserved
 *   ✅ UV_THREADPOOL_SIZE     — configured in server.js (default 16)
 */

const { Worker: BullMQWorker } = require('bullmq');
const { Worker: ThreadWorker } = require('worker_threads');
const path = require('path');
const Booking = require('../models/Booking');

// Absolute path to the thread script so it resolves correctly
// regardless of the current working directory at runtime.
const THREAD_FILE = path.join(__dirname, 'pdf.thread.js');

// ─── Helper: run pdfkit inside a native worker thread ──────────────

/**
 * Spawns a Node.js worker thread to generate a prescription PDF.
 * The heavy pdfkit work happens off the main event loop.
 *
 * @param {object} data - Job payload (bookingId, patientName, etc.)
 * @returns {Promise<string>} - Absolute file path of the generated PDF.
 */
function generatePDFInThread(data) {
  return new Promise((resolve, reject) => {
    const worker = new ThreadWorker(THREAD_FILE, {
      workerData: data,   // passed to the thread via require('worker_threads').workerData
    });

    worker.on('message', (msg) => {
      if (msg.success) {
        resolve(msg.filePath);
      } else {
        reject(new Error(msg.error || 'Unknown worker thread error'));
      }
    });

    worker.on('error', (err) => {
      reject(err);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker thread stopped with exit code ${code}`));
      }
    });
  });
}

// ─── BullMQ worker (consumes from the "pdf-generation" queue) ──────

const pdfWorker = new BullMQWorker(
  'pdf-generation',
  async (job) => {
    console.log(
      `[Main Thread] PDF Job ${job.id} received — spawning worker thread…`
    );

    // 1. Offload CPU-bound PDF generation to a worker thread
    const absolutePath = await generatePDFInThread(job.data);

    // 2. Derive a portable URL relative to the static root
    //    e.g. "/prescriptions/prescription_abc123_1715100000000.pdf"
    const prescriptionUrl = `/prescriptions/${path.basename(absolutePath)}`;

    // 3. Persist the URL back to the Booking document so the patient
    //    (and frontend) can download it later.
    await Booking.findByIdAndUpdate(job.data.bookingId, { prescriptionUrl });

    console.log(
      `[Main Thread] PDF Job ${job.id} completed → ${prescriptionUrl}`
    );

    return { filePath: absolutePath, prescriptionUrl };
  },
  {
    connection: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
    },
    concurrency: 5, // Up to 5 parallel worker threads for PDF jobs
  }
);

// ─── Lifecycle logging ─────────────────────────────────────────────

pdfWorker.on('completed', (job, result) => {
  console.log(`✅ PDF Job ${job.id} done — ${result?.prescriptionUrl ?? ''}`);
});

pdfWorker.on('failed', (job, err) => {
  console.error(`❌ PDF Job ${job?.id} failed: ${err.message}`);
});

module.exports = pdfWorker;
