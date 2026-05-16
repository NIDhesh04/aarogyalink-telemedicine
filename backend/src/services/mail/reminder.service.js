const { Queue, Worker } = require('bullmq');
const { sendBookingConfirmation } = require('./mail.service'); // Reuse confirmation for simplicity or create sendReminder
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

const reminderQueue = new Queue('email-reminders', { connection });

/**
 * Schedules a reminder email.
 * @param {string} to - Recipient email.
 * @param {object} details - Booking details.
 * @param {number} delay - Delay in milliseconds.
 */
const scheduleReminder = async (to, details, delay) => {
  if (delay < 0) return; // Already passed
  await reminderQueue.add('send-reminder', { to, details }, { delay });
};

// Worker to process reminders
const reminderWorker = new Worker('email-reminders', async (job) => {
  const { to, details } = job.data;
  console.log(`Sending reminder to ${to}`);
  // In a real app, you'd use a different template for reminders
  await sendBookingConfirmation(to, { ...details, subject: 'Reminder: Your Consultation is in 1 Hour' });
}, { connection });

module.exports = {
  scheduleReminder,
};
