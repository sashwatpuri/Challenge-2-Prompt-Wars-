import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, dob, address } = req.body;

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText('Form 6 - Application for inclusion of name in the electoral roll', {
      x: 50,
      y: 800,
      size: 16,
      font: boldFont,
    });

    page.drawText('This is a dynamically generated preparation form, not an official submission.', {
      x: 50,
      y: 770,
      size: 12,
      font: font,
      color: rgb(0.8, 0.1, 0.1),
    });

    page.drawText(`Full Name: ${name || '__________________________'}`, { x: 50, y: 720, size: 14, font: font });
    page.drawText(`Date of Birth: ${dob || '__________________________'}`, { x: 50, y: 680, size: 14, font: font });
    page.drawText(`Address:`, { x: 50, y: 640, size: 14, font: font });
    
    // Address could be multiline, handle basic wrapping
    page.drawText(`${address || '__________________________'}`, { x: 50, y: 620, size: 12, font: font, maxWidth: 500, lineHeight: 14 });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Form6_Prep.pdf');
    return res.status(200).send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
}
