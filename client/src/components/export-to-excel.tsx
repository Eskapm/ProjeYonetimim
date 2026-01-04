import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import ExcelJS from "exceljs";
import { format } from "date-fns";

interface ExportToExcelProps {
  data: any[];
  filename: string;
  sheetName?: string;
  documentTitle?: string;
  testId?: string;
}

export function ExportToExcel({ data, filename, sheetName = "Sayfa1", documentTitle, testId }: ExportToExcelProps) {
  const handleExport = async () => {
    if (!data || data.length === 0) {
      alert("Dışa aktarılacak veri yok");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.addRow(["ESKA YAPI MÜHENDİSLİK İNŞAAT EMLAK TURİZM VE TİCARET LİMİTED ŞİRKETİ"]);
    worksheet.addRow([]);
    worksheet.addRow(["Mersis No: 0380 1336 6500 0001", "", "", "E-mail: enginkayserili@gmail.com"]);
    worksheet.addRow(["Vergi Dairesi: Fethiye V.D. - 3801336650", "", "", "Tel: 0 505 821 54 79"]);
    worksheet.addRow(["Adres: Foça Mah. 967 (FCA) Sok. Nilüfer Sit. No:30-5 İç Kapı No:2 Fethiye/MUĞLA"]);
    worksheet.addRow([]);
    worksheet.addRow([documentTitle || sheetName || "Rapor"]);
    worksheet.addRow([`Tarih: ${format(new Date(), "dd/MM/yyyy HH:mm")}`]);
    worksheet.addRow([]);

    worksheet.getRow(1).height = 20;
    worksheet.getRow(2).height = 5;
    worksheet.getRow(3).height = 15;
    worksheet.getRow(4).height = 15;
    worksheet.getRow(5).height = 15;
    worksheet.getRow(6).height = 5;
    worksheet.getRow(7).height = 18;
    worksheet.getRow(8).height = 15;
    worksheet.getRow(9).height = 5;

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      
      data.forEach((row) => {
        const values = headers.map((header) => row[header]);
        worksheet.addRow(values);
      });

      headers.forEach((_, index) => {
        worksheet.getColumn(index + 1).width = 20;
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const dataBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport}
      data-testid={testId || "button-export-excel"}
      className="no-print"
    >
      <FileSpreadsheet className="h-4 w-4 mr-2" />
      Excel'e Aktar
    </Button>
  );
}
