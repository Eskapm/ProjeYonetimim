import { forwardRef, useMemo } from "react";
import eskaLogo from "@assets/ESKA LOGO TASARIMI_1761521113587.png";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/format";

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

interface PrintableTransactionsReportProps {
  transactions: TransactionData[];
  documentTitle?: string;
  filterInfo?: string;
}

interface ColumnWidths {
  no: string;
  date: string;
  project: string;
  type: string;
  isGrubu: string;
  rayicGrubu: string;
  description: string;
  hakedis: string;
  amount: string;
}

export const PrintableTransactionsReport = forwardRef<HTMLDivElement, PrintableTransactionsReportProps>(
  ({ transactions, documentTitle = "GELİR & GİDER İŞLEMLERİ RAPORU", filterInfo }, ref) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const columnWidths = useMemo((): ColumnWidths => {
      const maxNoLength = Math.max(2, String(transactions.length).length);
      const maxProjectLength = Math.max(5, ...transactions.map(t => t.projectName?.length || 0));
      const maxIsGrubuLength = Math.max(6, ...transactions.map(t => t.isGrubu?.length || 0));
      const maxRayicGrubuLength = Math.max(8, ...transactions.map(t => t.rayicGrubu?.length || 0));
      const maxAmountLength = Math.max(5, ...transactions.map(t => formatCurrency(t.amount).length));
      
      const charWidth = 2.5;
      const noWidth = Math.min(maxNoLength * charWidth + 4, 20);
      const dateWidth = 58;
      const projectWidth = Math.min(maxProjectLength * charWidth + 4, 70);
      const typeWidth = 35;
      const isGrubuWidth = Math.min(maxIsGrubuLength * charWidth + 4, 65);
      const rayicGrubuWidth = Math.min(maxRayicGrubuLength * charWidth + 4, 65);
      const hakedisWidth = 30;
      const amountWidth = Math.max(75, maxAmountLength * 5.5 + 8);
      
      const fixedWidth = noWidth + dateWidth + projectWidth + typeWidth + isGrubuWidth + rayicGrubuWidth + hakedisWidth + amountWidth;
      const totalWidth = 186;
      const descriptionWidth = Math.max(totalWidth - fixedWidth, 40);
      
      return {
        no: `${noWidth}px`,
        date: `${dateWidth}px`,
        project: `${projectWidth}px`,
        type: `${typeWidth}px`,
        isGrubu: `${isGrubuWidth}px`,
        rayicGrubu: `${rayicGrubuWidth}px`,
        description: `${descriptionWidth}px`,
        hakedis: `${hakedisWidth}px`,
        amount: `${amountWidth}px`
      };
    }, [transactions]);

    const getRowHeight = (transaction: TransactionData): number => {
      const descLength = transaction.description?.length || 0;
      const descColWidth = parseInt(columnWidths.description) || 80;
      const charsPerLine = Math.floor(descColWidth / 4);
      const lines = Math.ceil(descLength / charsPerLine) || 1;
      const baseHeight = 18;
      const lineHeight = 10;
      return Math.max(baseHeight, baseHeight + (lines - 1) * lineHeight);
    };

    const PAGE_HEIGHT_MM = 297;
    const PAGE_PADDING_MM = 20;
    const HEADER_HEIGHT_FIRST_PAGE = 95;
    const HEADER_HEIGHT_OTHER_PAGES = 15;
    const FOOTER_HEIGHT = 25;
    const TABLE_HEADER_HEIGHT = 20;
    const SUMMARY_ROW_HEIGHT = 22;
    const CARRYOVER_ROW_HEIGHT = 22;
    const FINAL_SUMMARY_HEIGHT = 45;

    const pages = useMemo(() => {
      if (transactions.length === 0) return [];
      
      const result: TransactionData[][] = [];
      let index = 0;
      
      const mmToPx = 3.78;
      
      while (index < transactions.length) {
        const isFirstPage = result.length === 0;
        const headerHeight = isFirstPage ? HEADER_HEIGHT_FIRST_PAGE : HEADER_HEIGHT_OTHER_PAGES;
        const carryoverHeight = isFirstPage ? 0 : CARRYOVER_ROW_HEIGHT;
        
        const availableHeight = (PAGE_HEIGHT_MM - PAGE_PADDING_MM - (FOOTER_HEIGHT / mmToPx)) * mmToPx 
          - headerHeight * mmToPx 
          - TABLE_HEADER_HEIGHT 
          - SUMMARY_ROW_HEIGHT
          - carryoverHeight;
        
        const pageTransactions: TransactionData[] = [];
        let usedHeight = 0;
        
        while (index < transactions.length) {
          const rowHeight = getRowHeight(transactions[index]);
          
          if (usedHeight + rowHeight <= availableHeight || pageTransactions.length === 0) {
            pageTransactions.push(transactions[index]);
            usedHeight += rowHeight;
            index++;
          } else {
            break;
          }
        }
        
        result.push(pageTransactions);
      }
      
      return result;
    }, [transactions, columnWidths]);

    const getCumulativeTotal = (pageIndex: number) => {
      let total = 0;
      for (let i = 0; i < pageIndex; i++) {
        const pageTransactions = pages[i] || [];
        pageTransactions.forEach(t => {
          const amount = parseFloat(t.amount);
          total += t.type === "Gelir" ? amount : -amount;
        });
      }
      return total;
    };

    const getPageTotals = (pageTransactions: TransactionData[]) => {
      const income = pageTransactions
        .filter(t => t.type === "Gelir")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const expense = pageTransactions
        .filter(t => t.type === "Gider")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      return { income, expense };
    };

    const totalIncome = transactions
      .filter(t => t.type === "Gelir")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpense = transactions
      .filter(t => t.type === "Gider")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalPages = pages.length;

    return (
      <div ref={ref} style={{ 
        width: '210mm', 
        backgroundColor: 'white', 
        fontFamily: 'Arial, Helvetica, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
        color: '#000000'
      }}>
        {pages.map((pageTransactions, pageIndex) => {
          const cumulativeTotal = getCumulativeTotal(pageIndex);
          const pageTotals = getPageTotals(pageTransactions);
          let startRowNumber = 1;
          for (let i = 0; i < pageIndex; i++) {
            startRowNumber += pages[i].length;
          }
          const isFirstPage = pageIndex === 0;
          const isLastPage = pageIndex === pages.length - 1;

          return (
            <div 
              key={pageIndex} 
              className="pdf-page"
              style={{ 
                width: '210mm', 
                minHeight: '297mm',
                padding: '10mm 12mm',
                boxSizing: 'border-box',
                backgroundColor: 'white',
                pageBreakAfter: isLastPage ? 'auto' : 'always',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {isFirstPage && (
                <div style={{ marginBottom: '8mm' }}>
                  <div style={{ textAlign: 'center', marginBottom: '4mm' }}>
                    <img 
                      src={eskaLogo} 
                      alt="Eska Yapı Logo" 
                      style={{ height: '60px', width: 'auto', margin: '0 auto', display: 'block' }}
                    />
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '15px', 
                    marginBottom: '4mm', 
                    paddingBottom: '3mm', 
                    borderBottom: '2px solid black',
                    fontSize: '8pt'
                  }}>
                    <div>
                      <p style={{ fontWeight: 'bold', marginBottom: '2px', fontSize: '9pt' }}>Firma Bilgileri</p>
                      <p style={{ margin: '1px 0' }}><strong>Mersis No:</strong> 0380 1336 6500 0001</p>
                      <p style={{ margin: '1px 0' }}><strong>Vergi Dairesi:</strong> Fethiye V.D. - 3801336650</p>
                      <p style={{ margin: '1px 0' }}><strong>Adres:</strong> Foça Mah. 967 Sok. Nilüfer Sit. No:30-5 Fethiye/MUĞLA</p>
                      <p style={{ margin: '2px 0', fontWeight: '600' }}>Eska Yapı Müh. İnş. Emlak Tur. ve Tic. Ltd. Şti.</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '2px', fontSize: '9pt' }}>İletişim Bilgileri</p>
                      <p style={{ margin: '1px 0' }}><strong>E-mail:</strong> enginkayserili@gmail.com</p>
                      <p style={{ margin: '1px 0' }}><strong>Tel:</strong> 0 505 821 54 79</p>
                      <div style={{ marginTop: '3mm', paddingTop: '2mm', borderTop: '1px solid #ccc' }}>
                        <p style={{ margin: '1px 0' }}><strong>Tarih:</strong> {format(new Date(), "dd/MM/yyyy")}</p>
                      </div>
                    </div>
                  </div>

                  <h2 style={{ textAlign: 'center', fontSize: '11pt', fontWeight: 'bold', margin: '3mm 0', textTransform: 'uppercase' }}>
                    {documentTitle}
                  </h2>

                  {filterInfo && (
                    <p style={{ textAlign: 'center', fontSize: '8pt', color: '#666', margin: '0 0 2mm 0' }}>
                      {filterInfo}
                    </p>
                  )}
                </div>
              )}

              {!isFirstPage && (
                <div style={{ marginBottom: '3mm', paddingBottom: '2mm', borderBottom: '1px solid #333' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8pt' }}>
                    <span style={{ fontWeight: 'bold' }}>{documentTitle}</span>
                    <span>Sayfa {pageIndex + 1} / {totalPages}</span>
                  </div>
                </div>
              )}

              <div style={{ flex: 1 }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  fontSize: '9pt',
                  tableLayout: 'auto',
                  fontWeight: '500',
                  color: '#000000'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ width: columnWidths.no, minWidth: columnWidths.no, padding: '4px 2px', borderBottom: '1px solid #999', textAlign: 'center', fontWeight: 'bold' }}>No</th>
                      <th style={{ width: columnWidths.date, minWidth: columnWidths.date, padding: '4px 3px', borderBottom: '1px solid #999', textAlign: 'left', fontWeight: 'bold' }}>Tarih</th>
                      <th style={{ width: columnWidths.project, minWidth: columnWidths.project, padding: '4px 2px', borderBottom: '1px solid #999', textAlign: 'left', fontWeight: 'bold' }}>Proje</th>
                      <th style={{ width: columnWidths.type, minWidth: columnWidths.type, padding: '4px 2px', borderBottom: '1px solid #999', textAlign: 'center', fontWeight: 'bold' }}>Tür</th>
                      <th style={{ width: columnWidths.isGrubu, minWidth: columnWidths.isGrubu, padding: '4px 2px', borderBottom: '1px solid #999', textAlign: 'left', fontWeight: 'bold' }}>İş Grubu</th>
                      <th style={{ width: columnWidths.rayicGrubu, minWidth: columnWidths.rayicGrubu, padding: '4px 2px', borderBottom: '1px solid #999', textAlign: 'left', fontWeight: 'bold' }}>Rayiç Grubu</th>
                      <th style={{ width: columnWidths.description, minWidth: '40px', padding: '4px 2px', borderBottom: '1px solid #999', textAlign: 'left', fontWeight: 'bold' }}>Açıklama</th>
                      <th style={{ width: columnWidths.hakedis, minWidth: columnWidths.hakedis, padding: '4px 2px', borderBottom: '1px solid #999', textAlign: 'center', fontWeight: 'bold' }}>Hakediş</th>
                      <th style={{ width: columnWidths.amount, minWidth: columnWidths.amount, padding: '4px 2px', borderBottom: '1px solid #999', textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageIndex > 0 && (
                      <tr style={{ backgroundColor: '#e8f4e8', fontWeight: 'bold' }}>
                        <td colSpan={8} style={{ padding: '5px 4px', borderBottom: '2px solid #333', textAlign: 'right' }}>
                          Bir Önceki Sayfadan Nakledilen Tutar:
                        </td>
                        <td style={{ padding: '5px 4px', borderBottom: '2px solid #333', textAlign: 'right', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          {formatCurrency(cumulativeTotal)}
                        </td>
                      </tr>
                    )}
                    
                    {pageTransactions.map((transaction, indexInPage) => (
                      <tr key={transaction.id} style={{ backgroundColor: indexInPage % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ width: columnWidths.no, padding: '3px 2px', borderBottom: '1px solid #eee', textAlign: 'center', verticalAlign: 'top' }}>{startRowNumber + indexInPage}</td>
                        <td style={{ width: columnWidths.date, padding: '3px 3px', borderBottom: '1px solid #eee', textAlign: 'left', whiteSpace: 'nowrap', fontSize: '8pt', verticalAlign: 'top' }}>{formatDate(transaction.date)}</td>
                        <td style={{ width: columnWidths.project, padding: '3px 2px', borderBottom: '1px solid #eee', textAlign: 'left', fontSize: '8pt', verticalAlign: 'top', wordBreak: 'break-word' }}>{transaction.projectName}</td>
                        <td style={{ 
                          width: columnWidths.type,
                          padding: '3px 2px', 
                          borderBottom: '1px solid #eee', 
                          textAlign: 'center',
                          color: transaction.type === "Gelir" ? '#16a34a' : '#dc2626',
                          fontWeight: '600',
                          verticalAlign: 'top'
                        }}>{transaction.type}</td>
                        <td style={{ width: columnWidths.isGrubu, padding: '3px 2px', borderBottom: '1px solid #eee', textAlign: 'left', fontSize: '7pt', verticalAlign: 'top', wordBreak: 'break-word' }}>{transaction.isGrubu}</td>
                        <td style={{ width: columnWidths.rayicGrubu, padding: '3px 2px', borderBottom: '1px solid #eee', textAlign: 'left', fontSize: '7pt', verticalAlign: 'top', wordBreak: 'break-word' }}>{transaction.rayicGrubu}</td>
                        <td style={{ 
                          width: columnWidths.description, 
                          padding: '3px 2px', 
                          borderBottom: '1px solid #eee', 
                          textAlign: 'left', 
                          fontSize: '7pt', 
                          verticalAlign: 'top',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.3'
                        }}>{transaction.description || '-'}</td>
                        <td style={{ width: columnWidths.hakedis, padding: '3px 2px', borderBottom: '1px solid #eee', textAlign: 'center', fontSize: '8pt', fontWeight: '600', color: transaction.progressPaymentId ? '#16a34a' : '#999', verticalAlign: 'top' }}>
                          {transaction.progressPaymentId ? '✓' : '-'}
                        </td>
                        <td style={{ width: columnWidths.amount, padding: '3px 2px', borderBottom: '1px solid #eee', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                          {formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    ))}

                    <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                      <td colSpan={8} style={{ padding: '5px 4px', borderTop: '2px solid #333', borderBottom: '2px solid #333', textAlign: 'right' }}>
                        Toplam Tutar:
                      </td>
                      <td style={{ padding: '5px 4px', borderTop: '2px solid #333', borderBottom: '2px solid #333', textAlign: 'right', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {formatCurrency(cumulativeTotal + (pageTotals.income - pageTotals.expense))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {isLastPage && (
                <div style={{ 
                  marginTop: '5mm', 
                  padding: '4mm', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '9pt' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#666', marginBottom: '2px' }}>Toplam Gelir</div>
                      <div style={{ fontWeight: 'bold', fontFamily: 'monospace', color: '#16a34a' }}>{formatCurrency(totalIncome)}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#666', marginBottom: '2px' }}>Toplam Gider</div>
                      <div style={{ fontWeight: 'bold', fontFamily: 'monospace', color: '#dc2626' }}>{formatCurrency(totalExpense)}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#666', marginBottom: '2px' }}>Net Bakiye</div>
                      <div style={{ 
                        fontWeight: 'bold', 
                        fontFamily: 'monospace', 
                        color: totalIncome - totalExpense >= 0 ? '#16a34a' : '#dc2626' 
                      }}>
                        {formatCurrency(totalIncome - totalExpense)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ 
                marginTop: 'auto', 
                paddingTop: '3mm', 
                borderTop: '1px solid #ccc',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '7pt',
                color: '#666'
              }}>
                <span>Eska Yapı Müh. İnş. Emlak Tur. ve Tic. Ltd. Şti.</span>
                <span>Sayfa {pageIndex + 1} / {totalPages}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

PrintableTransactionsReport.displayName = 'PrintableTransactionsReport';
