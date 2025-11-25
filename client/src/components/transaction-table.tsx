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

  const ROWS_PER_PAGE = 17;

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

  // Calculate page breaks and carryover totals
  const pagesData = useMemo(() => {
    const pages = [];
    for (let i = 0; i < transactions.length; i += ROWS_PER_PAGE) {
      const pageTransactions = transactions.slice(i, i + ROWS_PER_PAGE);
      const pageIndex = Math.floor(i / ROWS_PER_PAGE);
      
      // Calculate cumulative total before this page
      let carryoverTotal = 0;
      for (let j = 0; j < pageIndex; j++) {
        const prevPageTransactions = transactions.slice(j * ROWS_PER_PAGE, (j + 1) * ROWS_PER_PAGE);
        prevPageTransactions.forEach(t => {
          const amount = parseFloat(t.amount);
          carryoverTotal += t.type === "Gelir" ? amount : -amount;
        });
      }
      
      pages.push({
        index: pageIndex,
        transactions: pageTransactions,
        carryoverTotal,
        startIndex: i,
        endIndex: Math.min(i + ROWS_PER_PAGE, transactions.length)
      });
    }
    return pages;
  }, [transactions]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto print:border-0 print:overflow-visible">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Henüz işlem kaydı bulunmamaktadır
                </TableCell>
              </TableRow>
            ) : (
              <>
                {pagesData.map((page) => (
                  <tbody key={`page-${page.index}`} className="print:page-section">
                    {/* Carryover row - Bir Önceki Sayfadan Nakledilen Tutar */}
                    {page.index > 0 && (
                      <tr className="print:table-row print-carryover-row print:bg-gray-50 print:border-b print:border-black">
                        <td colSpan={7} className="print:text-right print:pr-2 print:py-2 print:text-xs print:font-bold print:border-b print:border-black">
                          Bir Önceki Sayfadan Nakledilen Tutar:
                        </td>
                        <td className="print:text-right print:py-2 print:text-xs print:font-bold print:border-b print:border-black print:font-mono">
                          {formatCurrency(page.carryoverTotal)}
                        </td>
                        <td className="print:border-b print:border-black"></td>
                      </tr>
                    )}

                    {/* Transaction rows */}
                    {page.transactions.map((transaction) => (
                      <tr key={transaction.id} className="print:table-row print:border-b print:border-gray-300" data-testid={`row-transaction-${transaction.id}`}>
                        <td className="print:text-xs print:py-1 print:px-1 print:font-medium print:whitespace-nowrap">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="print:text-xs print:py-1 print:px-1">
                          {transaction.projectName}
                        </td>
                        <td className="print:text-xs print:py-1 print:px-1">
                          {transaction.type === "Gelir" ? "Gelir" : "Gider"}
                        </td>
                        <td className="print:text-xs print:py-1 print:px-1">
                          {transaction.isGrubu}
                        </td>
                        <td className="print:text-xs print:py-1 print:px-1">
                          {transaction.rayicGrubu}
                        </td>
                        <td className="print:text-xs print:py-1 print:px-1 print:max-w-[150px] print:truncate">
                          {transaction.description || '-'}
                        </td>
                        <td className="print:text-center print:text-xs print:py-1 print:px-1">
                          {transaction.progressPaymentId ? "✓" : ""}
                        </td>
                        <td className="print:text-right print:text-xs print:py-1 print:px-1 print:font-mono print:font-semibold">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td></td>
                      </tr>
                    ))}

                    {/* Page summary row */}
                    <tr className="print:table-row print-page-summary print:bg-gray-100 print:border-t-2 print:border-black print:border-b print:border-black">
                      <td colSpan={7} className="print:text-right print:pr-2 print:py-2 print:text-xs print:font-bold">
                        Sayfa Toplamı:
                      </td>
                      <td className="print:text-right print:text-xs print:py-2 print:px-1 print:font-bold print:font-mono">
                        {formatCurrency(
                          page.transactions
                            .filter(t => t.type === "Gelir")
                            .reduce((sum, t) => sum + parseFloat(t.amount), 0) -
                          page.transactions
                            .filter(t => t.type === "Gider")
                            .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                        )}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary section - screen only */}
      {transactions.length > 0 && (
        <div className="flex justify-end gap-8 p-4 bg-muted/50 rounded-md print:hidden">
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
