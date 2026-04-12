const startDate = new Date("2025-05-11T17:00:00.000Z");
const dayOffset = 3 - 1; // Wednesday = 3
const classDate = new Date(startDate);
classDate.setDate(classDate.getDate() + dayOffset);
classDate.setHours(15, 30, 0, 0);

console.log("OS Timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log("startDate:", startDate.toISOString());
console.log("classDate:", classDate.toISOString());

function formatReportDate(d) {
    const day = d.getDate().toString().padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
}
console.log("Report display:", formatReportDate(classDate));
