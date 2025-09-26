import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePdfBlob = async (elementId: string): Promise<Blob> => {
  const bookElement = document.getElementById(elementId);

  if (!bookElement) {
    throw new Error(`Element with id ${elementId} not found for PDF generation.`);
  }

  // A5 Landscape dimensions in pixels (for 96 DPI)
  const pdfWidth = 842; 
  const pdfHeight = 595;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [pdfWidth, pdfHeight],
  });

  const pages = bookElement.querySelectorAll('.pdf-page');

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i] as HTMLElement;
    
    const canvas = await html2canvas(page, {
        width: pdfWidth,
        height: pdfHeight,
        scale: 1.5, // Compromise between quality and file size to avoid Vercel payload limits
        useCORS: true,
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.9); // Use JPEG for smaller file size

    if (i > 0) {
      doc.addPage([pdfWidth, pdfHeight], 'landscape');
    }
    
    doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  }

  return doc.output('blob');
};