import { jsPDF } from 'jspdf';
import { WhiteboardProject, Page } from '@/types/whiteboard';

/**
 * Converts a multi-page PDF File into an array of high-resolution image data URLs.
 */
export async function convertPdfToImages(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    // Set up standard worker if needed
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pageImages: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (onProgress) {
        onProgress(pageNum, numPages);
      }
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for high-DPI annotation

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await (page.render as any)({
        canvasContext: context,
        viewport,
        canvas,
      }).promise;

      pageImages.push(canvas.toDataURL('image/png'));
    }

    return pageImages;
  } catch (error) {
    console.warn('pdfjs-dist processing failed or unavailable, falling back:', error);
    throw new Error('Could not parse PDF. Please verify the file is a valid PDF document.');
  }
}

/**
 * Exports all project pages in correct sequential order to a high-quality multi-page PDF document.
 */
export async function exportMultiPagePdf(
  project: WhiteboardProject,
  renderPageDataUrl: (pageIndex: number) => Promise<string>,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1920, 1080],
  });

  const total = project.pages.length;

  for (let i = 0; i < total; i++) {
    if (onProgress) {
      onProgress(i + 1, total);
    }

    if (i > 0) {
      pdf.addPage([1920, 1080], 'landscape');
    }

    const imgData = await renderPageDataUrl(i);
    if (imgData) {
      pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
    }
  }

  return pdf.output('blob');
}

/**
 * Generates vector SVG markup for all compatible whiteboard elements on the active page.
 */
export function exportPageToSvg(page: Page, width = 1920, height = 1080): string {
  const bg = page.backgroundColor || '#090b0e';
  const elementsSvg: string[] = [];

  for (const el of page.elements) {
    if (el.type === 'pen' || el.type === 'highlighter') {
      const pts = (el as any).points || [];
      if (pts.length < 4) continue;
      const pathData = pts.reduce((acc: string, val: number, idx: number) => {
        return idx === 0
          ? `M ${val}`
          : idx === 1
          ? `${acc} ${val}`
          : idx % 2 === 0
          ? `${acc} L ${val}`
          : `${acc} ${val}`;
      }, '');

      const strokeColor = (el as any).color || '#ffffff';
      const strokeWidth = (el as any).size || 3;
      const opacity = el.type === 'highlighter' ? 0.35 : el.opacity !== undefined ? el.opacity : 1;

      elementsSvg.push(`
        <path 
          d="${pathData}" 
          stroke="${strokeColor}" 
          stroke-width="${strokeWidth}" 
          fill="none" 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          opacity="${opacity}" 
        />
      `);
    }

    if (el.type === 'shape') {
      const shape = el as any;
      if (shape.shapeType === 'rectangle') {
        elementsSvg.push(`
          <rect 
            x="${shape.x}" 
            y="${shape.y}" 
            width="${shape.width}" 
            height="${shape.height}" 
            stroke="${shape.stroke}" 
            stroke-width="${shape.strokeWidth}" 
            fill="${shape.fill || 'none'}" 
            opacity="${shape.opacity !== undefined ? shape.opacity : 1}" 
          />
        `);
      } else if (shape.shapeType === 'circle') {
        const r = shape.width / 2;
        elementsSvg.push(`
          <circle 
            cx="${shape.x + r}" 
            cy="${shape.y + r}" 
            r="${r}" 
            stroke="${shape.stroke}" 
            stroke-width="${shape.strokeWidth}" 
            fill="${shape.fill || 'none'}" 
          />
        `);
      } else if (shape.shapeType === 'line' || shape.shapeType === 'arrow') {
        elementsSvg.push(`
          <line 
            x1="${shape.x}" 
            y1="${shape.y}" 
            x2="${shape.x + shape.width}" 
            y2="${shape.y + shape.height}" 
            stroke="${shape.stroke}" 
            stroke-width="${shape.strokeWidth}" 
          />
        `);
      }
    }

    if (el.type === 'text') {
      const textEl = el as any;
      elementsSvg.push(`
        <text 
          x="${textEl.x}" 
          y="${textEl.y + (textEl.fontSize || 20)}" 
          fill="${textEl.fontColor || '#ffffff'}" 
          font-size="${textEl.fontSize || 20}px" 
          font-family="${textEl.fontFamily || 'Inter, sans-serif'}"
        >
          ${textEl.text || ''}
        </text>
      `);
    }

    if (el.type === 'sticky') {
      const sticky = el as any;
      elementsSvg.push(`
        <g transform="translate(${sticky.x}, ${sticky.y})">
          <rect width="${sticky.width}" height="${sticky.height}" rx="12" fill="${sticky.color || '#fef08a'}" />
          <text x="14" y="28" fill="#1e293b" font-size="14px" font-family="Inter, sans-serif">
            ${sticky.text}
          </text>
        </g>
      `);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bg}" />
  ${elementsSvg.join('\n')}
</svg>`;
}
