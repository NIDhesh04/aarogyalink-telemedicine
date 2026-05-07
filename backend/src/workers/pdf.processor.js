/**
 * pdf.processor.js — DEPRECATED
 *
 * This file was the original BullMQ sandboxed processor.
 * It has been replaced by pdf.thread.js which uses the native
 * Node.js worker_threads API (required by the teacher checklist).
 *
 * The new architecture:
 *   pdf.worker.js   → BullMQ consumer, spawns native threads
 *   pdf.thread.js   → runs pdfkit inside worker_threads.Worker
 *
 * This file is kept only as a reference and is no longer imported.
 */

// No longer used — see pdf.thread.js
