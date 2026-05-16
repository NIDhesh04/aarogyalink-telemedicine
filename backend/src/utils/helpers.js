/**
 * Checks whether a slot's date + startTime is in the past.
 *
 * @param {string} date      – 'YYYY-MM-DD'
 * @param {string} startTime – 'HH:mm' (24-hour) e.g. "08:00", "14:30"
 * @returns {boolean} true if the slot's start time has already passed.
 */
const isSlotInPast = (date, startTime) => {
  if (!date || !startTime) return false;

  // Build a Date object from the slot's date + startTime
  // Append +05:30 to explicitly parse as IST (Indian Standard Time)
  // e.g. "2026-05-16" + "08:00" → "2026-05-16T08:00:00+05:30"
  const slotDateTime = new Date(`${date}T${startTime}:00+05:30`);

  // Guard against invalid date strings
  if (isNaN(slotDateTime.getTime())) return false;

  return slotDateTime < new Date();
};

module.exports = { isSlotInPast };
