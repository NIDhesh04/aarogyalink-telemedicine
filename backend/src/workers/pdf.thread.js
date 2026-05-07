/**
 * pdf.thread.js — Native Worker Thread for CPU-bound PDF Generation
 * 
 * Teammate 3 (Infrastructure)
 * 
 * This file runs INSIDE a Node.js worker_threads Worker.
 * It receives prescription data via workerData, runs the pdfkit
 * generation (CPU + file-I/O heavy), and posts the result back
 * to the main thread via parentPort.
 * 
 * Why worker_threads?
 *   pdfkit renders pages synchronously in memory before flushing
 *   to disk. On a complex prescription this blocks the event loop
 *   for 50-200 ms. By offloading to a worker thread we keep the
 *   main thread free to serve HTTP requests and SSE streams.
 */

const { parentPort, workerData } = require('worker_threads');
const { generatePrescriptionPDF } = require('../services/pdf/prescription.service');

(async () => {
  try {
    console.log(`[Worker Thread ${require('worker_threads').threadId}] Generating PDF for booking: ${workerData.bookingId}`);

    const filePath = await generatePrescriptionPDF(workerData);

    // Send the result back to the main thread
    parentPort.postMessage({ success: true, filePath });
  } catch (error) {
    console.error(`[Worker Thread] PDF generation failed:`, error.message);

    // Send the error back so the main thread can handle retries
    parentPort.postMessage({ success: false, error: error.message });
  }
})();
