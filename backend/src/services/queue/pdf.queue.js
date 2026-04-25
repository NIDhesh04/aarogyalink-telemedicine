const { Queue } = require('bullmq');

const pdfQueue = new Queue('pdf-generation', {
  connection: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  }
});

/**
 * Adds a PDF generation job to the queue.
 * @param {object} data - The prescription data.
 */
const addPDFJob = async (data) => {
  await pdfQueue.add('generate-prescription', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
};

module.exports = {
  addPDFJob,
};
