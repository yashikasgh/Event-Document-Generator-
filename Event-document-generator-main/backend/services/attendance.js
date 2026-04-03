import xlsx from "xlsx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { bufferToBase64, clampText } from "../utils.js";

const normalizeHeaderValue = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const scoreHeaderRow = (row = []) => {
  const normalized = row.map(normalizeHeaderValue);
  let score = 0;
  if (normalized.some((cell) => /(sr\.?\s*no|serial)/i.test(cell))) score += 2;
  if (normalized.some((cell) => /(admission|admn|enroll|enrol)/i.test(cell))) score += 3;
  if (normalized.some((cell) => /seat/i.test(cell))) score += 2;
  if (normalized.some((cell) => /name/i.test(cell))) score += 3;
  if (normalized.some((cell) => /student/i.test(cell))) score += 1;
  return score;
};

const findHeaderRowIndex = (rows = []) => {
  let bestIndex = 0;
  let bestScore = -1;

  rows.slice(0, 12).forEach((row, index) => {
    const score = scoreHeaderRow(Array.isArray(row) ? row : []);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
};

const detectColumns = (row = []) => {
  const keys = row.map(normalizeHeaderValue);
  const srNoIndex = keys.findIndex((key) => /(sr\.?\s*no|serial)/i.test(key));
  const admissionIndex = keys.findIndex((key) => /(admission|admn|enroll|enrol)/i.test(key));
  const seatIndex = keys.findIndex((key) => /seat/i.test(key));
  const nameIndex = keys.findIndex((key) => /name/i.test(key));
  const yearIndex = keys.findIndex((key) => /year/i.test(key));
  const branchIndex = keys.findIndex((key) => /branch|dept|department/i.test(key));
  const divisionIndex = keys.findIndex((key) => /division|div/i.test(key));

  return {
    srNoIndex: srNoIndex >= 0 ? srNoIndex : 0,
    admissionIndex: admissionIndex >= 0 ? admissionIndex : 1,
    seatIndex: seatIndex >= 0 ? seatIndex : 2,
    nameIndex: nameIndex >= 0 ? nameIndex : 3,
    yearIndex,
    branchIndex,
    divisionIndex,
  };
};

export const parseAttendanceFile = (fileBuffer, fileName = "students.csv") => {
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const safeRows = Array.isArray(rawRows) ? rawRows : [];
  const headerRowIndex = findHeaderRowIndex(safeRows);
  const headerRow = safeRows[headerRowIndex] || [];
  const columns = detectColumns(headerRow);

  const dataRows = safeRows.slice(headerRowIndex + 1);
  const students = dataRows
    .map((row, index) => {
      const values = Array.isArray(row) ? row : [];
      const srNo = clampText(values[columns.srNoIndex], 20) || String(index + 1);
      const admissionNo = clampText(values[columns.admissionIndex], 60) || "";
      const seatNo = clampText(values[columns.seatIndex], 60) || "";
      const name = clampText(values[columns.nameIndex], 120) || "";
      const year = columns.yearIndex >= 0 ? clampText(values[columns.yearIndex], 20) : "";
      const branch = columns.branchIndex >= 0 ? clampText(values[columns.branchIndex], 50) : "";
      const division = columns.divisionIndex >= 0 ? clampText(values[columns.divisionIndex], 20) : "";

      return {
        id: `${index + 1}`,
        srNo,
        admissionNo,
        seatNo,
        name,
        roll: admissionNo || `ADM-${index + 1}`,
        year,
        branch,
        division,
        selected: true,
      };
    })
    .filter((student) => student.name && (student.admissionNo || student.seatNo || student.srNo));

  const metadata = {
    sourceFile: fileName,
    rowsParsed: students.length,
    extractedColumns: ["Sr.No", "Admission No", "Seat No", "Name Of the Student"],
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
    { label: "Sr.No", key: "srNo", width: 48 },
    { label: "Admission No", key: "admissionNo", width: 86 },
    { label: "Seat No", key: "seatNo", width: 84 },
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

      if (column.key === "srNo") {
        drawCellText(student.srNo, cellX, y - 12, column.width, regular, 8, true);
      } else if (column.key === "admissionNo") {
        drawCellText(student.admissionNo, cellX, y - 12, column.width, regular, 8, true);
      } else if (column.key === "seatNo") {
        drawCellText(student.seatNo, cellX, y - 12, column.width, regular, 8, true);
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
