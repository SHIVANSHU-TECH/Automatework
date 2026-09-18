import fs from 'fs';
import path from 'path';
import type { Response } from 'express';
import type { ExportFormat } from '@shared';
import { getProposalById } from '../proposal-generator/proposal.service';
import type { Proposal } from '@domain';

export type GenerateReportRequest = {
  proposalId: string;
  format: string;
  proposal?: import('@domain').Proposal;
};

// Brand tokens aligned with Automate Work web theme
const BRAND = {
  navy: '#0B132B',
  blue: '#2563EB',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  bg: '#F8FAFC',
  white: '#FFFFFF',
};

function resolveLogoPath(): string | null {
  const candidates = [
    path.resolve(__dirname, '../../assets/logo.png'),          // dist/modules/... → dist/assets
    path.resolve(__dirname, '../../../assets/logo.png'),       // dist/modules/... → apps/api/assets
    path.resolve(process.cwd(), 'apps/api/assets/logo.png'),
    path.resolve(process.cwd(), 'apps/api/dist/assets/logo.png'),
    path.resolve(process.cwd(), 'apps/web/public/logo.png'),
    path.resolve(process.cwd(), 'assets/logo.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function loadLogoBuffer(): Buffer | null {
  const p = resolveLogoPath();
  if (!p) return null;
  try { return fs.readFileSync(p); } catch { return null; }
}

function loadLogoDataUri(): string | null {
  const buf = loadLogoBuffer();
  if (!buf) return null;
  return `data:image/png;base64,${buf.toString('base64')}`;
}

function esc(s: string | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

function htmlSection(title: string, content: string | undefined): string {
  if (!content?.trim()) return '';
  return `<section class="section">
    <h2>${title}</h2>
    <div class="body">${esc(content)}</div>
  </section>`;
}

// ─── HTML ─────────────────────────────────────────────────────────────────────

const renderHtml = (p: Proposal): string => {
  const logo = loadLogoDataUri();
  const date = new Date(p.updatedAt ?? Date.now()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${esc(p.title)} — Automate Work</title>
  <style>
    @page { margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: ${BRAND.text};
      background: ${BRAND.white};
      line-height: 1.65;
      font-size: 14px;
    }
    .page { max-width: 820px; margin: 0 auto; padding: 40px 44px 56px; }
    .header {
      display: flex;
      align-items: center;
      gap: 18px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${BRAND.navy};
      margin-bottom: 28px;
    }
    .header img {
      width: auto;
      height: 56px;
      max-width: 160px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .brand-mark {
      width: 52px; height: 52px; border-radius: 12px;
      background: ${BRAND.navy}; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 18px; flex-shrink: 0;
    }
    .brand-text { min-width: 0; flex: 1; display: flex; align-items: center; }
    h1 {
      margin: 0;
      font-size: 22px;
      line-height: 1.3;
      color: ${BRAND.navy};
      font-weight: 800;
    }
    .meta {
      margin: 14px 0 28px;
      padding: 12px 14px;
      background: ${BRAND.bg};
      border: 1px solid ${BRAND.border};
      border-radius: 10px;
      color: ${BRAND.muted};
      font-size: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px 18px;
    }
    .meta strong { color: ${BRAND.text}; font-weight: 600; }
    .section { margin: 0 0 22px; page-break-inside: avoid; }
    h2 {
      margin: 0 0 10px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: ${BRAND.navy};
      padding-bottom: 8px;
      border-bottom: 2px solid ${BRAND.blue};
    }
    .body { color: ${BRAND.text}; font-size: 14px; }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid ${BRAND.border};
      font-size: 11px;
      color: ${BRAND.muted};
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }
    @media print {
      .page { padding: 0; max-width: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="header">
      ${logo
        ? `<img src="${logo}" alt="Automate Work"/>`
        : `<div class="brand-mark">AW</div>`}
      <div class="brand-text">
        <h1>${esc(p.title)}</h1>
      </div>
    </header>

    <div class="meta">
      <span>Status: <strong>${esc(p.status)}</strong></span>
      <span>Version: <strong>${p.version ?? 1}</strong></span>
      <span>Date: <strong>${date}</strong></span>
    </div>

    ${htmlSection('Executive Summary',  p.executiveSummary)}
    ${htmlSection('Scope of Work',      p.scope)}
    ${htmlSection('Timeline',           p.timeline)}
    ${htmlSection('Deliverables',       p.deliverables)}
    ${htmlSection('Pricing',            p.pricing)}
    ${htmlSection('Maintenance Plan',   p.maintenancePlan)}
    ${htmlSection('Why Choose Us',      p.whyChooseUs)}
    ${htmlSection('Case Studies',       p.caseStudies)}
    ${htmlSection('Terms & Conditions', p.terms)}

    <footer class="footer">
      <span>Prepared with Automate Work</span>
      <span>Confidential</span>
    </footer>
  </div>
</body>
</html>`;
};

// ─── Markdown ─────────────────────────────────────────────────────────────────

function mdSection(title: string, content: string | undefined): string {
  return content?.trim() ? `## ${title}\n\n${content}` : '';
}

const renderMarkdown = (p: Proposal): string => [
  `# ${p.title}`,
  ``,
  `**Automate Work**  `,
  `Status: ${p.status} · Version: ${p.version}`,
  ``,
  `---`,
  mdSection('Executive Summary',  p.executiveSummary),
  mdSection('Scope of Work',      p.scope),
  mdSection('Timeline',           p.timeline),
  mdSection('Deliverables',       p.deliverables),
  mdSection('Pricing',            p.pricing),
  mdSection('Maintenance Plan',   p.maintenancePlan),
  mdSection('Why Choose Us',      p.whyChooseUs),
  mdSection('Case Studies',       p.caseStudies),
  mdSection('Terms & Conditions', p.terms),
].filter((line) => line !== undefined).join('\n\n').replace(/\n{3,}/g, '\n\n');

// ─── DOCX ─────────────────────────────────────────────────────────────────────

const renderDocx = async (p: Proposal): Promise<Buffer> => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const docx = require('docx');
  const {
    Document, Packer, Paragraph, TextRun,
    BorderStyle, Header, ImageRun,
  } = docx;

  const logoBuf = loadLogoBuffer();
  const date = new Date(p.updatedAt ?? Date.now()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const paras = (content: string | undefined): unknown[] => {
    if (!content?.trim()) return [];
    return content.split('\n').filter((l) => l.length > 0).map((line: string) =>
      new Paragraph({
        spacing: { after: 120, line: 276 },
        children: [new TextRun({ text: line, font: 'Calibri', size: 22, color: '0F172A' })],
      }),
    );
  };

  const makeSection = (title: string, content: string | undefined): unknown[] => {
    if (!content?.trim()) return [];
    return [
      new Paragraph({
        spacing: { before: 280, after: 120 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 12, color: '2563EB', space: 4 },
        },
        children: [new TextRun({
          text: title.toUpperCase(),
          bold: true,
          font: 'Calibri',
          size: 20,
          color: '0B132B',
        })],
      }),
      ...paras(content),
    ];
  };

  const headerChildren: unknown[] = [];
  if (logoBuf) {
    // Logo already includes brand name — keep header as logo only (no stacked duplicate text)
    headerChildren.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new ImageRun({
            type: 'png',
            data: logoBuf,
            transformation: { width: 120, height: 48 },
          }),
        ],
      }),
    );
  } else {
    headerChildren.push(
      new Paragraph({
        children: [new TextRun({
          text: 'Automate Work',
          bold: true,
          font: 'Calibri',
          size: 20,
          color: '2563EB',
        })],
      }),
    );
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      headers: {
        default: new Header({ children: headerChildren as never[] }),
      },
      children: [
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({
            text: p.title,
            bold: true,
            font: 'Calibri',
            size: 36,
            color: '0B132B',
          })],
        }),
        new Paragraph({
          spacing: { after: 280 },
          children: [new TextRun({
            text: `Status: ${p.status}  ·  Version: ${p.version ?? 1}  ·  ${date}`,
            font: 'Calibri',
            size: 18,
            color: '64748B',
          })],
        }),
        ...makeSection('Executive Summary',  p.executiveSummary),
        ...makeSection('Scope of Work',      p.scope),
        ...makeSection('Timeline',           p.timeline),
        ...makeSection('Deliverables',       p.deliverables),
        ...makeSection('Pricing',            p.pricing),
        ...makeSection('Maintenance Plan',   p.maintenancePlan),
        ...makeSection('Why Choose Us',      p.whyChooseUs),
        ...makeSection('Case Studies',       p.caseStudies),
        ...makeSection('Terms & Conditions', p.terms),
        new Paragraph({
          spacing: { before: 400 },
          border: { top: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0', space: 8 } },
          children: [new TextRun({
            text: 'Prepared with Automate Work  ·  Confidential',
            font: 'Calibri',
            size: 16,
            color: '64748B',
            italics: true,
          })],
        }),
      ],
    }],
  });

  return Packer.toBuffer(doc);
};

// ─── PDF via pdfkit ───────────────────────────────────────────────────────────

const renderPdf = (p: Proposal): Promise<Buffer> => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFDocument = require('pdfkit');
  const logoPath = resolveLogoPath();
  const date = new Date(p.updatedAt ?? Date.now()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 56,
        size: 'A4',
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: p.title,
          Author: 'Automate Work',
          Creator: 'Automate Work',
        },
      });
      const chunks: Buffer[] = [];
      doc.on('data',  (chunk: Buffer) => chunks.push(chunk));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      const left = 56;
      const contentWidth = doc.page.width - left * 2;
      const pageBottom = doc.page.height - 56; // usable content bottom (above footer)
      const headerTop = 48;
      const logoW = 110;
      const logoH = 44;
      const gap = 16;

      // Header: full logo (includes brand name) LEFT — title vertically centered beside it
      let headerBottom = headerTop + logoH;
      if (logoPath) {
        try {
          doc.image(logoPath, left, headerTop, { width: logoW, height: logoH, fit: [logoW, logoH] });
        } catch {
          doc.fillColor(BRAND.navy).font('Helvetica-Bold').fontSize(11)
            .text('Automate Work', left, headerTop + 14, { lineBreak: false });
        }
      } else {
        doc.fillColor(BRAND.navy).font('Helvetica-Bold').fontSize(11)
          .text('Automate Work', left, headerTop + 14, { lineBreak: false });
      }

      const titleX = left + logoW + gap;
      const titleW = contentWidth - logoW - gap;
      doc.font('Helvetica-Bold').fontSize(16).fillColor(BRAND.navy);
      const titleHeight = doc.heightOfString(p.title, { width: titleW, lineGap: 1 });
      const titleY = headerTop + Math.max(0, (logoH - titleHeight) / 2);
      doc.text(p.title, titleX, titleY, {
        width: titleW,
        lineGap: 1,
        align: 'left',
      });
      headerBottom = Math.max(headerTop + logoH, doc.y);

      let y = headerBottom + 12;
      doc.moveTo(left, y).lineTo(left + contentWidth, y)
        .strokeColor(BRAND.navy).lineWidth(2).stroke();
      y += 14;

      // Meta bar
      doc.roundedRect(left, y, contentWidth, 26, 5).fill(BRAND.bg);
      doc.fillColor(BRAND.muted).font('Helvetica').fontSize(9)
        .text(
          `Status: ${p.status}    ·    Version: ${p.version ?? 1}    ·    ${date}`,
          left + 10,
          y + 8,
          { width: contentWidth - 20, lineBreak: false },
        );
      y += 38;
      doc.y = y;

      const ensureSpace = (needed: number) => {
        if (doc.y + needed > pageBottom) {
          doc.addPage();
          doc.y = 56;
        }
      };

      const pdfSection = (title: string, content: string | undefined) => {
        if (!content?.trim()) return;

        ensureSpace(60);

        doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND.navy)
          .text(title.toUpperCase(), left, doc.y, { width: contentWidth });
        const afterTitle = doc.y + 3;
        doc.moveTo(left, afterTitle).lineTo(left + 64, afterTitle)
          .strokeColor(BRAND.blue).lineWidth(2).stroke();
        doc.y = afterTitle + 8;

        doc.font('Helvetica').fontSize(10).fillColor(BRAND.text)
          .text(content.trim(), left, doc.y, {
            width: contentWidth,
            align: 'left',
            lineGap: 2,
          });
        doc.moveDown(0.85);
      };

      pdfSection('Executive Summary',  p.executiveSummary);
      pdfSection('Scope of Work',      p.scope);
      pdfSection('Timeline',           p.timeline);
      pdfSection('Deliverables',       p.deliverables);
      pdfSection('Pricing',            p.pricing);
      pdfSection('Maintenance Plan',   p.maintenancePlan);
      pdfSection('Why Choose Us',      p.whyChooseUs);
      pdfSection('Case Studies',       p.caseStudies);
      pdfSection('Terms & Conditions', p.terms);

      // Footers — lineBreak:false prevents PDFKit from spawning blank pages
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i);
        const footerY = doc.page.height - 40;
        doc.save();
        doc.moveTo(left, footerY - 6).lineTo(left + contentWidth, footerY - 6)
          .strokeColor(BRAND.border).lineWidth(0.8).stroke();
        doc.font('Helvetica').fontSize(8).fillColor(BRAND.muted);
        doc.text('Automate Work  ·  Confidential', left, footerY, {
          width: contentWidth * 0.55,
          lineBreak: false,
          continued: false,
        });
        doc.text(`Page ${i + 1} of ${range.count}`, left + contentWidth * 0.55, footerY, {
          width: contentWidth * 0.45,
          align: 'right',
          lineBreak: false,
          continued: false,
        });
        doc.restore();
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// ─── Stream to response ───────────────────────────────────────────────────────

export const streamReport = async (
  request: GenerateReportRequest,
  res: Response,
): Promise<void> => {
  const proposal = request.proposal ?? await getProposalById(request.proposalId);
  if (!proposal) throw new Error('Proposal not found');

  const slug = proposal.title.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 50);
  const ext  = request.format === 'markdown' ? 'md' : request.format;
  const filename = `${slug}-proposal.${ext}`;

  switch (request.format as ExportFormat) {
    case 'html': {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(renderHtml(proposal));
      return;
    }
    case 'markdown': {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(renderMarkdown(proposal));
      return;
    }
    case 'pdf': {
      const buffer = await renderPdf(proposal);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', String(buffer.length));
      res.end(buffer);
      return;
    }
    case 'docx': {
      const buffer = await renderDocx(proposal);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', String(buffer.length));
      res.end(buffer);
      return;
    }
    default:
      throw new Error(`Unsupported format: ${request.format}`);
  }
};

export const generateReport = streamReport;
