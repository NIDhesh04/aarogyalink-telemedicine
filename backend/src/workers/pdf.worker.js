const { Worker } = require('bullmq');
const path = require('path');

// BullMQ Sandboxed Worker: 
// By passing a file path instead of a function, BullMQ runs the processor in a separate thread/process.
const processorPath = path.join(__dirname, 'pdf.processor.js');

const pdfWorker = new Worker('pdf-generation', processorPath, {
  connection: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  },
  concurrency: 5, // Process up to 5 PDFs simultaneously
});

pdfWorker.on('completed', (job) => {
  console.log(`PDF Job ${job.id} completed!`);
});

pdfWorker.on('failed', (job, err) => {
  console.error(`PDF Job ${job.id} failed: ${err.message}`);
});

module.exports = pdfWorker;

