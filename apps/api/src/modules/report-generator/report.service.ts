import fs from 'node:fs';
import path from 'node:path';
import type { ExportFormat } from '@shared';
import { getProposalById } from '../proposal-generator/proposal.service';
import type { Proposal } from '@domain';

export type GenerateReportRequest = {
  proposalId: string;
  format: ExportFormat;
};

const reportDirectory = path.resolve(__dirname, '../../data/reports');

const renderProposalHtml = (proposal: Proposal) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${proposal.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
    h1, h2, h3 { color: #111827; }
    section { margin-bottom: 24px; }
    .section-title { border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 12px; }
    pre { white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>${proposal.title}</h1>
  <p><strong>Status:</strong> ${proposal.status}</p>
  <p><strong>Version:</strong> ${proposal.version}</p>
  <section>
    <h2 class="section-title">Executive Summary</h2>
    <p>${proposal.executiveSummary ?? 'N/A'}</p>
  </section>
  <section>
    <h2 class="section-title">Scope</h2>
    <p>${proposal.scope ?? 'N/A'}</p>
  </section>
  <section>
    <h2 class="section-title">Timeline</h2>
    <p>${proposal.timeline ?? 'N/A'}</p>
  </section>
  <section>
    <h2 class="section-title">Deliverables</h2>
    <p>${proposal.deliverables ?? 'N/A'}</p>
  </section>
  <section>
    <h2 class="section-title">Pricing</h2>
    <pre>${proposal.pricing ?? 'N/A'}</pre>
  </section>
  <section>
    <h2 class="section-title">Maintenance Plan</h2>
    <p>${proposal.maintenancePlan ?? 'N/A'}</p>
  </section>
  <section>
    <h2 class="section-title">Why Choose Us</h2>
    <p>${proposal.whyChooseUs ?? 'N/A'}</p>
  </section>
  <section>
    <h2 class="section-title">Case Studies</h2>
    <p>${proposal.caseStudies ?? 'N/A'}</p>
  </section>
  <section>
    <h2 class="section-title">Terms</h2>
    <p>${proposal.terms ?? 'N/A'}</p>
  </section>
</body>
</html>`;
};

const renderProposalMarkdown = (proposal: Proposal) => {
  const markdownSections = [
    `# ${proposal.title}`,
    `**Status:** ${proposal.status}`,
    `**Version:** ${proposal.version}`,
    '## Executive Summary',
    proposal.executiveSummary || 'N/A',
    '## Scope',
    proposal.scope || 'N/A',
    '## Timeline',
    proposal.timeline || 'N/A',
    '## Deliverables',
    proposal.deliverables || 'N/A',
    '## Pricing',
    proposal.pricing || 'N/A',
    '## Maintenance Plan',
    proposal.maintenancePlan || 'N/A',
    '## Why Choose Us',
    proposal.whyChooseUs || 'N/A',
    '## Case Studies',
    proposal.caseStudies || 'N/A',
    '## Terms',
    proposal.terms || 'N/A',
  ];

  return markdownSections.join('\n\n');
};

const renderProposalDocx = async (proposal: Proposal): Promise<Buffer> => {
  // docx uses CommonJS exports; require is the reliable way under NodeNext
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const docx = require('docx') as {
    Document: new (opts: Record<string, unknown>) => unknown;
    Packer: { toBuffer: (doc: unknown) => Promise<Buffer> };
    Paragraph: new (opts: Record<string, unknown>) => unknown;
  };
  const { Document, Packer, Paragraph } = docx;
  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: proposal.title, heading: 'Heading1' as const }),
          new Paragraph({ text: `Status: ${proposal.status}` }),
          new Paragraph({ text: `Version: ${proposal.version}` }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Executive Summary', heading: 'Heading2' as const }),
          new Paragraph({ text: proposal.executiveSummary || 'N/A' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Scope', heading: 'Heading2' as const }),
          new Paragraph({ text: proposal.scope || 'N/A' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Timeline', heading: 'Heading2' as const }),
          new Paragraph({ text: proposal.timeline || 'N/A' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Deliverables', heading: 'Heading2' as const }),
          new Paragraph({ text: proposal.deliverables || 'N/A' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Pricing', heading: 'Heading2' as const }),
          new Paragraph({ text: proposal.pricing || 'N/A' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Maintenance Plan', heading: 'Heading2' as const }),
          new Paragraph({ text: proposal.maintenancePlan || 'N/A' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Why Choose Us', heading: 'Heading2' as const }),
          new Paragraph({ text: proposal.whyChooseUs || 'N/A' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Case Studies', heading: 'Heading2' as const }),
          new Paragraph({ text: proposal.caseStudies || 'N/A' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Terms', heading: 'Heading2' as const }),
          new Paragraph({ text: proposal.terms || 'N/A' }),
        ],
      },
    ],
  });

  return Packer.toBuffer(document);
};

export const generateReport = async (request: GenerateReportRequest) => {
  const proposal = await getProposalById(request.proposalId);
  if (!proposal) {
    throw new Error('Proposal not found');
  }

  if (!fs.existsSync(reportDirectory)) {
    fs.mkdirSync(reportDirectory, { recursive: true });
  }

  const filename = `${proposal.proposalId}-${Date.now()}.${request.format}`;
  const filePath = path.join(reportDirectory, filename);

  if (request.format === 'html') {
    await fs.promises.writeFile(filePath, renderProposalHtml(proposal), 'utf8');
  } else if (request.format === 'markdown') {
    await fs.promises.writeFile(filePath, renderProposalMarkdown(proposal), 'utf8');
  } else if (request.format === 'pdf') {
    const html = renderProposalHtml(proposal);
    const htmlPdf = await import('html-pdf-node');
    const buffer = await htmlPdf.generatePdf({ content: html }, { format: 'A4' });
    await fs.promises.writeFile(filePath, buffer as Buffer);
  } else if (request.format === 'docx') {
    const buffer = await renderProposalDocx(proposal);
    await fs.promises.writeFile(filePath, buffer);
  } else {
    throw new Error(`Unsupported export format: ${request.format}`);
  }

  return { filePath };
};
