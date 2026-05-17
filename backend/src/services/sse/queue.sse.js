const { client } = require('../../config/redis');

/**
 * SSE Manager for Queue Updates
 * Handles client connections and broadcasts queue position changes.
 */
class QueueSSEManager {
  constructor() {
    this.clients = new Map(); // doctorId -> Map(bookingId -> res)
  }

  /**
   * Adds a new SSE client connection.
   * @param {string} doctorId - Doctor's ID.
   * @param {string} bookingId - Unique booking ID or 'doctor'.
   * @param {object} res - Express response object.
   */
  addClient(doctorId, bookingId, res) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    if (!this.clients.has(doctorId)) {
      this.clients.set(doctorId, new Map());
    }
    this.clients.get(doctorId).set(bookingId, res);

    // Clean up on disconnect
    res.on('close', () => {
      const docClients = this.clients.get(doctorId);
      if (docClients) {
        docClients.delete(bookingId);
        if (docClients.size === 0) {
          this.clients.delete(doctorId);
        }
      }
    });

    console.log(`SSE Client connected: Doctor: ${doctorId}, Booking: ${bookingId}`);
  }

  /**
   * Broadcasts queue updates to all connected clients interested in a specific doctor's queue.
   * @param {string} doctorId - The ID of the doctor whose queue changed.
   */
  async broadcastQueueUpdate(doctorId) {
    try {
      const queue = await client.zRange(`queue:${doctorId}`, 0, -1);
      
      const docClients = this.clients.get(doctorId);
      if (!docClients) return;
      
      for (const [bookingId, res] of docClients.entries()) {
        const index = queue.findIndex(id => id === bookingId);
        
        if (index !== -1) {
          const payload = {
            position: index + 1,
            patientsAhead: index,
            total: queue.length,
            done: false,
          };
          res.write(`data: ${JSON.stringify(payload)}\n\n`);
        } else if (bookingId === 'doctor') {
          // If the client is a doctor, send them the full queue overview
          res.write(`data: ${JSON.stringify({ total: queue.length, queue })}\n\n`);
        }
      }
    } catch (err) {
      console.error('SSE Broadcast Error:', err);
    }
  }

  /**
   * Sends a completion event to a specific booking.
   * @param {string} doctorId 
   * @param {string} bookingId 
   */
  sendDone(doctorId, bookingId) {
    const docClients = this.clients.get(doctorId);
    if (docClients) {
      const res = docClients.get(bookingId);
      if (res) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        docClients.delete(bookingId);
      }
    }
  }
}

module.exports = new QueueSSEManager();
