import type { Response } from 'express';
import type { ExportFormat } from '@shared';
import { getProposalById } from '../proposal-generator/proposal.service';
import type { Proposal } from '@domain';

export type GenerateReportRequest = {
  proposalId: string;
  format: string;
};

// ─── HTML ─────────────────────────────────────────────────────────────────────

function esc(s: string | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

function htmlSection(title: string, content: string | undefined): string {
  if (!content?.trim()) return '';
  return `<section>
    <h2>${title}</h2>
    <p>${esc(content)}</p>
  </section>`;
}

const renderHtml = (p: Proposal): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${p.title}</title>
  <style>
    @page { margin: 2cm; }
    body { font-family: Georgia, serif; color: #111827; line-height: 1.7; max-width: 800px; margin: 0 auto; padding: 32px; }
    h1 { font-size: 2rem; color: #1e3a5f; border-bottom: 3px solid #1e3a5f; padding-bottom: 12px; }
    h2 { font-size: 1.1rem; color: #1e3a5f; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-top: 28px; }
    .meta { color: #6b7280; font-size: 0.9rem; margin-bottom: 24px; }
    section { margin-bottom: 20px; }
    p { margin: 0 0 8px; }
  </style>
</head>
<body>
  <h1>${p.title}</h1>
  <div class="meta">Status: <strong>${p.status}</strong> &nbsp;|&nbsp; Version: ${p.version}</div>
  ${htmlSection('Executive Summary',  p.executiveSummary)}
  ${htmlSection('Scope of Work',      p.scope)}
  ${htmlSection('Timeline',           p.timeline)}
  ${htmlSection('Deliverables',       p.deliverables)}
  ${htmlSection('Pricing',            p.pricing)}
  ${htmlSection('Maintenance Plan',   p.maintenancePlan)}
  ${htmlSection('Why Choose Us',      p.whyChooseUs)}
  ${htmlSection('Case Studies',       p.caseStudies)}
  ${htmlSection('Terms & Conditions', p.terms)}
</body>
</html>`;

// ─── Markdown ─────────────────────────────────────────────────────────────────

function mdSection(title: string, content: string | undefined): string {
  return content?.trim() ? `## ${title}\n\n${content}` : '';
}

const renderMarkdown = (p: Proposal): string => [
  `# ${p.title}`,
  `**Status:** ${p.status} | **Version:** ${p.version}`,
  mdSection('Executive Summary',  p.executiveSummary),
  mdSection('Scope of Work',      p.scope),
  mdSection('Timeline',           p.timeline),
  mdSection('Deliverables',       p.deliverables),
  mdSection('Pricing',            p.pricing),
  mdSection('Maintenance Plan',   p.maintenancePlan),
  mdSection('Why Choose Us',      p.whyChooseUs),
  mdSection('Case Studies',       p.caseStudies),
  mdSection('Terms & Conditions', p.terms),
].filter(Boolean).join('\n\n');

// ─── DOCX ─────────────────────────────────────────────────────────────────────

const renderDocx = async (p: Proposal): Promise<Buffer> => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const docx = require('docx');
  const { Document, Packer, Paragraph, HeadingLevel } = docx;

  const paras = (content: string | undefined): unknown[] => {
    if (!content?.trim()) return [];
    return content.split('\n').filter(Boolean).map((line: string) => new Paragraph({ text: line }));
  };

  const makeSection = (title: string, content: string | undefined): unknown[] => {
    if (!content?.trim()) return [];
    return [
      new Paragraph({ text: title, heading: HeadingLevel.HEADING_2 }),
      ...paras(content),
      new Paragraph({ text: '' }),
    ];
  };

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: p.title,  heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: `Status: ${p.status}   |   Version: ${p.version}` }),
        new Paragraph({ text: '' }),
        ...makeSection('Executive Summary',  p.executiveSummary),
        ...makeSection('Scope of Work',      p.scope),
        ...makeSection('Timeline',           p.timeline),
        ...makeSection('Deliverables',       p.deliverables),
        ...makeSection('Pricing',            p.pricing),
        ...makeSection('Maintenance Plan',   p.maintenancePlan),
        ...makeSection('Why Choose Us',      p.whyChooseUs),
        ...makeSection('Case Studies',       p.caseStudies),
        ...makeSection('Terms & Conditions', p.terms),
      ],
    }],
  });

  return Packer.toBuffer(doc);
};

// ─── PDF via pdfkit ───────────────────────────────────────────────────────────

const renderPdf = (p: Proposal): Promise<Buffer> => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFDocument = require('pdfkit');

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 72, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data',  (chunk: Buffer) => chunks.push(chunk));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // Title
      doc.font('Helvetica-Bold').fontSize(24).fillColor('#1e3a5f').text(p.title);
      doc.moveDown(0.4);
      doc.font('Helvetica').fontSize(10).fillColor('#6b7280')
         .text(`Status: ${p.status}   |   Version: ${p.version}   |   ${new Date(p.updatedAt ?? Date.now()).toLocaleDateString()}`);
      doc.moveDown(0.6);
      doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke();
      doc.moveDown(0.8);

      const pdfSection = (title: string, content: string | undefined) => {
        if (!content?.trim()) return;
        doc.font('Helvetica-Bold').fontSize(13).fillColor('#1e3a5f').text(title);
        doc.moveDown(0.25);
        doc.font('Helvetica').fontSize(10).fillColor('#374151').text(content.trim(), { lineGap: 3 });
        doc.moveDown(0.8);
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

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// ─── Stream to response ───────────────────────────────────────────────────────

export const streamReport = async (
  request: GenerateReportRequest,
  res: Response
): Promise<void> => {
  const proposal = await getProposalById(request.proposalId);
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

// Alias for backward compatibility
export const generateReport = streamReport;
