import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface PDFExportButtonProps {
  className?: string;
  documentTitle?: string;
}

export function PDFExportButton({ className, documentTitle = "Rapor" }: PDFExportButtonProps) {
  const handlePDFExport = async () => {
    try {
      // Find table or card container
      const table = document.querySelector("table") as HTMLElement;
      if (!table) {
        console.error("Table not found");
        return;
      }

      // Create a temporary clone to capture
      const clone = table.cloneNode(true) as HTMLElement;
      clone.style.display = "block";
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.width = "1000px";
      clone.style.backgroundColor = "white";
      
      document.body.appendChild(clone);

      // Capture the table as image
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
      });

      // Remove clone
      document.body.removeChild(clone);

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - 2 * margin;
      
      // Calculate image dimensions
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
      
      const imgData = canvas.toDataURL("image/png");
      
      let position = margin;
      let remainingHeight = imgHeight;
      let isFirstPage = true;

      while (remainingHeight > 0) {
        if (!isFirstPage) {
          pdf.addPage();
          position = margin;
        }

        const availableHeight = pageHeight - 2 * margin;
        const heightToPrint = Math.min(remainingHeight, availableHeight);
        
        pdf.addImage(
          imgData,
          "PNG",
          margin,
          position,
          contentWidth,
          heightToPrint
        );

        remainingHeight -= heightToPrint;
        isFirstPage = false;

        if (remainingHeight > 0) {
          position = margin;
        }
      }

      // Save PDF
      pdf.save(`${documentTitle}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
    }
  };

  return (
    <Button
      onClick={handlePDFExport}
      variant="outline"
      size="sm"
      className={className}
      data-testid="button-export-pdf"
    >
      <FileText className="h-4 w-4 mr-2" />
      PDF İndir
    </Button>
  );
}
