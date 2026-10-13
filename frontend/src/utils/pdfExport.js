import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const str = String(timeStr).trim().toUpperCase();
  const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3];
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  return 0;
};

export const sortTimetableEntries = (entries) => {
  return [...entries].sort((a, b) => {
    const dayA = a.timeSlot?.day || "";
    const dayB = b.timeSlot?.day || "";
    const idxA = DAY_ORDER.indexOf(dayA);
    const idxB = DAY_ORDER.indexOf(dayB);
    const dayDiff = (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    if (dayDiff !== 0) return dayDiff;

    const startA = parseTimeToMinutes(a.timeSlot?.startTime);
    const startB = parseTimeToMinutes(b.timeSlot?.startTime);
    if (startA !== startB) return startA - startB;

    const endA = parseTimeToMinutes(a.timeSlot?.endTime);
    const endB = parseTimeToMinutes(b.timeSlot?.endTime);
    return endA - endB;
  });
};

/**
 * Format date string nicely: "October 13, 2026, 4:00 PM"
 */
function getFormattedGeneratedDate() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Exports Student Lecture Timetable to PDF.
 */
export function exportStudentTimetablePDF({
  student,
  session,
  semester,
  entries = [],
  universityName = "UniSchedule University",
  logoDataUrl,
  fileName,
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const generatedDate = getFormattedGeneratedDate();

  // Institution and Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(universityName, pageWidth / 2, 38, { align: "center" });

  doc.setFontSize(13);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text("Student Lecture Timetable", pageWidth / 2, 56, { align: "center" });

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(1);
  doc.line(36, 66, pageWidth - 36, 66);

  // Student Identification Section
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85); // slate-700

  const col1X = 40;
  const col2X = 320;
  const col3X = 580;
  let topY = 82;
  const lineSpacing = 14;

  const fullName = student?.fullName || "Not Specified";
  const matric = student?.matricNumber || "N/A";
  const deptName = student?.department?.name || student?.programme?.department?.name || "Not Assigned";
  const facultyName = student?.department?.faculty?.name || student?.faculty?.name || "N/A";
  const levelName = student?.level?.name || "N/A";
  const progName = student?.programme?.name || "";
  const sessionName = session || entries[0]?.session?.name || "N/A";
  const semesterName = semester || entries[0]?.semester || "N/A";

  // Column 1
  doc.setFont("helvetica", "bold");
  doc.text("Student Name:", col1X, topY);
  doc.setFont("helvetica", "normal");
  doc.text(fullName, col1X + 80, topY);

  doc.setFont("helvetica", "bold");
  doc.text("Matric No:", col1X, topY + lineSpacing);
  doc.setFont("helvetica", "normal");
  doc.text(matric, col1X + 80, topY + lineSpacing);

  if (progName) {
    doc.setFont("helvetica", "bold");
    doc.text("Programme:", col1X, topY + lineSpacing * 2);
    doc.setFont("helvetica", "normal");
    doc.text(progName, col1X + 80, topY + lineSpacing * 2);
  }

  // Column 2
  doc.setFont("helvetica", "bold");
  doc.text("Department:", col2X, topY);
  doc.setFont("helvetica", "normal");
  doc.text(deptName, col2X + 75, topY);

  doc.setFont("helvetica", "bold");
  doc.text("Faculty:", col2X, topY + lineSpacing);
  doc.setFont("helvetica", "normal");
  doc.text(facultyName, col2X + 75, topY + lineSpacing);

  doc.setFont("helvetica", "bold");
  doc.text("Academic Level:", col2X, topY + lineSpacing * 2);
  doc.setFont("helvetica", "normal");
  doc.text(levelName, col2X + 85, topY + lineSpacing * 2);

  // Column 3
  doc.setFont("helvetica", "bold");
  doc.text("Academic Session:", col3X, topY);
  doc.setFont("helvetica", "normal");
  doc.text(sessionName, col3X + 95, topY);

  doc.setFont("helvetica", "bold");
  doc.text("Semester:", col3X, topY + lineSpacing);
  doc.setFont("helvetica", "normal");
  doc.text(semesterName, col3X + 95, topY + lineSpacing);

  doc.setFont("helvetica", "bold");
  doc.text("Date Generated:", col3X, topY + lineSpacing * 2);
  doc.setFont("helvetica", "normal");
  doc.text(generatedDate, col3X + 95, topY + lineSpacing * 2);

  const tableStartY = topY + lineSpacing * 2 + 18;

  const sortedEntries = sortTimetableEntries(entries);

  if (!sortedEntries.length) {
    autoTable(doc, {
      startY: tableStartY,
      head: [["Day", "Course Code", "Course Title", "Start Time", "End Time", "Venue", "Lecturer"]],
      body: [["-", "-", "No timetable entries published for this session/semester.", "-", "-", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 8, halign: "center" },
      columnStyles: { 2: { halign: "left" } },
    });
  } else {
    const tableBody = sortedEntries.map((e) => [
      e.timeSlot?.day || "-",
      e.course?.code || "-",
      e.course?.title || "-",
      e.timeSlot?.startTime || "-",
      e.timeSlot?.endTime || "-",
      e.venue?.name || "-",
      e.lecturer?.fullName || "Unassigned",
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [["Day", "Course Code", "Course Title", "Start Time", "End Time", "Venue", "Lecturer"]],
      body: tableBody,
      theme: "striped",
      showHead: "everyPage",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
      },
      styles: {
        fontSize: 8,
        cellPadding: 5,
        valign: "middle",
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 70, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 75, halign: "center", fontStyle: "bold" },
        2: { cellWidth: 230, halign: "left" },
        3: { cellWidth: 65, halign: "center" },
        4: { cellWidth: 65, halign: "center" },
        5: { cellWidth: 100, halign: "center" },
        6: { cellWidth: 155, halign: "left" },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawPage: (data) => {
        const totalPages = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
          `Page ${data.pageNumber} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 16,
          { align: "center" }
        );
        doc.text(
          `Official Document — ${universityName}`,
          40,
          pageHeight - 16
        );
        doc.text(`Generated on ${generatedDate}`, pageWidth - 40, pageHeight - 16, { align: "right" });
      },
    });
  }

  const outName = fileName || `${(student?.fullName || "Student").replace(/\s+/g, "_")}_Timetable.pdf`;
  doc.save(outName);
}

/**
 * Exports Lecturer Lecture Timetable to PDF.
 */
export function exportLecturerTimetablePDF({
  lecturer,
  session,
  semester,
  entries = [],
  universityName = "UniSchedule University",
  logoDataUrl,
  fileName,
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const generatedDate = getFormattedGeneratedDate();

  // Institution and Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(universityName, pageWidth / 2, 38, { align: "center" });

  doc.setFontSize(13);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text("Lecturer Lecture Timetable", pageWidth / 2, 56, { align: "center" });

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(1);
  doc.line(36, 66, pageWidth - 36, 66);

  // Lecturer Identification Section
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85); // slate-700

  const col1X = 40;
  const col2X = 320;
  const col3X = 580;
  let topY = 82;
  const lineSpacing = 14;

  const titlePrefix = lecturer?.title ? `${lecturer.title} ` : "";
  const fullName = `${titlePrefix}${lecturer?.fullName || "Lecturer"}`.trim();
  const staffId = lecturer?.staffId || "N/A";
  const deptName = lecturer?.department?.name || "Not Assigned";
  const facultyName = lecturer?.department?.faculty?.name || lecturer?.faculty?.name || "N/A";
  const sessionName = session || entries[0]?.session?.name || "N/A";
  const semesterName = semester || entries[0]?.semester || "N/A";

  // Column 1
  doc.setFont("helvetica", "bold");
  doc.text("Lecturer Name:", col1X, topY);
  doc.setFont("helvetica", "normal");
  doc.text(fullName, col1X + 85, topY);

  doc.setFont("helvetica", "bold");
  doc.text("Staff ID:", col1X, topY + lineSpacing);
  doc.setFont("helvetica", "normal");
  doc.text(staffId, col1X + 85, topY + lineSpacing);

  if (lecturer?.officeLocation) {
    doc.setFont("helvetica", "bold");
    doc.text("Office:", col1X, topY + lineSpacing * 2);
    doc.setFont("helvetica", "normal");
    doc.text(lecturer.officeLocation, col1X + 85, topY + lineSpacing * 2);
  }

  // Column 2
  doc.setFont("helvetica", "bold");
  doc.text("Department:", col2X, topY);
  doc.setFont("helvetica", "normal");
  doc.text(deptName, col2X + 75, topY);

  doc.setFont("helvetica", "bold");
  doc.text("Faculty:", col2X, topY + lineSpacing);
  doc.setFont("helvetica", "normal");
  doc.text(facultyName, col2X + 75, topY + lineSpacing);

  if (lecturer?.email) {
    doc.setFont("helvetica", "bold");
    doc.text("Email:", col2X, topY + lineSpacing * 2);
    doc.setFont("helvetica", "normal");
    doc.text(lecturer.email, col2X + 75, topY + lineSpacing * 2);
  }

  // Column 3
  doc.setFont("helvetica", "bold");
  doc.text("Academic Session:", col3X, topY);
  doc.setFont("helvetica", "normal");
  doc.text(sessionName, col3X + 95, topY);

  doc.setFont("helvetica", "bold");
  doc.text("Semester:", col3X, topY + lineSpacing);
  doc.setFont("helvetica", "normal");
  doc.text(semesterName, col3X + 95, topY + lineSpacing);

  doc.setFont("helvetica", "bold");
  doc.text("Date Generated:", col3X, topY + lineSpacing * 2);
  doc.setFont("helvetica", "normal");
  doc.text(generatedDate, col3X + 95, topY + lineSpacing * 2);

  const tableStartY = topY + lineSpacing * 2 + 18;

  const sortedEntries = sortTimetableEntries(entries);

  if (!sortedEntries.length) {
    autoTable(doc, {
      startY: tableStartY,
      head: [["Day", "Course Code", "Course Title", "Department", "Level", "Start Time", "End Time", "Venue"]],
      body: [["-", "-", "No teaching schedule assignments published for this session/semester.", "-", "-", "-", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 8, halign: "center" },
      columnStyles: { 2: { halign: "left" } },
    });
  } else {
    const tableBody = sortedEntries.map((e) => [
      e.timeSlot?.day || "-",
      e.course?.code || "-",
      e.course?.title || "-",
      e.department?.name || e.course?.department?.name || deptName || "-",
      e.level?.name || e.course?.level?.name || "-",
      e.timeSlot?.startTime || "-",
      e.timeSlot?.endTime || "-",
      e.venue?.name || "-",
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [["Day", "Course Code", "Course Title", "Department", "Level", "Start Time", "End Time", "Venue"]],
      body: tableBody,
      theme: "striped",
      showHead: "everyPage",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
      },
      styles: {
        fontSize: 8,
        cellPadding: 5,
        valign: "middle",
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 65, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 70, halign: "center", fontStyle: "bold" },
        2: { cellWidth: 200, halign: "left" },
        3: { cellWidth: 125, halign: "left" },
        4: { cellWidth: 70, halign: "center" },
        5: { cellWidth: 65, halign: "center" },
        6: { cellWidth: 65, halign: "center" },
        7: { cellWidth: 100, halign: "center" },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawPage: (data) => {
        const totalPages = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
          `Page ${data.pageNumber} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 16,
          { align: "center" }
        );
        doc.text(
          `Official Document — ${universityName}`,
          40,
          pageHeight - 16
        );
        doc.text(`Generated on ${generatedDate}`, pageWidth - 40, pageHeight - 16, { align: "right" });
      },
    });
  }

  const outName = fileName || `${(lecturer?.fullName || "Lecturer").replace(/\s+/g, "_")}_Teaching_Timetable.pdf`;
  doc.save(outName);
}

/**
 * Universal wrapper for backward compatibility.
 */
export function exportTimetablePDF(opts = {}) {
  if (opts.role === "lecturer" || opts.lecturer) {
    return exportLecturerTimetablePDF({
      lecturer: opts.lecturer || { fullName: opts.personName, department: { name: opts.personLine2 } },
      session: opts.session,
      semester: opts.semester,
      entries: opts.entries,
      universityName: opts.universityName,
      logoDataUrl: opts.logoDataUrl,
      fileName: opts.fileName,
    });
  }
  return exportStudentTimetablePDF({
    student: opts.student || { fullName: opts.personName, department: { name: opts.personLine2 } },
    session: opts.session,
    semester: opts.semester,
    entries: opts.entries,
    universityName: opts.universityName,
    logoDataUrl: opts.logoDataUrl,
    fileName: opts.fileName,
  });
}
