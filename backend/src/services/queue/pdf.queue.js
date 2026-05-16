const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

const pdfQueue = new Queue('pdf-generation', { connection });

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
