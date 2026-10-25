import type Konva from 'konva';
import { WhiteboardProject } from '@/types/whiteboard';

export const exportService = {
  /**
   * Exports Konva Stage to high-resolution PNG and triggers download
   */
  exportToPNG(stage: Konva.Stage, filename = 'studycanvas-board.png', pixelRatio = 2): string {
    const dataURL = stage.toDataURL({
      pixelRatio,
      mimeType: 'image/png',
    });

    const link = document.createElement('a');
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return dataURL;
  },

  /**
   * Exports project metadata and canvas elements as .studycanvas JSON file
   */
  exportToJSON(project: WhiteboardProject): void {
    const jsonString = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    const safeTitle = (project.title || 'whiteboard').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    link.download = `${safeTitle}.studycanvas`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Reads an uploaded .studycanvas JSON file into a WhiteboardProject
   */
  async importFromJSON(file: File): Promise<WhiteboardProject> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const project = JSON.parse(content) as WhiteboardProject;
          if (!project.id || !Array.isArray(project.pages)) {
            throw new Error('Invalid StudyCanvas file format');
          }
          resolve(project);
        } catch {
          reject(new Error('Failed to parse StudyCanvas project file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },

  /**
   * Triggers a browser print dialog configured for whiteboard PDF export
   */
  triggerPrint(stage: Konva.Stage, title = 'StudyCanvas'): void {
    const dataURL = stage.toDataURL({ pixelRatio: 2 });
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate PDF/Print preview');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - StudyCanvas Export</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
            img { max-width: 100%; max-height: 100vh; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${dataURL}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
