import { format } from "date-fns";
import { StoredBudgetRecord } from "@/lib/budgetStorage";

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const flattenRows = (records: StoredBudgetRecord[]) =>
  records.flatMap((record) =>
    record.items.map((item) => ({
      Event: record.title,
      Category: record.category,
      ExpenseTitle: item.label,
      Amount: item.amount,
      Date: item.purchaseDate || record.date,
      PaymentMethod: item.paymentMethod || record.paymentMethod,
      ExpenseID: item.expenseId || item.id,
      Vendor: item.vendorName || record.vendor,
      Notes: item.notes,
    }))
  );

export const createBudgetPdfObjectUrl = async (records: StoredBudgetRecord[]) => {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();

  page.drawText("College Budget Report", { x: 42, y: height - 42, size: 24, font: bold, color: rgb(0.09, 0.09, 0.1) });
  page.drawText(`Generated ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, { x: 42, y: height - 62, size: 10, font, color: rgb(0.4, 0.42, 0.45) });

  let y = height - 100;
  flattenRows(records).slice(0, 20).forEach((row) => {
    page.drawText(String(row.Event).slice(0, 18), { x: 42, y, size: 9, font });
    page.drawText(String(row.ExpenseTitle).slice(0, 24), { x: 180, y, size: 9, font });
    page.drawText(String(row.Date).slice(0, 14), { x: 365, y, size: 9, font });
    page.drawText(String(row.PaymentMethod).slice(0, 14), { x: 485, y, size: 9, font });
    page.drawText(String(row.ExpenseID).slice(0, 12), { x: 620, y, size: 9, font });
    page.drawText(String(row.Amount), { x: 735, y, size: 9, font: bold });
    y -= 18;
  });

  const bytes = await pdf.save();
  return URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
};

export const exportBudgetExcel = async (records: StoredBudgetRecord[]) => {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(flattenRows(records));
  XLSX.utils.book_append_sheet(workbook, sheet, "Budget Report");
  XLSX.writeFile(workbook, `budget-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};

export const exportBudgetPdf = async (records: StoredBudgetRecord[]) => {
  const url = await createBudgetPdfObjectUrl(records);
  const response = await fetch(url);
  const blob = await response.blob();
  downloadBlob(blob, `budget-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  URL.revokeObjectURL(url);
};
