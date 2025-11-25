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

  // Dynamic page break calculation
  // A4 height: 297mm, Header area: ~140mm, Table header: ~10mm
  // Remaining: ~147mm. Each row: ~8mm. Rows per page: ~18
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

  // Group transactions by pages for printing
  const pages = useMemo(() => {
    if (transactions.length === 0) return [];
    
    const result = [];
    for (let i = 0; i < transactions.length; i += ROWS_PER_PAGE) {
      result.push(transactions.slice(i, i + ROWS_PER_PAGE));
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
      <div className="rounded-md border overflow-x-auto w-full">
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
              <>
                {/* Screen view - all transactions (visible only on screen) */}
                {transactions.map((transaction, index) => (
                  <TableRow 
                    key={transaction.id} 
                    data-testid={`row-transaction-${transaction.id}`}
                    className="print-hidden"
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
                ))}

                {/* Print view - paginated (visible only on print) */}
                {pages.map((pageTransactions, pageIndex) => {
                  const cumulativeTotal = getCumulativeTotal(pageIndex);
                  const pageTotals = getPageTotals(pageTransactions);
                  // Calculate starting row number for this page
                  const startRowNumber = pageIndex * ROWS_PER_PAGE + 1;
                  
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
                          <TableCell className="text-right font-mono font-bold">
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
                          <TableCell className="text-sm">{transaction.rayicGrubu}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {transaction.description || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {transaction.progressPaymentId ? "✓" : ""}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
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
                        <TableCell className="text-right font-mono font-bold">
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
