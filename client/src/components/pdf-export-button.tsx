import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { PrintableTransactionsReport } from "./printable-transactions-report";

interface TransactionData {
  id: string;
  date: string;
  projectName: string;
  type: string;
  amount: string;
  isGrubu: string | null;
  rayicGrubu: string | null;
  description: string | null;
  progressPaymentId: string | null;
  incomeKind?: string | null;
  paymentMethod?: string | null;
}

interface PDFExportButtonProps {
  className?: string;
  documentTitle?: string;
  transactions: TransactionData[];
  filterInfo?: string;
}

export function PDFExportButton({ className, documentTitle = "Rapor", transactions, filterInfo }: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handlePDFExport = async () => {
    if (transactions.length === 0) {
      console.log("No transactions to export");
      return;
    }

    setIsExporting(true);

    try {
      // Create offscreen container
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "210mm";
      container.style.backgroundColor = "white";
      document.body.appendChild(container);

      // Render the report component
      const root = createRoot(container);
      
      await new Promise<void>((resolve) => {
        root.render(
          <PrintableTransactionsReport
            transactions={transactions}
            documentTitle={documentTitle}
            filterInfo={filterInfo}
          />
        );
        // Wait for render
        setTimeout(resolve, 500);
      });

      // Find all pages
      const pages = container.querySelectorAll(".pdf-page");
      
      if (pages.length === 0) {
        throw new Error("No pages found to export");
      }

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Capture each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        
        const canvas = await html2canvas(page, {
          scale: 4,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          allowTaint: true,
          width: page.offsetWidth,
          height: page.offsetHeight,
          imageTimeout: 0,
          removeContainer: true,
        });

        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        
        if (i > 0) {
          pdf.addPage();
        }

        // Add image to cover full page
        pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
      }

      // Cleanup
      root.unmount();
      document.body.removeChild(container);

      // Save PDF
      pdf.save(`${documentTitle.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handlePDFExport}
      variant="outline"
      size="sm"
      className={className}
      disabled={isExporting || transactions.length === 0}
      data-testid="button-export-pdf"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Hazırlanıyor...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4 mr-2" />
          PDF İndir
        </>
      )}
    </Button>
  );
}
