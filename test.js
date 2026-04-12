const classEntry = {
    dayOfWeek: 0,
    startTime: "10:00",
    schedule: {
        // "14th of April" midnight BKK is "13th 17:00 UTC"
        startDate: new Date("2026-04-13T17:00:00.000Z")
    }
};

const classDate = new Date(classEntry.schedule.startDate.getTime());
console.log("1. Initial:", classDate.toISOString());

classDate.setUTCHours(classDate.getUTCHours() + 7); // Shift to BKK time
console.log("2. After +7:", classDate.toISOString());

const dayOffset = classEntry.dayOfWeek;
classDate.setUTCDate(classDate.getUTCDate() + dayOffset);
console.log("3. After offset:", classDate.toISOString());

if (classEntry.startTime) {
    const [hours, minutes] = classEntry.startTime.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
        classDate.setUTCHours(hours, minutes, 0, 0);
    }
}
console.log("4. After time set:", classDate.toISOString());

classDate.setUTCHours(classDate.getUTCHours() - 7);
console.log("5. Final:", classDate.toISOString());
