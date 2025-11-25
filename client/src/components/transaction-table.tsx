import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface TransactionWithProject {
  id: string;
  date: string;
  projectId: string;
  projectName: string;
  type: string;
  amount: string;
  isGrubu: string;
  rayicGrubu: string;
  description: string | null;
  invoiceNumber: string | null;
  progressPaymentId: string | null;
  createdAt: Date | null;
}

interface TransactionTableProps {
  transactions: TransactionWithProject[];
  onEdit?: (transaction: TransactionWithProject) => void;
  onDelete?: (id: string) => void;
}

export function TransactionTable({ transactions, onEdit, onDelete }: TransactionTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Dynamic page break calculation - optimized for first page vs subsequent pages
  // A4 height: 297mm, margins: 40mm (top+bottom)
  // Available height: 257mm
  // First page: Header area with company info (~100mm) = ~157mm available = 12 rows
  // Subsequent pages: ~257mm available = 18 rows
  const ROWS_FIRST_PAGE = 12;
  const ROWS_PER_PAGE = 18;

  const totalIncome = transactions
    .filter(t => t.type === "Gelir")
    .reduce((sum, t) => {
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      return sum + amount;
    }, 0);

  const totalExpense = transactions
    .filter(t => t.type === "Gider")
    .reduce((sum, t) => {
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      return sum + amount;
    }, 0);

  // Group transactions by pages for printing - different row counts for first and subsequent pages
  const pages = useMemo(() => {
    if (transactions.length === 0) return [];
    
    const result = [];
    let index = 0;
    
    // First page with reduced rows
    if (transactions.length > 0) {
      result.push(transactions.slice(0, ROWS_FIRST_PAGE));
      index = ROWS_FIRST_PAGE;
    }
    
    // Subsequent pages with full rows
    while (index < transactions.length) {
      result.push(transactions.slice(index, index + ROWS_PER_PAGE));
      index += ROWS_PER_PAGE;
    }
    
    return result;
  }, [transactions]);

  // Helper function to calculate page totals
  const getPageTotals = (transactionsInPage: TransactionWithProject[]) => {
    const income = transactionsInPage
      .filter(t => t.type === "Gelir")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const expense = transactionsInPage
      .filter(t => t.type === "Gider")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return { income, expense };
  };

  // Helper function to calculate cumulative total up to specific page
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

  return (
    <div className="space-y-4">
      {/* SCREEN VIEW - Normal display */}
      <div className="rounded-md border overflow-x-auto w-full print-hidden">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] min-w-[60px] text-center">Sıra No</TableHead>
              <TableHead className="w-[110px] min-w-[110px]">Tarih</TableHead>
              <TableHead>Proje</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>İş Grubu</TableHead>
              <TableHead>Rayiç Grubu</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead className="text-center">Hakedişe Dahil</TableHead>
              <TableHead className="text-right w-[200px] min-w-[200px]">Tutar</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  Henüz işlem kaydı bulunmamaktadır
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction, index) => (
                <TableRow 
                  key={transaction.id} 
                  data-testid={`row-transaction-${transaction.id}`}
                >
                  <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.projectName}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        transaction.type === "Gelir"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }
                    >
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{transaction.isGrubu}</TableCell>
                  <TableCell className="text-sm">{transaction.rayicGrubu}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {transaction.description || '-'}
                  </TableCell>
                  <TableCell className="text-center" data-testid={`text-progress-payment-status-${transaction.id}`}>
                    {transaction.progressPaymentId ? (
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(transaction)}
                        data-testid={`button-edit-transaction-${transaction.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete?.(transaction.id)}
                        data-testid={`button-delete-transaction-${transaction.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* PRINT VIEW - Paginated for printing */}
      <div className="print-only">
        {pages.map((pageTransactions, pageIndex) => {
          const cumulativeTotal = getCumulativeTotal(pageIndex);
          const pageTotals = getPageTotals(pageTransactions);
          let startRowNumber = 1;
          if (pageIndex === 0) {
            startRowNumber = 1;
          } else {
            startRowNumber = ROWS_FIRST_PAGE + 1 + ((pageIndex - 1) * ROWS_PER_PAGE);
          }

          return (
            <div 
              key={`print-page-${pageIndex}`} 
              className="print-page-wrapper"
              style={{
                pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'avoid',
                breakAfter: pageIndex < pages.length - 1 ? 'page' : 'avoid',
                minHeight: '257mm',
                display: 'block',
                width: '100%'
              }}
            >
              {/* Page break spacing for non-first pages */}
              {pageIndex > 0 && (
                <div style={{ height: '30mm', display: 'block' }}></div>
              )}

              {/* "Bir Önceki Sayfadan Nakledilen Tutar" row for pages 2+ */}
              {pageIndex > 0 && (
                <div style={{ 
                  display: 'table',
                  width: '100%',
                  marginBottom: '8px',
                  pageBreakInside: 'avoid'
                }}>
                  <div style={{
                    display: 'table-row',
                    backgroundColor: '#f0f0f0',
                    fontWeight: 'bold',
                    borderTop: '2px solid #000',
                    borderBottom: '2px solid #000'
                  }}>
                    <div style={{ display: 'table-cell', padding: '8px', width: '8.3%' }}></div>
                    <div style={{ display: 'table-cell', padding: '8px', textAlign: 'right', width: '83.4%' }}>
                      Bir Önceki Sayfadan Nakledilen Tutar:
                    </div>
                    <div style={{ display: 'table-cell', padding: '8px', textAlign: 'right', width: '8.3%' }}>
                      {formatCurrency(cumulativeTotal)}
                    </div>
                  </div>
                </div>
              )}

              {/* Table */}
              <table style={{ 
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '9pt',
                pageBreakInside: 'avoid'
              }}>
                <thead>
                  <tr style={{ 
                    backgroundColor: '#f5f5f5',
                    pageBreakInside: 'avoid'
                  }}>
                    <th style={{ padding: '5px 6px', textAlign: 'center', borderBottom: '1px solid #999', width: '5%' }}>Sıra No</th>
                    <th style={{ padding: '5px 6px', borderBottom: '1px solid #999', width: '8%' }}>Tarih</th>
                    <th style={{ padding: '5px 6px', borderBottom: '1px solid #999', width: '12%' }}>Proje</th>
                    <th style={{ padding: '5px 6px', borderBottom: '1px solid #999', width: '8%' }}>Tür</th>
                    <th style={{ padding: '5px 6px', borderBottom: '1px solid #999', width: '10%' }}>İş Grubu</th>
                    <th style={{ padding: '5px 6px', borderBottom: '1px solid #999', width: '10%' }}>Rayiç Grubu</th>
                    <th style={{ padding: '5px 6px', borderBottom: '1px solid #999', width: '15%' }}>Açıklama</th>
                    <th style={{ padding: '5px 6px', textAlign: 'center', borderBottom: '1px solid #999', width: '8%' }}>Hakedişe</th>
                    <th style={{ padding: '5px 6px', textAlign: 'right', borderBottom: '1px solid #999', width: '14%' }}>Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {pageTransactions.map((transaction, indexInPage) => (
                    <tr 
                      key={`print-${transaction.id}`}
                      style={{
                        pageBreakInside: 'avoid',
                        breakInside: 'avoid'
                      }}
                    >
                      <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
                        {startRowNumber + indexInPage}
                      </td>
                      <td style={{ padding: '4px 6px', whiteSpace: 'nowrap', borderBottom: '1px solid #e0e0e0' }}>
                        {formatDate(transaction.date)}
                      </td>
                      <td style={{ padding: '4px 6px', borderBottom: '1px solid #e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                        {transaction.projectName}
                      </td>
                      <td style={{ padding: '4px 6px', borderBottom: '1px solid #e0e0e0' }}>
                        {transaction.type}
                      </td>
                      <td style={{ padding: '4px 6px', borderBottom: '1px solid #e0e0e0' }}>
                        {transaction.isGrubu}
                      </td>
                      <td style={{ padding: '4px 6px', borderBottom: '1px solid #e0e0e0' }}>
                        {transaction.rayicGrubu}
                      </td>
                      <td style={{ padding: '4px 6px', borderBottom: '1px solid #e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                        {transaction.description || '-'}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
                        {transaction.progressPaymentId ? '✓' : ''}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '8.5pt' }}>
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Page summary row - "Toplam Tutar" */}
              <div style={{ 
                display: 'table',
                width: '100%',
                marginTop: '8px',
                pageBreakInside: 'avoid'
              }}>
                <div style={{
                  display: 'table-row',
                  backgroundColor: '#f9f9f9',
                  fontWeight: 'bold',
                  borderTop: '2px solid #333',
                  borderBottom: '2px solid #333'
                }}>
                  <div style={{ display: 'table-cell', padding: '8px', width: '8.3%' }}></div>
                  <div style={{ display: 'table-cell', padding: '8px', textAlign: 'right', width: '83.4%' }}>
                    Toplam Tutar:
                  </div>
                  <div style={{ display: 'table-cell', padding: '8px', textAlign: 'right', width: '8.3%' }}>
                    {formatCurrency(pageTotals.income - pageTotals.expense)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary cards - screen view only */}
      {transactions.length > 0 && (
        <div className="flex justify-end gap-8 p-4 bg-muted/50 rounded-md print-hidden">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Toplam Gelir</div>
            <div className="text-lg font-bold font-mono text-green-600 dark:text-green-400">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Toplam Gider</div>
            <div className="text-lg font-bold font-mono text-red-600 dark:text-red-400">
              {formatCurrency(totalExpense)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Net</div>
            <div className={`text-lg font-bold font-mono ${totalIncome - totalExpense >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
