const { isSlotInPast } = require('./backend/src/utils/helpers');

console.log("Current time:", new Date().toString());
console.log("isSlotInPast('2026-05-16', '08:00'):", isSlotInPast('2026-05-16', '08:00'));
console.log("isSlotInPast('2026-05-16', '23:00'):", isSlotInPast('2026-05-16', '23:00'));
