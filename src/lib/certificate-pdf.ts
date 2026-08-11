import { PDFDocument, PDFPage, rgb, StandardFonts } from "pdf-lib";

export type CertificatePdfData = {
  certificateId: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  grade: number;
  issuedAt: Date | string;
};

const BRAND = rgb(0, 1, 0.8); // #00FFCC
const INK = rgb(0.1, 0.12, 0.16);
const MUTED = rgb(0.35, 0.38, 0.45);
const CREAM = rgb(0.98, 0.98, 0.97);
const BORDER = rgb(0.75, 0.62, 0.25);
const LOGO_BG = rgb(0.043, 0.071, 0.125); // #0B1220

/** Draw the EduFlow mark (matches public/icon.svg) at bottom-left of logo box. */
function drawEduflowLogo(page: PDFPage, x: number, y: number, size: number) {
  const s = size / 32;

  page.drawRectangle({
    x,
    y,
    width: size,
    height: size,
    color: LOGO_BG,
    borderColor: BRAND,
    borderWidth: Math.max(0.6, size * 0.03),
    opacity: 1,
    borderOpacity: 0.35,
  });

  // SVG Y grows down; PDF Y grows up — flip with (32 - y)
  // Cap top
  page.drawSvgPath("M16 23.5 L5.5 18.75 L16 14 L26.5 18.75 Z", {
    x,
    y,
    scale: s,
    color: BRAND,
  });
  // Cap body
  page.drawSvgPath(
    "M9.5 16.9 V12.6 C9.5 12.6 12.2 10.5 16 10.5 C19.8 10.5 22.5 12.6 22.5 12.6 V16.9 L16 13.9 Z",
    {
      x,
      y,
      scale: s,
      color: BRAND,
      opacity: 0.85,
    }
  );
  // Tassel
  page.drawSvgPath(
    "M25.2 18.2 V13.4 C25.9 13.15 26.4 12.5 26.4 11.7 C26.4 10.65 25.55 9.8 24.5 9.8 C23.45 9.8 22.6 10.65 22.6 11.7 C22.6 12.45 23.05 13.1 23.7 13.35 V18.2 H25.2 Z",
    {
      x,
      y,
      scale: s,
      color: BRAND,
    }
  );
}

/** Builds a landscape A4 certificate PDF (best format for print/share). */
export async function buildCertificatePdf(
  data: CertificatePdfData
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const { width, height } = page.getSize();

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontSerif = await pdf.embedFont(StandardFonts.TimesRomanBoldItalic);

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: CREAM,
  });

  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: BORDER,
    borderWidth: 3,
  });
  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderColor: BRAND,
    borderWidth: 1,
  });

  const centerX = width / 2;
  const issued =
    data.issuedAt instanceof Date
      ? data.issuedAt
      : new Date(data.issuedAt);
  const issuedLabel = issued.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const drawCentered = (
    text: string,
    y: number,
    size: number,
    f = font,
    color = INK
  ) => {
    const tw = f.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: centerX - tw / 2,
      y,
      size,
      font: f,
      color,
    });
  };

  // Logo + wordmark centered at top
  const logoSize = 36;
  const word = "EDUFLOW";
  const wordSize = 14;
  const wordW = fontBold.widthOfTextAtSize(word, wordSize);
  const gap = 10;
  const brandRowW = logoSize + gap + wordW;
  const brandX = centerX - brandRowW / 2;
  const brandY = height - 98;
  drawEduflowLogo(page, brandX, brandY, logoSize);
  page.drawText(word, {
    x: brandX + logoSize + gap,
    y: brandY + 11,
    size: wordSize,
    font: fontBold,
    color: BRAND,
  });

  drawCentered("Certificate of Completion", height - 145, 32, fontBold, INK);
  drawCentered("This is to certify that", height - 185, 12, font, MUTED);
  drawCentered(data.studentName || "Student", height - 230, 28, fontSerif, INK);
  drawCentered(
    "has successfully completed the course",
    height - 270,
    12,
    font,
    MUTED
  );

  const courseSize = data.courseTitle.length > 48 ? 16 : 20;
  drawCentered(data.courseTitle, height - 310, courseSize, fontBold, BRAND);

  const detailsY = 140;
  const col1 = 120;
  const col2 = 320;
  const col3 = 520;

  page.drawText("Instructor", {
    x: col1,
    y: detailsY + 36,
    size: 9,
    font,
    color: MUTED,
  });
  page.drawText(data.instructorName || "EduFlow Instructor", {
    x: col1,
    y: detailsY + 18,
    size: 12,
    font: fontBold,
    color: INK,
  });

  page.drawText("Grade", {
    x: col2,
    y: detailsY + 36,
    size: 9,
    font,
    color: MUTED,
  });
  page.drawText(`${Math.round(data.grade)}%`, {
    x: col2,
    y: detailsY + 18,
    size: 12,
    font: fontBold,
    color: INK,
  });

  page.drawText("Issued", {
    x: col3,
    y: detailsY + 36,
    size: 9,
    font,
    color: MUTED,
  });
  page.drawText(issuedLabel, {
    x: col3,
    y: detailsY + 18,
    size: 12,
    font: fontBold,
    color: INK,
  });

  drawCentered(`Certificate ID: ${data.certificateId}`, 78, 10, font, MUTED);
  drawCentered(
    "Verify at /certificates/verify/" + data.certificateId,
    58,
    8,
    font,
    MUTED
  );

  // Corner logo mark
  drawEduflowLogo(page, width - 92, height - 92, 40);

  return pdf.save();
}
