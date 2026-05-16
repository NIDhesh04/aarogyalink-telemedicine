/**
 * Checks whether a slot's date + startTime is in the past.
 *
 * @param {string} date      – 'YYYY-MM-DD'
 * @param {string} startTime – 'HH:mm' (24-hour) e.g. "08:00", "14:30"
 * @returns {boolean} true if the slot's start time has already passed.
 */
const isSlotInPast = (date, startTime) => {
  if (!date || !startTime) return false;

  // Parse as UTC midnight + time offset, then compare with current UTC time.
  // Avoid hardcoding +05:30 — the server may run in any timezone (Railway = UTC).
  // Instead, treat the date+time as a naive local time and compare using
  // the UTC equivalent by reading the date parts directly.
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute]     = startTime.split(':').map(Number);

  // Construct using Date.UTC so behaviour is identical on every server timezone
  const slotUTC = Date.UTC(year, month - 1, day, hour, minute, 0);

  // Guard against invalid date strings
  if (isNaN(slotUTC)) return false;

  // Compare against IST offset (UTC+5:30 = 330 minutes)
  // This makes "10:00" mean 10:00 IST regardless of where the server runs
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const slotIST = slotUTC - IST_OFFSET_MS;

  return slotIST < Date.now();
};

module.exports = { isSlotInPast };