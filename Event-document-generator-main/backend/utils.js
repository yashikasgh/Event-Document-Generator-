import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 48,
};

const currencyNumberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const percentageFormatter = new Intl.NumberFormat("en-IN", {
  style: "percent",
  maximumFractionDigits: 1,
});

export const formatCurrency = (amount) => `Rs. ${currencyNumberFormatter.format(Number(amount || 0))}`;

export const formatPercent = (value) => percentageFormatter.format(Number(value || 0));

export const titleCase = (value = "") =>
  value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
    .trim();

export const safeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

export const clampText = (value = "", max = 5000) => String(value || "").trim().slice(0, max);

const hexToRgb = (hex = "#111111") => {
  const value = hex.replace("#", "").trim();
  const normalized = value.length === 3 ? value.split("").map((char) => `${char}${char}`).join("") : value;
  const int = Number.parseInt(normalized, 16);

  return {
    r: ((int >> 16) & 255) / 255,
    g: ((int >> 8) & 255) / 255,
    b: (int & 255) / 255,
  };
};

export const normalizeDate = (value) => {
  if (!value) {
    return new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const wrapText = (text, font, fontSize, maxWidth) => {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [""];
};

const parseDataUri = (value = "") => {
  const match = String(value).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  return {
    mime: match[1],
    bytes: Buffer.from(match[2], "base64"),
  };
};

const detectImageType = (bytes) => {
  if (!bytes || bytes.length < 4) {
    return null;
  }

  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;

  const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

  if (isPng) {
    return "png";
  }

  if (isJpg) {
    return "jpg";
  }

  return null;
};

export const buildPdfDocument = async ({
  title,
  collegeName,
  collegeAddress,
  documentLabel,
  date,
  subject,
  addressedTo,
  clubName,
  bodyParagraphs,
  highlights = [],
  analytics = [],
  footerText,
  collegeLogo,
  clubLogo,
  collegeAcronym,
  clubAcronym,
  collegeBrandColor,
  clubBrandColor,
  signatories = [],
}) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE.width, PAGE.height]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE.height - PAGE.margin;

  const drawImageIfPresent = async (value, x, topY) => {
    const parsed = parseDataUri(value);
    if (!parsed) {
      return;
    }

    try {
      const detectedType = detectImageType(parsed.bytes);
      const image =
        detectedType === "png"
          ? await pdfDoc.embedPng(parsed.bytes)
          : detectedType === "jpg"
            ? await pdfDoc.embedJpg(parsed.bytes)
            : parsed.mime === "image/png"
              ? await pdfDoc.embedPng(parsed.bytes)
              : await pdfDoc.embedJpg(parsed.bytes);

      const dimensions = image.scaleToFit(52, 52);
      page.drawImage(image, {
        x,
        y: topY - dimensions.height,
        width: dimensions.width,
        height: dimensions.height,
      });

      return true;
    } catch {
      return false;
    }
  };

  const drawBadge = (label, x, topY, hexColor) => {
    const color = hexToRgb(hexColor || "#111111");
    const size = 52;
    page.drawRectangle({
      x,
      y: topY - size,
      width: size,
      height: size,
      color: rgb(color.r, color.g, color.b),
    });

    const safeLabel = String(label || "").slice(0, 8);
    const textWidth = bold.widthOfTextAtSize(safeLabel, 10);
    page.drawText(safeLabel, {
      x: x + (size - textWidth) / 2,
      y: topY - size / 2 - 4,
      size: 10,
      font: bold,
      color: rgb(1, 1, 1),
    });
  };

  const collegeImageDrawn = await drawImageIfPresent(collegeLogo, PAGE.margin, y + 10);
  if (!collegeImageDrawn) {
    drawBadge(collegeAcronym || "PCCOE", PAGE.margin, y + 10, collegeBrandColor || "#111827");
  }

  const clubImageDrawn = await drawImageIfPresent(clubLogo, PAGE.width - PAGE.margin - 52, y + 10);
  if (!clubImageDrawn) {
    drawBadge(clubAcronym || "CLUB", PAGE.width - PAGE.margin - 52, y + 10, clubBrandColor || "#7c3aed");
  }

  page.drawText(title || documentLabel, {
    x: PAGE.margin,
    y,
    size: 17,
    font: bold,
    color: rgb(0.08, 0.08, 0.08),
  });
  y -= 24;

  const headerCenter = collegeName || "College Name";
  const headerCenterWidth = bold.widthOfTextAtSize(headerCenter, 14);
  page.drawText(headerCenter, {
    x: (PAGE.width - headerCenterWidth) / 2,
    y,
    size: 14,
    font: bold,
  });
  y -= 18;

  const addressText = collegeAddress || "College Address";
  const addressWidth = font.widthOfTextAtSize(addressText, 10);
  page.drawText(addressText, {
    x: (PAGE.width - addressWidth) / 2,
    y,
    size: 10,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });
  y -= 28;

  page.drawLine({
    start: { x: PAGE.margin, y },
    end: { x: PAGE.width - PAGE.margin, y },
    thickness: 1.3,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 22;

  const metaRows = [
    `Date: ${normalizeDate(date)}`,
    `Subject: ${subject || documentLabel}`,
    `To: ${addressedTo || "Respective authority"}`,
    `Club: ${clubName || "General"}`,
  ];

  for (const row of metaRows) {
    page.drawText(row, {
      x: PAGE.margin,
      y,
      size: 11,
      font: row.startsWith("Date:") ? font : bold,
    });
    y -= 18;
  }

  y -= 8;

  const contentWidth = PAGE.width - PAGE.margin * 2;
  for (const paragraph of bodyParagraphs) {
    const lines = wrapText(paragraph, font, 11, contentWidth);
    for (const line of lines) {
      if (y < 96) {
        break;
      }
      page.drawText(line, {
        x: PAGE.margin,
        y,
        size: 11,
        font,
        color: rgb(0.12, 0.12, 0.12),
      });
      y -= 15;
    }
    y -= 10;
  }

  const drawBulletSection = (heading, items) => {
    if (items.length === 0 || y < 120) {
      return;
    }

    page.drawText(heading, {
      x: PAGE.margin,
      y,
      size: 12,
      font: bold,
    });
    y -= 18;

    for (const item of items) {
      const lines = wrapText(`- ${item}`, font, 10.5, contentWidth - 10);
      for (const line of lines) {
        if (y < 88) {
          break;
        }
        page.drawText(line, {
          x: PAGE.margin + 10,
          y,
          size: 10.5,
          font,
        });
        y -= 14;
      }
    }
    y -= 8;
  };

  drawBulletSection("Key Highlights", safeArray(highlights));
  drawBulletSection("Analytics", safeArray(analytics));

  if (signatories.length > 0) {
    const signatureY = 120;
    const blockWidth = 180;
    const gap = 40;
    signatories.slice(0, 2).forEach((signatory, index) => {
      const x = PAGE.margin + index * (blockWidth + gap);
      page.drawLine({
        start: { x, y: signatureY + 24 },
        end: { x: x + blockWidth - 20, y: signatureY + 24 },
        thickness: 0.8,
        color: rgb(0.35, 0.35, 0.35),
      });
      page.drawText(signatory.name || "Signature", {
        x,
        y: signatureY + 8,
        size: 10,
        font: bold,
      });
      page.drawText(signatory.designation || "Designation", {
        x,
        y: signatureY - 8,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    });
  }

  const footer = footerText || "Generated by DocuPrint";
  page.drawLine({
    start: { x: PAGE.margin, y: 58 },
    end: { x: PAGE.width - PAGE.margin, y: 58 },
    thickness: 0.8,
    color: rgb(0.8, 0.8, 0.8),
  });
  page.drawText(footer, {
    x: PAGE.margin,
    y: 42,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  return Buffer.from(await pdfDoc.save());
};

export const bufferToBase64 = (buffer) => Buffer.from(buffer).toString("base64");
