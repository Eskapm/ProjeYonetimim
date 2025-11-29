import { useState, useRef } from "react";
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
  isGrubu: string;
  rayicGrubu: string;
  description: string | null;
  progressPaymentId: string | null;
}

interface PrintButtonProps {
  className?: string;
  documentTitle?: string;
  transactions?: TransactionData[];
  filterInfo?: string;
}

export function PrintButton({ className, documentTitle = "Rapor", transactions, filterInfo }: PrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    if (!transactions || transactions.length === 0) {
      window.print();
      return;
    }

    setIsPrinting(true);

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

      printContainer.style.display = "block";

      const originalContents = document.body.innerHTML;
      const printContents = printContainer.innerHTML;
      
      document.body.innerHTML = `
        <div style="width: 210mm; margin: 0 auto; background: white;">
          ${printContents}
        </div>
      `;

      window.print();

      document.body.innerHTML = originalContents;

      const newPrintContainer = document.getElementById("print-report-container");
      if (newPrintContainer) {
        newPrintContainer.remove();
      }

      window.location.reload();
    } catch (error) {
      console.error("Print failed:", error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Button
      onClick={handlePrint}
      variant="outline"
      size="sm"
      className={className}
      disabled={isPrinting}
      data-testid="button-print"
    >
      {isPrinting ? (
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
