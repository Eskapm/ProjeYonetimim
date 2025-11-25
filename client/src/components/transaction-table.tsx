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

  // Helper function to calculate cumulative total up to specific index
  const getCumulativeTotal = (upToIndex: number) => {
    let total = 0;
    for (let i = 0; i < upToIndex; i++) {
      const t = transactions[i];
      const amount = parseFloat(t.amount);
      total += t.type === "Gelir" ? amount : -amount;
    }
    return total;
  };

  // Helper function to calculate totals for a range of transactions
  const getRangeTotals = (startIndex: number, endIndex: number) => {
    let income = 0;
    let expense = 0;
    for (let i = startIndex; i < endIndex; i++) {
      if (transactions[i]) {
        const amount = parseFloat(transactions[i].amount);
        if (transactions[i].type === "Gelir") {
          income += amount;
        } else {
          expense += amount;
        }
      }
    }
    return { income, expense };
  };

  return (
    <div className="space-y-4">
      {/* SCREEN VIEW */}
      <div className="rounded-md border overflow-x-auto print-hidden">
        <Table>
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
              <TableHead className="text-right">Tutar</TableHead>
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
                <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                  <TableCell className="text-center font-medium text-sm">{index + 1}</TableCell>
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

      {/* PRINT VIEW - Simple pagination with 9 rows per page */}
      <div className="hidden print:block print-view">
        {transactions.length === 0 ? (
          <div className="text-center py-8">Henüz işlem kaydı bulunmamaktadır</div>
        ) : (
          <>
            {Array.from({ length: Math.ceil(transactions.length / 9) }).map((_, pageIndex) => {
              const pageStart = pageIndex * 9;
              const pageEnd = Math.min(pageStart + 9, transactions.length);
              const pageTransactions = transactions.slice(pageStart, pageEnd);
              const cumulativeTotal = getCumulativeTotal(pageStart);
              const pageTotals = getRangeTotals(pageStart, pageEnd);
              const pageTotal = pageTotals.income - pageTotals.expense;
              
              return (
                <div key={`page-${pageIndex}`} className="print-page-container">
                  {pageIndex > 0 && <div className="print-page-break"></div>}
                  
                  <table className="print-table">
                    <thead className="print-table-head">
                      <tr>
                        <th className="print-th">Sıra No</th>
                        <th className="print-th">Tarih</th>
                        <th className="print-th">Proje</th>
                        <th className="print-th">Tür</th>
                        <th className="print-th">İş Grubu</th>
                        <th className="print-th">Rayiç Grubu</th>
                        <th className="print-th">Açıklama</th>
                        <th className="print-th">Hakedişe Dahil</th>
                        <th className="print-th">Tutar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Carryover row for page 2+ */}
                      {pageIndex > 0 && (
                        <tr className="print-carryover-row">
                          <td className="print-td"></td>
                          <td colSpan={7} className="print-td text-right font-bold">
                            Bir Önceki Sayfadan Nakledilen Tutar:
                          </td>
                          <td className="print-td text-right font-bold">{formatCurrency(cumulativeTotal)}</td>
                        </tr>
                      )}
                      
                      {/* Transaction rows */}
                      {pageTransactions.map((transaction, transIndex) => (
                        <tr key={transaction.id} className="print-table-row">
                          <td className="print-td text-center">{pageStart + transIndex + 1}</td>
                          <td className="print-td">{formatDate(transaction.date)}</td>
                          <td className="print-td">{transaction.projectName}</td>
                          <td className="print-td">{transaction.type}</td>
                          <td className="print-td">{transaction.isGrubu}</td>
                          <td className="print-td">{transaction.rayicGrubu}</td>
                          <td className="print-td">{transaction.description || '-'}</td>
                          <td className="print-td text-center">{transaction.progressPaymentId ? '✓' : ''}</td>
                          <td className="print-td text-right">{formatCurrency(transaction.amount)}</td>
                        </tr>
                      ))}
                      
                      {/* Page total row */}
                      <tr className="print-page-summary">
                        <td className="print-td"></td>
                        <td colSpan={7} className="print-td text-right font-bold">
                          Sayfa Toplamı:
                        </td>
                        <td className="print-td text-right font-bold">{formatCurrency(pageTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Summary cards */}
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
