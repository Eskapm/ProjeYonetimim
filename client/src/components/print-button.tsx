import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import eskaLogo from "@assets/ESKA LOGO TASARIMI_1761521113587.png";
import { format } from "date-fns";

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handlePrint = async () => {
    if (!transactions || transactions.length === 0) {
      window.print();
      return;
    }

    setIsPrinting(true);

    try {
      const totalIncome = transactions
        .filter(t => t.type === "Gelir")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const totalExpense = transactions
        .filter(t => t.type === "Gider")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error("Popup blocked");
      }

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${documentTitle}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 12mm 20mm 12mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      color: #000;
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 8px;
      border-bottom: 2px solid #333;
      margin-bottom: 10px;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo {
      height: 50px;
      width: auto;
    }
    
    .company-info {
      font-size: 8pt;
      line-height: 1.4;
    }
    
    .company-info p {
      margin: 1px 0;
    }
    
    .company-name {
      font-weight: 600;
      margin-top: 3px !important;
    }
    
    .contact-info {
      text-align: right;
      font-size: 8pt;
    }
    
    .contact-info p {
      margin: 1px 0;
    }
    
    .date-section {
      margin-top: 6px;
      padding-top: 4px;
      border-top: 1px solid #ccc;
    }
    
    .document-title {
      text-align: center;
      font-size: 12pt;
      font-weight: bold;
      margin: 10px 0;
      text-transform: uppercase;
    }
    
    .filter-info {
      text-align: center;
      font-size: 8pt;
      color: #666;
      margin-bottom: 8px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      table-layout: auto;
    }
    
    thead {
      display: table-header-group;
    }
    
    tbody {
      display: table-row-group;
    }
    
    tfoot {
      display: table-footer-group;
    }
    
    th {
      background-color: #f0f0f0;
      padding: 5px 4px;
      border: 1px solid #999;
      font-weight: bold;
      text-align: left;
      white-space: nowrap;
    }
    
    th.center { text-align: center; }
    th.right { text-align: right; }
    
    td {
      padding: 4px;
      border: 1px solid #ddd;
      vertical-align: top;
    }
    
    td.center { text-align: center; }
    td.right { text-align: right; }
    td.nowrap { white-space: nowrap; }
    
    tr {
      page-break-inside: avoid;
    }
    
    tr:nth-child(even) {
      background-color: #fafafa;
    }
    
    .type-gelir {
      color: #16a34a;
      font-weight: 600;
    }
    
    .type-gider {
      color: #dc2626;
      font-weight: 600;
    }
    
    .hakedis-yes {
      color: #16a34a;
      font-weight: 600;
    }
    
    .hakedis-no {
      color: #999;
    }
    
    .amount {
      font-family: monospace;
      font-weight: 600;
      white-space: nowrap;
    }
    
    .description-cell {
      max-width: 150px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .summary-section {
      margin-top: 15px;
      padding: 10px;
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      page-break-inside: avoid;
    }
    
    .summary-grid {
      display: flex;
      justify-content: space-around;
    }
    
    .summary-item {
      text-align: center;
    }
    
    .summary-label {
      color: #666;
      font-size: 8pt;
      margin-bottom: 3px;
    }
    
    .summary-value {
      font-weight: bold;
      font-family: monospace;
      font-size: 10pt;
    }
    
    .summary-value.income { color: #16a34a; }
    .summary-value.expense { color: #dc2626; }
    .summary-value.balance { color: #2563eb; }
    
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <img src="${eskaLogo}" alt="Eska Yapı Logo" class="logo" />
      <div class="company-info">
        <p><strong>Vergi Dairesi:</strong> Fethiye V.D. - 3801336650</p>
        <p><strong>Adres:</strong> Foça Mah. 967 Sok. Nilüfer Sit. No:30-5 Fethiye/MUĞLA</p>
        <p class="company-name">Eska Yapı Müh. İnş. Emlak Tur. ve Tic. Ltd. Şti.</p>
      </div>
    </div>
    <div class="contact-info">
      <p><strong>İletişim Bilgileri</strong></p>
      <p><strong>E-mail:</strong> enginkayserili@gmail.com</p>
      <p><strong>Tel:</strong> 0 505 821 54 79</p>
      <div class="date-section">
        <p><strong>Tarih:</strong> ${format(new Date(), "dd/MM/yyyy")}</p>
      </div>
    </div>
  </div>
  
  <h1 class="document-title">${documentTitle}</h1>
  
  ${filterInfo ? `<p class="filter-info">${filterInfo}</p>` : ''}
  
  <table>
    <thead>
      <tr>
        <th class="center" style="width: 25px;">No</th>
        <th style="width: 70px;">Tarih</th>
        <th>Proje</th>
        <th class="center" style="width: 45px;">Tür</th>
        <th>İş Grubu</th>
        <th>Rayiç Grubu</th>
        <th>Açıklama</th>
        <th class="center" style="width: 35px;">Hak.</th>
        <th class="right" style="width: 100px;">Tutar</th>
      </tr>
    </thead>
    <tbody>
      ${transactions.map((t, i) => `
        <tr>
          <td class="center">${i + 1}</td>
          <td class="nowrap">${formatDate(t.date)}</td>
          <td>${t.projectName}</td>
          <td class="center ${t.type === 'Gelir' ? 'type-gelir' : 'type-gider'}">${t.type}</td>
          <td>${t.isGrubu || '-'}</td>
          <td>${t.rayicGrubu || '-'}</td>
          <td class="description-cell">${t.description || '-'}</td>
          <td class="center ${t.progressPaymentId ? 'hakedis-yes' : 'hakedis-no'}">${t.progressPaymentId ? '✓' : '-'}</td>
          <td class="right amount">${formatCurrency(t.amount)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="summary-section">
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-label">Toplam Gelir</div>
        <div class="summary-value income">${formatCurrency(totalIncome)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Toplam Gider</div>
        <div class="summary-value expense">${formatCurrency(totalExpense)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Net Bakiye</div>
        <div class="summary-value balance">${formatCurrency(totalIncome - totalExpense)}</div>
      </div>
    </div>
  </div>
  
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        window.close();
      }, 500);
    };
  </script>
</body>
</html>`;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

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
