import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { StoryData } from '../types';

export const generatePdfBlob = async (elementId: string, fileName:string): Promise<Blob> => {
  const bookElement = document.getElementById(elementId);

  if (!bookElement) {
    throw new Error(`Element with id ${elementId} not found for PDF generation.`);
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [842, 595], // A5 page size (148x210mm at 144dpi is approx 842x595px)
  });

  const pages = bookElement.querySelectorAll('.pdf-page');

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i] as HTMLElement;
    
    const pdfWidth = 842;
    const pdfHeight = 595;

    const canvas = await html2canvas(page, {
        width: pdfWidth,
        height: pdfHeight,
        scale: 2, // Increase scale for better quality
        useCORS: true, // Important for external images
    });
    
    const imgData = canvas.toDataURL('image/png');

    if (i > 0) {
      doc.addPage();
    }
    
    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  }

  return doc.output('blob') as Blob;
};