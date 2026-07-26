declare module 'html-pdf-node' {
  interface FileOptions {
    content?: string;
    url?: string;
  }
  interface PdfOptions {
    format?: string;
    width?: string;
    height?: string;
    margin?: { top?: string; right?: string; bottom?: string; left?: string };
    printBackground?: boolean;
  }
  export function generatePdf(file: FileOptions, options: PdfOptions): Promise<Buffer>;
}
