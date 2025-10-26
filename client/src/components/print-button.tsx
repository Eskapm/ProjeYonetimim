import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintButtonProps {
  className?: string;
}

export function PrintButton({ className }: PrintButtonProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button
      onClick={handlePrint}
      variant="outline"
      size="sm"
      className={className}
      data-testid="button-print"
    >
      <Printer className="h-4 w-4 mr-2" />
      Yazdır
    </Button>
  );
}
