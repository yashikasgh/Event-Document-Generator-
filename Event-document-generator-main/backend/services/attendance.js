import xlsx from "xlsx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { bufferToBase64, clampText } from "../utils.js";

const detectColumns = (row = {}) => {
  const keys = Object.keys(row);
  const nameKey = keys.find((key) => /name/i.test(key)) || keys[0];
  const rollKey = keys.find((key) => /(roll|enroll|reg)/i.test(key)) || keys[1];
  const yearKey = keys.find((key) => /year/i.test(key));
  const branchKey = keys.find((key) => /branch|dept/i.test(key));
  const divisionKey = keys.find((key) => /division|div/i.test(key));

  return { nameKey, rollKey, yearKey, branchKey, divisionKey };
};

export const parseAttendanceFile = (fileBuffer, fileName = "students.csv") => {
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  const columns = detectColumns(rawRows[0]);

  const students = rawRows
    .map((row, index) => ({
      id: `${index + 1}`,
      name: clampText(row[columns.nameKey], 120) || `Student ${index + 1}`,
      roll: clampText(row[columns.rollKey], 60) || `ROLL-${index + 1}`,
      year: columns.yearKey ? clampText(row[columns.yearKey], 20) : "",
      branch: columns.branchKey ? clampText(row[columns.branchKey], 50) : "",
      division: columns.divisionKey ? clampText(row[columns.divisionKey], 20) : "",
      selected: true,
    }))
    .filter((student) => student.name || student.roll);

  const metadata = {
    sourceFile: fileName,
    rowsParsed: students.length,
    years: [...new Set(students.map((student) => student.year).filter(Boolean))],
    branches: [...new Set(students.map((student) => student.branch).filter(Boolean))],
    divisions: [...new Set(students.map((student) => student.division).filter(Boolean))],
  };

  return { students, metadata };
};

export const buildAttendancePdf = async (payload) => {
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const margin = 18;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawCellText = (text, x, y, width, font, size = 8, center = false) => {
    const safeText = clampText(String(text || ""), 80);
    const textWidth = font.widthOfTextAtSize(safeText, size);
    page.drawText(safeText, {
      x: center ? x + (width - textWidth) / 2 : x + 4,
      y,
      size,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
  };

  let x = margin;
  let y = pageHeight - margin - 4;
  const headerHeight = 18;
  const logoSize = 28;

  page.drawRectangle({ x, y: y - headerHeight, width: pageWidth - margin * 2, height: headerHeight, borderWidth: 0.7, borderColor: rgb(0.2, 0.2, 0.2), color: rgb(1, 1, 1) });
  page.drawText("PCE", { x: x + 10, y: y - 12, size: 16, font: bold, color: rgb(0.45, 0.08, 0.08) });
  page.drawText(payload.instituteName || "Pillai College of Engineering", { x: x + 210, y: y - 11, size: 10, font: bold });
  y -= headerHeight;

  page.drawRectangle({ x, y: y - headerHeight, width: pageWidth - margin * 2, height: headerHeight, borderWidth: 0.7, borderColor: rgb(0.2, 0.2, 0.2), color: rgb(1, 1, 1) });
  page.drawRectangle({ x: x + 6, y: y - logoSize + 2, width: logoSize, height: logoSize, borderWidth: 0.7, borderColor: rgb(0.2, 0.2, 0.2), color: rgb(1, 1, 1) });
  page.drawText("PCE", { x: x + 10, y: y - 16, size: 11, font: bold, color: rgb(0.45, 0.08, 0.08) });
  page.drawText(payload.collegeName || "Pillai College of Engineering", { x: x + 250, y: y - 11, size: 11, font: bold });
  y -= headerHeight;

  page.drawRectangle({ x, y: y - headerHeight, width: pageWidth - margin * 2, height: headerHeight, borderWidth: 0.7, borderColor: rgb(0.2, 0.2, 0.2), color: rgb(1, 1, 1) });
  page.drawText(payload.departmentName || `${payload.branch || "Department"} Department`, { x: x + 275, y: y - 11, size: 10, font: bold });
  y -= headerHeight + 4;

  const metaLine = `CLASS: ${payload.year || "-"}    BRANCH: ${payload.branch || "-"}    DIVISION: ${payload.division || "-"}    AY: ${payload.academicYear || "-"}    SUBJECT: ${payload.eventTitle || "Attendance Sheet"}    FACULTY: ${payload.clubName || "-"}`;
  page.drawRectangle({ x, y: y - 18, width: pageWidth - margin * 2, height: 18, borderWidth: 0.7, borderColor: rgb(0.2, 0.2, 0.2), color: rgb(1, 1, 1) });
  page.drawText(metaLine, { x: x + 8, y: y - 12, size: 8.4, font: bold });
  y -= 18;

  const columns = [
    { label: "Roll No.", key: "roll", width: 58 },
    { label: "Admission Number", key: "roll", width: 78 },
    { label: "Name of Student", key: "name", width: 176 },
    ...Array.from({ length: 10 }, (_, index) => ({ label: String(index + 1), key: `lecture-${index + 1}`, width: 42 })),
    { label: "Total Attended", key: "total", width: 76 },
  ];

  const headerRowHeight = 18;
  let headerX = x;
  columns.forEach((column) => {
    page.drawRectangle({
      x: headerX,
      y: y - headerRowHeight,
      width: column.width,
      height: headerRowHeight,
      borderWidth: 0.6,
      borderColor: rgb(0.2, 0.2, 0.2),
      color: rgb(1, 1, 1),
    });
    drawCellText(column.label, headerX, y - 12, column.width, bold, 8, true);
    headerX += column.width;
  });
  y -= headerRowHeight;

  const students = Array.isArray(payload.students) ? payload.students : [];
  const maxRows = Math.min(students.length, 24);
  for (let rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
    const student = students[rowIndex];
    let cellX = x;
    const rowHeight = 18;
    columns.forEach((column) => {
      page.drawRectangle({
        x: cellX,
        y: y - rowHeight,
        width: column.width,
        height: rowHeight,
        borderWidth: 0.45,
        borderColor: rgb(0.3, 0.3, 0.3),
        color: rgb(1, 1, 1),
      });

      if (column.key === "roll") {
        drawCellText(student.roll, cellX, y - 12, column.width, regular, 8, true);
      } else if (column.key === "name") {
        drawCellText(student.name, cellX, y - 12, column.width, regular, 8, false);
      }

      cellX += column.width;
    });
    y -= rowHeight;
  }

  return {
    fileName: `${(payload.eventTitle || "attendance-sheet").replace(/\s+/g, "-").toLowerCase()}.pdf`,
    pdfBase64: bufferToBase64(await pdfDoc.save()),
  };
};
