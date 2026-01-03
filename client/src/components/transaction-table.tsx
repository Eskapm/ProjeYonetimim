import { Fragment, useMemo } from "react";
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
import { Edit, Trash2, Check, X, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface TransactionWithProject {
  id: string;
  date: string;
  projectId: string;
  projectName: string;
  type: string;
  amount: string;
  isGrubu?: string | null;
  rayicGrubu?: string | null;
  description?: string | null;
  invoiceNumber?: string | null;
  subcontractorId?: string | null;
  subcontractorName?: string;
  progressPaymentId?: string | null;
  createdAt?: Date | null;
  incomeKind?: string | null;
  customerId?: string | null;
  customerName?: string;
  linkedProgressPaymentId?: string | null;
  linkedProgressPaymentNumber?: number;
  paymentMethod?: string | null;
  checkDueDate?: string | null;
  receiptNumber?: string | null;
  linkedInvoiceId?: string | null;
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
  // A4 height: 297mm
  // First page: Header area with company info (~100mm), Table header (~10mm) = ~110mm remaining = ~13 rows
  // Subsequent pages: Just table header (~10mm), no company header = ~287mm remaining = ~18 rows
  const ROWS_FIRST_PAGE = 13;
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
    <div className="space-y-4 print:space-y-0 print:m-0 print:p-0">
      <div className="responsive-table-wrapper print:border-0 print:rounded-none print:overflow-visible print:space-y-0 print:m-0 print:p-0">
        <Table className="w-full print:w-full print:m-0 print:p-0">
          <TableHeader className="print:display-table-header-group">
            <TableRow className="print:page-break-inside-avoid">
              <TableHead className="w-[50px] min-w-[50px] text-center print:w-[40px] print:min-w-[40px] hide-mobile">No</TableHead>
              <TableHead className="w-[90px] min-w-[90px] print:w-[70px] print:min-w-[70px]">Tarih</TableHead>
              <TableHead className="min-w-[100px] print:w-[80px] print:min-w-[80px]">Proje</TableHead>
              <TableHead className="w-[70px] min-w-[70px] print:w-[50px] print:min-w-[50px]">Tür</TableHead>
              <TableHead className="print-hidden hide-tablet">Gelir Türü</TableHead>
              <TableHead className="print-hidden hide-tablet">Ödeme</TableHead>
              <TableHead className="print:w-[60px] print:min-w-[60px] hide-mobile">İş Grubu</TableHead>
              <TableHead className="print:w-[60px] print:min-w-[60px] hide-mobile">Rayiç</TableHead>
              <TableHead className="print:w-[100px] print:min-w-[100px] hide-tablet">Açıklama</TableHead>
              <TableHead className="text-center print:w-[40px] print:min-w-[40px] hide-mobile">Hakediş</TableHead>
              <TableHead className="text-right w-[130px] min-w-[100px] print:w-[80px] print:min-w-[80px]">Tutar</TableHead>
              <TableHead className="text-right print-hidden w-[100px]">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                  Henüz işlem kaydı bulunmamaktadır
                </TableCell>
              </TableRow>
            ) : (
              <>
                {/* Screen view - all transactions (visible only on screen) */}
                {transactions.map((transaction, index) => (
                  <TableRow 
                    key={transaction.id} 
                    data-testid={`row-transaction-${transaction.id}`}
                    className="print-hidden"
                  >
                    <TableCell className="text-center font-medium text-muted-foreground hide-mobile">{index + 1}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap text-sm">{formatDate(transaction.date)}</TableCell>
                    <TableCell className="text-sm">{transaction.projectName}</TableCell>
                    <TableCell>
                      <Badge
                        className={`responsive-badge ${
                          transaction.type === "Gelir"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm hide-tablet">
                      {transaction.type === "Gelir" ? (transaction.incomeKind || "-") : "-"}
                    </TableCell>
                    <TableCell className="text-sm hide-tablet">
                      {transaction.type === "Gelir" ? (transaction.paymentMethod || "-") : "-"}
                    </TableCell>
                    <TableCell className="text-sm hide-mobile">{transaction.isGrubu || "-"}</TableCell>
                    <TableCell className="text-sm hide-mobile">{transaction.rayicGrubu || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] hide-tablet">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{transaction.description || '-'}</span>
                        {transaction.linkedInvoiceId && (
                          <Badge variant="outline" className="shrink-0 gap-1 text-xs py-0 px-1">
                            <FileText className="h-3 w-3" />
                            Fatura
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center hide-mobile" data-testid={`text-progress-payment-status-${transaction.id}`}>
                      {transaction.progressPaymentId ? (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-right responsive-amount font-semibold">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit?.(transaction)}
                          data-testid={`button-edit-transaction-${transaction.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onDelete?.(transaction.id)}
                          data-testid={`button-delete-transaction-${transaction.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Print view - paginated (visible only on print) */}
                {pages.map((pageTransactions, pageIndex) => {
                  const cumulativeTotal = getCumulativeTotal(pageIndex);
                  const pageTotals = getPageTotals(pageTransactions);
                  // Calculate starting row number for this page - account for different first page size
                  let startRowNumber = 1;
                  if (pageIndex === 0) {
                    startRowNumber = 1;
                  } else {
                    startRowNumber = ROWS_FIRST_PAGE + 1 + ((pageIndex - 1) * ROWS_PER_PAGE);
                  }
                  
                  return (
                    <Fragment key={`page-${pageIndex}`}>
                      {/* Page break before each page except first */}
                      {pageIndex > 0 && (
                        <TableRow className="print-only print-page-break">
                          <TableCell colSpan={10} className="p-0 h-[3cm] border-none"></TableCell>
                        </TableRow>
                      )}

                      {/* "Bir Önceki Sayfadan Nakledilen Tutar" row for pages 2+ */}
                      {pageIndex > 0 && (
                        <TableRow className="print-only print-carryover-row">
                          <TableCell></TableCell>
                          <TableCell colSpan={7} className="font-bold text-right pr-4">
                            Bir Önceki Sayfadan Nakledilen Tutar:
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold whitespace-nowrap">
                            {formatCurrency(cumulativeTotal)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      )}

                      {/* Page transactions */}
                      {pageTransactions.map((transaction, indexInPage) => (
                        <TableRow 
                          key={`print-${transaction.id}`}
                          data-testid={`row-transaction-${transaction.id}`}
                          className="print-only"
                        >
                          <TableCell className="text-center font-medium text-muted-foreground">{startRowNumber + indexInPage}</TableCell>
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
                          <TableCell className="text-sm">{transaction.rayicGrubu || "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {transaction.description || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {transaction.progressPaymentId ? "✓" : ""}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold whitespace-nowrap">
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}

                      {/* Page summary row */}
                      <TableRow className="print-only print-page-summary">
                        <TableCell></TableCell>
                        <TableCell colSpan={7} className="text-right font-bold pr-4">
                          Toplam Tutar:
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold whitespace-nowrap">
                          {formatCurrency(pageTotals.income - pageTotals.expense)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </>
            )}
          </TableBody>
        </Table>
      </div>
      
      {transactions.length > 0 && (
        <div className="flex justify-end gap-8 p-4 bg-muted/50 rounded-md">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Toplam Gelir</div>
            <div className="text-lg font-bold font-mono text-green-600 dark:text-green-400 whitespace-nowrap">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Toplam Gider</div>
            <div className="text-lg font-bold font-mono text-red-600 dark:text-red-400 whitespace-nowrap">
              {formatCurrency(totalExpense)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Net</div>
            <div className={`text-lg font-bold font-mono whitespace-nowrap ${totalIncome - totalExpense >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
