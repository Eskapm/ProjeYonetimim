import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";

interface ExportToExcelProps {
  data: any[];
  filename: string;
  sheetName?: string;
  documentTitle?: string;
  testId?: string;
}

export function ExportToExcel({ data, filename, sheetName = "Sayfa1", documentTitle, testId }: ExportToExcelProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("Dışa aktarılacak veri yok");
      return;
    }

    // Kurumsal başlık verileri
    const companyHeader = [
      ["ESKA YAPI MÜHENDİSLİK İNŞAAT EMLAK TURİZM VE TİCARET LİMİTED ŞİRKETİ"],
      [],
      ["Mersis No: 0380 1336 6500 0001", "", "", "E-mail: enginkayserili@gmail.com"],
      ["Vergi Dairesi: Fethiye V.D. - 3801336650", "", "", "Tel: 0 505 821 54 79"],
      ["Adres: Foça Mah. 967 (FCA) Sok. Nilüfer Sit. No:30-5 İç Kapı No:2 Fethiye/MUĞLA"],
      [],
      [documentTitle || sheetName || "Rapor"],
      [`Tarih: ${format(new Date(), "dd/MM/yyyy HH:mm")}`],
      [],
    ];

    // Veriyi oluştur
    const worksheet = XLSX.utils.aoa_to_sheet(companyHeader);
    
    // Ana veriyi ekle
    XLSX.utils.sheet_add_json(worksheet, data, { 
      origin: -1, // Son satırdan sonra ekle
      skipHeader: false 
    });

    // Sütun genişliklerini ayarla
    const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
    worksheet['!cols'] = colWidths;

    // Satır yüksekliklerini ayarla
    worksheet['!rows'] = [
      { hpt: 20 }, // Başlık
      { hpt: 5 },  // Boşluk
      { hpt: 15 }, // Mersis
      { hpt: 15 }, // Vergi
      { hpt: 15 }, // Adres
      { hpt: 5 },  // Boşluk
      { hpt: 18 }, // Belge adı
      { hpt: 15 }, // Tarih
      { hpt: 5 },  // Boşluk
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    
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
