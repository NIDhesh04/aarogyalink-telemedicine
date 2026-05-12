const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a professional prescription PDF.
 * @param {object} data - The prescription data.
 * @returns {Promise<string>} - The path to the generated PDF.
 */
const generatePrescriptionPDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 0, size: 'A4' });
      const filename = `prescription_${data.bookingId}_${Date.now()}.pdf`;
      const outputDir = path.join(__dirname, '../../../public/prescriptions');

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, filename);
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      const W = 595.28; // A4 width in points
      const TEAL = '#0d9488';
      const DARK = '#1e293b';
      const MUTED = '#64748b';
      const LIGHT_BG = '#f8fafc';
      const BORDER = '#e2e8f0';

      // ── Header Banner ──────────────────────────────────────────────────────────
      doc.rect(0, 0, W, 110).fill(TEAL);

      // Logo area
      doc.circle(52, 55, 28).fill('rgba(255,255,255,0.15)');
      doc.fontSize(28).fillColor('white').font('Helvetica-Bold').text('A', 38, 40);

      // Title
      doc.fontSize(22).fillColor('white').font('Helvetica-Bold')
        .text('AarogyaLink', 90, 28, { lineBreak: false });
      doc.fontSize(10).fillColor('rgba(255,255,255,0.8)').font('Helvetica')
        .text('Rural Telemedicine Platform', 90, 56, { lineBreak: false });
      doc.fontSize(9).fillColor('rgba(255,255,255,0.7)')
        .text('District Hospital Consultation Service', 90, 72, { lineBreak: false });

      // Rx badge
      doc.fontSize(36).fillColor('rgba(255,255,255,0.2)').font('Helvetica-Bold')
        .text('Rx', W - 80, 25, { lineBreak: false });

      // ── Divider stripe ─────────────────────────────────────────────────────────
      doc.rect(0, 110, W, 4).fill('#0f766e');

      // ── Patient / Doctor info bar ──────────────────────────────────────────────
      doc.rect(0, 114, W, 80).fill(LIGHT_BG);

      const infoY = 130;
      // Patient column
      doc.fontSize(8).fillColor(MUTED).font('Helvetica').text('PATIENT', 40, infoY);
      doc.fontSize(14).fillColor(DARK).font('Helvetica-Bold').text(data.patientName || 'N/A', 40, infoY + 12);

      // Doctor column
      doc.fontSize(8).fillColor(MUTED).font('Helvetica').text('CONSULTING DOCTOR', 220, infoY);
      doc.fontSize(14).fillColor(DARK).font('Helvetica-Bold').text(`Dr. ${data.doctorName || 'N/A'}`, 220, infoY + 12);

      // Date column
      doc.fontSize(8).fillColor(MUTED).font('Helvetica').text('DATE', 420, infoY);
      doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold')
        .text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 420, infoY + 14);

      // Bottom border of info bar
      doc.moveTo(40, 193).lineTo(W - 40, 193).lineWidth(1).strokeColor(BORDER).stroke();

      // ── Content Area ───────────────────────────────────────────────────────────
      let y = 215;
      const LEFT = 40;
      const CONTENT_WIDTH = W - 80;

      // Helper: Section heading
      const sectionTitle = (title, yPos) => {
        doc.rect(LEFT, yPos, 3, 16).fill(TEAL);
        doc.fontSize(10).fillColor(TEAL).font('Helvetica-Bold')
          .text(title.toUpperCase(), LEFT + 10, yPos + 2, { lineBreak: false });
        return yPos + 24;
      };

      // Helper: Render body text with line wrapping
      const bodyText = (text, yPos, color = DARK) => {
        const lines = text.split('\n');
        let curY = yPos;
        lines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed) { curY += 6; return; }

          // Bold markdown: **text**
          if (trimmed.startsWith('**') && trimmed.includes(':**')) {
            const colonIdx = trimmed.indexOf(':**');
            const label = trimmed.substring(2, colonIdx);
            const value = trimmed.substring(colonIdx + 3).trim();

            doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK)
              .text(label + ':', LEFT + 8, curY, { continued: true });
            doc.font('Helvetica').fillColor(MUTED)
              .text(' ' + value, { lineBreak: false });
            curY += 16;
          } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            const content = trimmed.replace(/^[-•]\s*/, '');
            doc.rect(LEFT + 12, curY + 5, 4, 4).fill(TEAL);
            doc.fontSize(9.5).font('Helvetica').fillColor(color)
              .text(content, LEFT + 22, curY, { width: CONTENT_WIDTH - 22 });
            curY += doc.currentLineHeight() + 4;
          } else if (/^\d+\./.test(trimmed)) {
            doc.fontSize(9.5).font('Helvetica').fillColor(color)
              .text(trimmed, LEFT + 8, curY, { width: CONTENT_WIDTH - 8 });
            curY += doc.currentLineHeight() + 5;
          } else if (trimmed.startsWith('⚠️') || trimmed.startsWith('⚕️') || trimmed.startsWith('---')) {
            if (!trimmed.startsWith('---')) {
              doc.fontSize(8.5).font('Helvetica-Oblique').fillColor(MUTED)
                .text(trimmed, LEFT + 8, curY, { width: CONTENT_WIDTH });
              curY += doc.currentLineHeight() + 4;
            }
          } else {
            doc.fontSize(9.5).font('Helvetica').fillColor(color)
              .text(trimmed, LEFT + 8, curY, { width: CONTENT_WIDTH - 8 });
            curY += doc.currentLineHeight() + 4;
          }
        });
        return curY;
      };

      // ── Clinical Brief ─────────────────────────────────────────────────────────
      if (data.symptomBrief) {
        y = sectionTitle('Clinical Brief (AI-Structured)', y);
        doc.rect(LEFT, y, CONTENT_WIDTH, 1).fill(BORDER);
        y += 8;
        y = bodyText(data.symptomBrief, y, MUTED);
        y += 16;
      }

      // ── Prescription ───────────────────────────────────────────────────────────
      y = sectionTitle('Prescription & Medical Advice', y);
      doc.rect(LEFT, y, CONTENT_WIDTH, 1).fill(BORDER);
      y += 8;

      // Box around prescription
      const prescStart = y;
      y = bodyText(data.prescription || 'No prescription recorded.', y + 8);
      const prescEnd = y + 8;
      doc.rect(LEFT, prescStart, CONTENT_WIDTH, prescEnd - prescStart)
        .lineWidth(1).strokeColor(BORDER).stroke();
      y = prescEnd + 20;

      // ── Footer ─────────────────────────────────────────────────────────────────
      const footerY = 770;
      doc.rect(0, footerY, W, 72).fill(LIGHT_BG);
      doc.moveTo(0, footerY).lineTo(W, footerY).lineWidth(1).strokeColor(BORDER).stroke();

      doc.fontSize(7.5).fillColor(MUTED).font('Helvetica')
        .text('This prescription was generated via AarogyaLink Telemedicine Platform and reviewed by the consulting doctor.', 40, footerY + 12, { width: W - 80, align: 'center' });
      doc.fontSize(7).fillColor(MUTED)
        .text('For medical emergencies, contact your nearest district hospital immediately. This document is valid only when signed by the doctor.', 40, footerY + 26, { width: W - 80, align: 'center' });

      // Signature line
      doc.moveTo(W - 200, footerY + 48).lineTo(W - 50, footerY + 48).lineWidth(0.5).strokeColor('#94a3b8').stroke();
      doc.fontSize(7.5).fillColor(MUTED).font('Helvetica')
        .text(`Dr. ${data.doctorName || ''}`, W - 200, footerY + 52, { width: 150, align: 'center' });
      doc.fontSize(7).fillColor('#94a3b8')
        .text('Authorized Signature', W - 200, footerY + 61, { width: 150, align: 'center' });

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generatePrescriptionPDF };
