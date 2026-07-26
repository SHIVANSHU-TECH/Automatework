export type UUID = string;

export type DateString = string;

export type ProposalStatus =
  | 'draft'
  | 'generated'
  | 'reviewed'
  | 'exported';

export type ExportFormat = 'pdf' | 'docx' | 'html' | 'markdown';
