'use client';

import { useCallback, useState } from 'react';

interface Props {
  targetId: string;
}

export default function ExportPdfButton({ targetId }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById(targetId);
      if (!element) return;

      // Temporarily expand all collapsible sections for capture
      const collapsibles = element.querySelectorAll('[data-collapsible]');
      const originalStates: boolean[] = [];
      collapsibles.forEach((el, i) => {
        const content = el.querySelector('[data-collapsible-content]');
        originalStates[i] = content?.classList.contains('hidden') ?? false;
        content?.classList.remove('hidden');
      });

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Restore collapsible states
      collapsibles.forEach((el, i) => {
        if (originalStates[i]) {
          const content = el.querySelector('[data-collapsible-content]');
          content?.classList.add('hidden');
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save('sg-property-calculation.pdf');
    } finally {
      setExporting(false);
    }
  }, [targetId]);

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
    >
      {exporting ? 'Exporting...' : 'Export PDF'}
    </button>
  );
}
