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
      // Get the print-ready table
      const printContent = (document.querySelector(".print-content") || document.body) as HTMLElement;
      
      // Create canvas from HTML
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      
      // Calculate PDF dimensions
      const imgWidth = 190; // A4 width in mm minus margins
      const pageHeight = 277; // A4 height in mm minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add image to PDF pages
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight_ = pdf.internal.pageSize.getHeight();
      const margin = 10;
      
      const imgData = canvas.toDataURL("image/png");
      
      // First page
      pdf.addImage(
        imgData,
        "PNG",
        margin,
        margin,
        pageWidth - 2 * margin,
        (pageWidth - 2 * margin) * (canvas.height / canvas.width)
      );
      
      heightLeft -= pageHeight;
      position = pageHeight_;
      
      // Additional pages
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, pageWidth - 2 * margin, (pageWidth - 2 * margin) * (canvas.height / canvas.width));
        heightLeft -= pageHeight;
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
