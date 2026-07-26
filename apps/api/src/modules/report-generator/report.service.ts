import type { Response } from 'express';
import type { ExportFormat } from '@shared';
import { getProposalById } from '../proposal-generator/proposal.service';
import type { Proposal } from '@domain';

export type GenerateReportRequest = {
  proposalId: string;
  format: string;
};

// ─── HTML template ────────────────────────────────────────────────────────────

const renderHtml = (p: Proposal): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${p.title}</title>
  <style>
    @page { margin: 2cm; }
    body { font-family: Georgia, serif; color: #111827; line-height: 1.7; max-width: 800px; margin: 0 auto; padding: 32px; }
    h1 { font-size: 2rem; color: #1e3a5f; border-bottom: 3px solid #1e3a5f; padding-bottom: 12px; }
    h2 { font-size: 1.15rem; color: #1e3a5f; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-top: 28px; }
    .meta { color: #6b7280; font-size: 0.9rem; margin-bottom: 24px; }
    section { margin-bottom: 20px; }
    pre { white-space: pre-wrap; font-family: inherit; }
    p { margin: 0 0 8px; }
  </style>
</head>
<body>
  <h1>${p.title}</h1>
  <div class="meta">Status: <strong>${p.status}</strong> &nbsp;|&nbsp; Version: ${p.version}</div>
  ${section('Executive Summary', p.executiveSummary)}
  ${section('Scope of Work', p.scope)}
  ${section('Timeline', p.timeline)}
  ${section('Deliverables', p.deliverables)}
  ${section('Pricing', p.pricing)}
  ${section('Maintenance Plan', p.maintenancePlan)}
  ${section('Why Choose Us', p.whyChooseUs)}
  ${section('Case Studies', p.caseStudies)}
  ${section('Terms & Conditions', p.terms)}
</body>
</html>`;

function section(title: string, content: string | undefined): string {
  if (!content?.trim()) return '';
  const safe = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<section><h2>${title}</h2><p>${safe.replace(/\n/g, '<br/>')}</p></section>`;
}

// ─── Markdown ─────────────────────────────────────────────────────────────────

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

function mdSection(title: string, content: string | undefined): string {
  return content?.trim() ? `## ${title}\n\n${content}` : '';
}

// ─── DOCX ─────────────────────────────────────────────────────────────────────

const renderDocx = async (p: Proposal): Promise<Buffer> => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Document, Packer, Paragraph, HeadingLevel } = require('docx') as {
    Document: new (o: Record<string, unknown>) => unknown;
    Packer: { toBuffer: (d: unknown) => Promise<Buffer> };
    Paragraph: new (o: Record<string, unknown>) => unknown;
    HeadingLevel: Record<string, string>;
  };

  const para = (text: string, heading?: string) =>
    heading
      ? new Paragraph({ text, heading })
      : new Paragraph({ text });

  const docxSection = (title: string, content: string | undefined) => {
    if (!content?.trim()) return [];
    return [
      para(title, HeadingLevel.HEADING_2),
      ...content.split('\n').filter(Boolean).map((line) => para(line)),
      para(''),
    ];
  };

  const doc = new Document({
    sections: [{
      children: [
        para(p.title, HeadingLevel.HEADING_1),
        para(`Status: ${p.status}   |   Version: ${p.version}`),
        para(''),
        ...docxSection('Executive Summary',  p.executiveSummary),
        ...docxSection('Scope of Work',      p.scope),
        ...docxSection('Timeline',           p.timeline),
        ...docxSection('Deliverables',       p.deliverables),
        ...docxSection('Pricing',            p.pricing),
        ...docxSection('Maintenance Plan',   p.maintenancePlan),
        ...docxSection('Why Choose Us',      p.whyChooseUs),
        ...docxSection('Case Studies',       p.caseStudies),
        ...docxSection('Terms & Conditions', p.terms),
      ],
    }],
  });

  return Packer.toBuffer(doc);
};

// ─── PDF via pdfkit (pure Node, no browser) ───────────────────────────────────

const renderPdf = async (p: Proposal): Promise<Buffer> => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFDocument = require('pdfkit') as new (opts?: Record<string, unknown>) => {
    fontSize: (n: number) => unknown;
    font: (f: string) => unknown;
    fillColor: (c: string) => unknown;
    text: (t: string, opts?: Record<string, unknown>) => unknown;
    moveDown: (n?: number) => unknown;
    on: (e: string, cb: (...a: unknown[]) => void) => void;
    end: () => void;
    pipe: (s: unknown) => void;
  };

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const heading1 = (text: string) => {
      doc.fontSize(22).fillColor('#1e3a5f').font('Helvetica-Bold').text(text);
      doc.moveDown(0.5);
    };

    const heading2 = (text: string) => {
      doc.moveDown(0.8).fontSize(13).fillColor('#1e3a5f').font('Helvetica-Bold').text(text);
      doc.moveDown(0.3);
    };

    const body = (text: string) => {
      doc.fontSize(11).fillColor('#111827').font('Helvetica').text(text, { lineGap: 4 });
    };

    const pdfSection = (title: string, content: string | undefined) => {
      if (!content?.trim()) return;
      heading2(title);
      body(content);
    };

    heading1(p.title);
    body(`Status: ${p.status}   |   Version: ${p.version}`);
    doc.moveDown();

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
  });
};

// ─── Stream to response (no disk writes, no broken URLs) ─────────────────────

export const streamReport = async (
  request: GenerateReportRequest,
  res: Response
): Promise<void> => {
  const proposal = await getProposalById(request.proposalId);
  if (!proposal) throw new Error('Proposal not found');

  const slug = proposal.title.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40);
  const filename = `${slug}-proposal.${request.format === 'markdown' ? 'md' : request.format}`;

  switch (request.format as ExportFormat) {
    case 'html': {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(renderHtml(proposal));
      break;
    }

    case 'markdown': {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(renderMarkdown(proposal));
      break;
    }

    case 'pdf': {
      const buffer = await renderPdf(proposal);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
      break;
    }

    case 'docx': {
      const buffer = await renderDocx(proposal);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
      break;
    }

    default:
      throw new Error(`Unsupported format: ${request.format}`);
  }
};

// Keep old export name for any remaining callers
export const generateReport = streamReport;
