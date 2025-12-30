import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
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

interface PrintButtonProps {
  className?: string;
  documentTitle?: string;
  transactions?: TransactionData[];
  filterInfo?: string;
}

export function PrintButton({ className, documentTitle = "Rapor", transactions, filterInfo }: PrintButtonProps) {
  const [isPreparing, setIsPreparing] = useState(false);

  const handlePrint = async () => {
    if (!transactions || transactions.length === 0) {
      window.print();
      return;
    }

    setIsPreparing(true);

    try {
      const printContainer = document.createElement("div");
      printContainer.id = "print-report-container";
      printContainer.style.position = "fixed";
      printContainer.style.left = "0";
      printContainer.style.top = "0";
      printContainer.style.width = "100%";
      printContainer.style.height = "100%";
      printContainer.style.zIndex = "99999";
      printContainer.style.backgroundColor = "white";
      printContainer.style.overflow = "auto";
      printContainer.style.display = "none";
      document.body.appendChild(printContainer);

      const root = createRoot(printContainer);
      
      await new Promise<void>((resolve) => {
        root.render(
          <PrintableTransactionsReport
            transactions={transactions}
            documentTitle={documentTitle}
            filterInfo={filterInfo}
          />
        );
        setTimeout(resolve, 300);
      });

      const style = document.createElement("style");
      style.id = "print-style-override";
      style.textContent = `
        @media print {
          body > *:not(#print-report-container) {
            display: none !important;
          }
          #print-report-container {
            display: block !important;
            position: static !important;
            width: auto !important;
            height: auto !important;
            overflow: visible !important;
          }
          .pdf-page {
            page-break-after: always;
            break-after: page;
          }
          .pdf-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `;
      document.head.appendChild(style);

      printContainer.style.display = "block";
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      window.print();

      setTimeout(() => {
        root.unmount();
        document.body.removeChild(printContainer);
        const styleElement = document.getElementById("print-style-override");
        if (styleElement) {
          document.head.removeChild(styleElement);
        }
      }, 1000);

    } catch (error) {
      console.error("Print preparation failed:", error);
    } finally {
      setIsPreparing(false);
    }
  };

  return (
    <Button
      onClick={handlePrint}
      variant="outline"
      size="sm"
      className={className}
      disabled={isPreparing}
      data-testid="button-print"
    >
      {isPreparing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Hazırlanıyor...
        </>
      ) : (
        <>
          <Printer className="h-4 w-4 mr-2" />
          Yazdır
        </>
      )}
    </Button>
  );
}
