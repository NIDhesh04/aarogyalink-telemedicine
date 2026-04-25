const { generatePrescriptionPDF } = require('../services/pdf/prescription.service');

/**
 * Sandboxed worker processor for BullMQ.
 * This runs in a separate process/thread.
 */
module.exports = async (job) => {
  console.log(`[Worker Thread] Processing PDF for booking: ${job.data.bookingId}`);
  
  try {
    const filePath = await generatePrescriptionPDF(job.data);
    return { filePath };
  } catch (error) {
    console.error(`[Worker Thread] PDF generation failed:`, error);
    throw error;
  }
};
