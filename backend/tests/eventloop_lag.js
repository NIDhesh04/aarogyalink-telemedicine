#!/usr/bin/env node
/**
 * eventloop_lag.js — Event Loop Lag Measurement
 * Teammate 4 (Auth + AI + Backend Architecture)
 *
 * Teacher checklist: "Event loop: measure blocking vs non-blocking patterns"
 *
 * This script measures the event loop lag (delay) in two scenarios:
 *
 *   Scenario A — Blocking: PDF generation runs synchronously ON the main
 *                thread using pdfkit. The event loop is blocked while the
 *                PDF renders (heavy string concat + stream writes).
 *
 *   Scenario B — Non-blocking: PDF generation is offloaded to a native
 *                worker_thread. The event loop stays free; lag stays near 0.
 *
 * Run:
 *   node tests/eventloop_lag.js
 *
 * Interpretation:
 *   A high mean lag (>10ms) in Scenario A proves the blocking concern.
 *   A near-zero lag in Scenario B proves the worker_thread solution works.
 */

const { monitorEventLoopDelay } = require('perf_hooks');
const { Worker }                 = require('worker_threads');
const PDFDocument                = require('pdfkit');
const path                       = require('path');
const os                         = require('os');
const fs                         = require('fs');

// ── Scenario A: Simulate blocking PDF work on the main thread ─────────────
function blockingPDFOnMainThread() {
  return new Promise((resolve) => {
    const histogram = monitorEventLoopDelay({ resolution: 5 });
    histogram.enable();

    const startMs = Date.now();

    // Generate 5 PDFs synchronously on the main thread — CPU-bound work
    let completed = 0;
    const total = 5;

    function generateOne() {
      const doc    = new PDFDocument({ margin: 40 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end',  () => {
        completed++;
        if (completed < total) {
          generateOne();
        } else {
          histogram.disable();

          const elapsed = Date.now() - startMs;
          console.log('\n── Scenario A: Blocking (main thread PDF) ────────');
          console.log(`  Wall time          : ${elapsed} ms`);
          console.log(`  EL delay (mean)    : ${(histogram.mean  / 1e6).toFixed(2)} ms`);
          console.log(`  EL delay (max)     : ${(histogram.max   / 1e6).toFixed(2)} ms`);
          console.log(`  EL delay (p99)     : ${(histogram.percentile(99) / 1e6).toFixed(2)} ms`);
          console.log('  ⚠️  High mean delay = event loop was blocked');
          console.log('─────────────────────────────────────────────────');

          resolve({
            scenario: 'blocking',
            wallMs: elapsed,
            meanLagMs:  (histogram.mean  / 1e6).toFixed(2),
            maxLagMs:   (histogram.max   / 1e6).toFixed(2),
          });
        }
      });

      // Write content representative of a real prescription PDF
      doc.fontSize(20).text('AarogyaLink — Prescription', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Patient    : Ravi Kumar`);
      doc.text(`Doctor     : Dr. Anita Singh`);
      doc.text(`Date       : ${new Date().toLocaleDateString()}`);
      doc.moveDown();
      doc.fontSize(14).text('Prescription:', { underline: true });
      doc.fontSize(11).text(
        'Tab Paracetamol 500mg — twice daily for 5 days | Indication: Fever\n' +
        'Tab Cetirizine 10mg   — once daily for 3 days  | Indication: Allergic rhinitis\n' +
        'Syp Amoxicillin 250mg — thrice daily for 7 days | Indication: Upper respiratory infection\n' +
        '\nGeneral Advice: Rest, adequate hydration, avoid cold foods.\n' +
        'Follow-up in 5 days if symptoms persist.'
      );
      doc.end();
    }

    generateOne();
  });
}

// ── Scenario B: Offload PDF to worker_thread ──────────────────────────────
function nonBlockingPDFInWorkerThread() {
  return new Promise((resolve, reject) => {
    const histogram = monitorEventLoopDelay({ resolution: 5 });
    histogram.enable();

    const startMs = Date.now();

    // Inline worker script that runs in a separate thread
    const workerCode = `
      const { workerData, parentPort } = require('worker_threads');
      const PDFDocument = require('pdfkit');

      async function generate(n) {
        for (let i = 0; i < n; i++) {
          await new Promise((res) => {
            const doc = new PDFDocument({ margin: 40 });
            const chunks = [];
            doc.on('data', c => chunks.push(c));
            doc.on('end', res);
            doc.fontSize(20).text('AarogyaLink — Prescription', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text('Patient: Ravi Kumar');
            doc.text('Doctor: Dr. Anita Singh');
            doc.moveDown();
            doc.fontSize(11).text(
              'Tab Paracetamol 500mg twice daily for 5 days.\\n' +
              'Tab Cetirizine 10mg once daily for 3 days.\\n' +
              'Rest and hydration advised.'
            );
            doc.end();
          });
        }
        parentPort.postMessage({ done: true });
      }

      generate(workerData.count).catch(err => parentPort.postMessage({ error: err.message }));
    `;

    // Write the inline script to a temp file (worker_threads requires a file path)
    const tmpFile = path.join(os.tmpdir(), 'aarogya_pdf_worker_test.js');
    fs.writeFileSync(tmpFile, workerCode);

    const worker = new Worker(tmpFile, { workerData: { count: 5 } });

    worker.on('message', (msg) => {
      if (msg.error) { reject(new Error(msg.error)); return; }

      histogram.disable();
      const elapsed = Date.now() - startMs;

      console.log('\n── Scenario B: Non-blocking (worker_thread PDF) ──');
      console.log(`  Wall time          : ${elapsed} ms`);
      console.log(`  EL delay (mean)    : ${(histogram.mean  / 1e6).toFixed(2)} ms`);
      console.log(`  EL delay (max)     : ${(histogram.max   / 1e6).toFixed(2)} ms`);
      console.log(`  EL delay (p99)     : ${(histogram.percentile(99) / 1e6).toFixed(2)} ms`);
      console.log('  ✅ Near-zero lag = event loop stayed free');
      console.log('─────────────────────────────────────────────────');

      fs.unlinkSync(tmpFile);

      resolve({
        scenario: 'non-blocking',
        wallMs: elapsed,
        meanLagMs:  (histogram.mean  / 1e6).toFixed(2),
        maxLagMs:   (histogram.max   / 1e6).toFixed(2),
      });
    });

    worker.on('error', reject);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   AarogyaLink — Event Loop Lag Measurement          ║');
  console.log('║   Blocking vs Non-blocking PDF Generation           ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('\n  Generating 5 PDFs in each scenario...\n');

  const resultA = await blockingPDFOnMainThread();
  const resultB = await nonBlockingPDFInWorkerThread();

  const improvement = ((resultA.meanLagMs - resultB.meanLagMs) / resultA.meanLagMs * 100).toFixed(1);

  console.log('\n══ Summary ═══════════════════════════════════════════');
  console.log(`  Blocking   EL mean lag : ${resultA.meanLagMs} ms`);
  console.log(`  Non-block  EL mean lag : ${resultB.meanLagMs} ms`);
  console.log(`  Improvement            : ${improvement}% reduction in event loop lag`);
  console.log('\n  ✅ Copy these numbers into backend/load_test_results.md');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
