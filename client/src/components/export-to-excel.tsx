import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

interface ExportToExcelProps {
  data: any[];
  filename: string;
  sheetName?: string;
}

export function ExportToExcel({ data, filename, sheetName = "Sayfa1" }: ExportToExcelProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("Dışa aktarılacak veri yok");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport}
      data-testid="button-export-excel"
      className="no-print"
    >
      <FileSpreadsheet className="h-4 w-4 mr-2" />
      Excel'e Aktar
    </Button>
  );
}
