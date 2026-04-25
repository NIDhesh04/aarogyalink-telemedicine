const { client } = require('../../config/redis');

/**
 * SSE Manager for Queue Updates
 * Handles client connections and broadcasts queue position changes.
 */
class QueueSSEManager {
  constructor() {
    this.clients = new Map(); // userId -> response object
  }

  /**
   * Adds a new SSE client connection.
   * @param {string} userId - Unique ID for the patient or doctor.
   * @param {object} res - Express response object.
   */
  addClient(userId, res) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    this.clients.set(userId, res);

    // Clean up on disconnect
    res.on('close', () => {
      this.clients.delete(userId);
    });

    console.log(`SSE Client connected: ${userId}. Total: ${this.clients.size}`);
  }

  /**
   * Broadcasts queue updates to all connected clients interested in a specific doctor's queue.
   * @param {string} doctorId - The ID of the doctor whose queue changed.
   */
  async broadcastQueueUpdate(doctorId) {
    try {
      const queue = await client.zRange(`queue:${doctorId}`, 0, -1);
      
      // In a real app, we might want to only send updates to patients in this specific queue.
      // For now, we'll iterate through clients and send relevant data.
      // A more optimized way would be to track which client is watching which doctor.
      
      for (const [userId, res] of this.clients.entries()) {
        // If the userId is a bookingId in the queue, calculate its position
        const index = queue.findIndex(id => id === userId);
        
        if (index !== -1) {
          const payload = {
            position: index + 1,
            patientsAhead: index,
            total: queue.length,
            done: false,
          };
          res.write(`data: ${JSON.stringify(payload)}\n\n`);
        } else if (userId.startsWith('doctor:')) {
          // If the client is a doctor, send them the full queue overview
          const actualDoctorId = userId.replace('doctor:', '');
          if (actualDoctorId === doctorId) {
            res.write(`data: ${JSON.stringify({ total: queue.length, queue })}\n\n`);
          }
        }
      }
    } catch (err) {
      console.error('SSE Broadcast Error:', err);
    }
  }

  /**
   * Sends a completion event to a specific booking.
   * @param {string} bookingId 
   */
  sendDone(bookingId) {
    const res = this.clients.get(bookingId);
    if (res) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      this.clients.delete(bookingId);
    }
  }
}

module.exports = new QueueSSEManager();
