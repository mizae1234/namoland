const startDate = new Date("2026-04-13T00:00:00Z"); // Suppose BKK monday. Wait, in Hostinger, UTC "2026-04-12T17:00:00.000Z".
let classDate = new Date("2026-04-12T17:00:00.000Z");
classDate.setUTCHours(classDate.getUTCHours() + 7);
const dayOffset = 1; // Tuesday
classDate.setUTCDate(classDate.getUTCDate() + dayOffset);
classDate.setUTCHours(classDate.getUTCHours() - 7);

console.log("Original:", new Date("2026-04-12T17:00:00.000Z").toISOString());
console.log("Calculated classDate (UTC):", classDate.toISOString());

// Now what if startDate was created using `new Date(2026, 3, 14)` in +0700:
// it's `2026-04-13T17:00:00Z`
classDate = new Date("2026-04-13T17:00:00Z");
classDate.setUTCHours(classDate.getUTCHours() + 7);
classDate.setUTCDate(classDate.getUTCDate() + 1);
classDate.setUTCHours(classDate.getUTCHours() - 7);
console.log("Local +0700 Monday -> Tuesday:", classDate.toISOString());
