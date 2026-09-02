import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Renders a timetable (grid of Day x Time -> Course) to a downloadable PDF.
 *
 * @param {Object} opts
 * @param {string} opts.universityName
 * @param {string} [opts.logoDataUrl] base64 PNG/JPEG data URL for the crest/logo
 * @param {string} opts.personName    lecturer or student name
 * @param {string} opts.personLine2   e.g. "Department of Computer Science" or "300 Level"
 * @param {string} opts.session       e.g. "2025/2026"
 * @param {string} opts.semester      e.g. "First Semester"
 * @param {Array}  opts.entries       populated timetable entries
 * @param {string} [opts.fileName]
 */
export function exportTimetablePDF({
  universityName = "University Timetable",
  logoDataUrl,
  personName,
  personLine2,
  session,
  semester,
  entries = [],
  fileName = "timetable.pdf",
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // ---- Header ----
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", 40, 24, 50, 50);
    } catch (_) {
      /* ignore bad image data */
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(universityName, pageWidth / 2, 40, { align: "center" });
  doc.setFontSize(12);
  doc.text("Official Lecture Timetable", pageWidth / 2, 58, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Name: ${personName || "-"}`, 40, 92);
  doc.text(`${personLine2 || ""}`, 40, 106);
  doc.text(`Academic Session: ${session || "-"}`, pageWidth - 240, 92);
  doc.text(`Semester: ${semester || "-"}`, pageWidth - 240, 106);

  // ---- Build grid ----
  const days = DAY_ORDER.filter((d) => entries.some((e) => e.timeSlot?.day === d));
  const activeDays = days.length ? days : DAY_ORDER;

  const timeLabels = [...new Set(entries.map((e) => `${e.timeSlot?.startTime}-${e.timeSlot?.endTime}`))].sort();

  const grid = timeLabels.map((label) => {
    const [start, end] = label.split("-");
    const row = { time: `${start} - ${end}` };
    activeDays.forEach((day) => {
      const entry = entries.find(
        (e) => e.timeSlot?.day === day && e.timeSlot?.startTime === start && e.timeSlot?.endTime === end
      );
      row[day] = entry ? `${entry.course?.code || ""}\n${entry.venue?.name || ""}` : "";
    });
    return row;
  });

  autoTable(doc, {
    startY: 122,
    head: [["Time", ...activeDays]],
    body: grid.map((row) => [row.time, ...activeDays.map((d) => row[d] || "")]),
    theme: "grid",
    headStyles: { fillColor: [30, 39, 97], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 6, valign: "middle", halign: "center" },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 90 } },
  });

  // ---- Legend / detail list ----
  const finalY = doc.lastAutoTable.finalY + 20;
  const uniqueCourses = [...new Map(entries.map((e) => [e.course?.code, e])).values()];

  autoTable(doc, {
    startY: finalY,
    head: [["Course Code", "Course Title", "Lecturer", "Venue"]],
    body: uniqueCourses.map((e) => [
      e.course?.code || "-",
      e.course?.title || "-",
      e.lecturer?.fullName || "-",
      e.venue?.name || "-",
    ]),
    theme: "striped",
    headStyles: { fillColor: [67, 56, 202] },
    styles: { fontSize: 8 },
  });

  const generatedY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 40, generatedY);
  doc.text("UniSchedule Lecture Timetable Scheduling System", pageWidth - 240, generatedY);

  doc.save(fileName);
}
