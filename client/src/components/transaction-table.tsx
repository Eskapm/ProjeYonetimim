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

  // Dinamik sayfa break sistemi: A4 portrait (210×297mm)
  // Margin: 15mm top/bottom, 10mm left/right
  // Header height: ~20mm, Footer height: ~10mm
  // Kalan: 297 - 15 - 15 - 20 - 10 = 237mm
  // Satır yüksekliği: ~4.5mm (8px font + padding)
  // Satır sayısı: 237 / 4.5 ≈ 52-53 satır/sayfa
  const ROWS_PER_PAGE = 52;

  // Sayfaları böl
  const pages = Math.ceil(transactions.length / ROWS_PER_PAGE);
  const paginatedTransactions = Array.from({ length: pages }, (_, pageIndex) => {
    const start = pageIndex * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    return {
      pageIndex,
      rows: transactions.slice(start, end),
      startIndex: start,
      endIndex: Math.min(end, transactions.length),
    };
  });

  // Sayfa toplamları
  const pageSubtotals = paginatedTransactions.map((page) => {
    const pageIncome = page.rows
      .filter(t => t.type === "Gelir")
      .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);
    const pageExpense = page.rows
      .filter(t => t.type === "Gider")
      .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);
    return pageIncome - pageExpense;
  });

  return (
    <div className="space-y-4">
      {/* SCREEN VIEW ONLY */}
      <div className="screen-only rounded-md border overflow-x-auto">
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

      {/* PRINT VIEW ONLY - Dinamik Sayfa Break Sistemi */}
      <div className="print-only-wrapper">
        {transactions.length === 0 ? (
          <div className="print-page">Henüz işlem kaydı bulunmamaktadır</div>
        ) : (
          paginatedTransactions.map((page) => (
            <div key={page.pageIndex} className="print-page">
              {/* Sayfa başlığı */}
              <div className="print-page-header">
                <h3 className="print-page-title">İşlem Listesi - Sayfa {page.pageIndex + 1} / {pages}</h3>
              </div>

              {/* Sayfa tablosu */}
              <table className="print-transactions-table">
                <thead>
                  <tr>
                    <th>Sıra No</th>
                    <th>Tarih</th>
                    <th>Proje</th>
                    <th>Tür</th>
                    <th>İş Grubu</th>
                    <th>Rayiç Grubu</th>
                    <th>Açıklama</th>
                    <th>Hakedişe Dahil</th>
                    <th>Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {page.rows.map((transaction, rowIndex) => (
                    <tr key={transaction.id}>
                      <td className="text-center">{rowIndex + 1}</td>
                      <td>{formatDate(transaction.date)}</td>
                      <td>{transaction.projectName}</td>
                      <td>{transaction.type}</td>
                      <td>{transaction.isGrubu}</td>
                      <td>{transaction.rayicGrubu}</td>
                      <td>{transaction.description || '-'}</td>
                      <td className="text-center">{transaction.progressPaymentId ? '✓' : ''}</td>
                      <td className="text-right">{formatCurrency(transaction.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Sayfa altı - Sayfa toplamı */}
              <div className="print-page-footer">
                <div className="print-page-total">
                  <strong>Sayfa Toplamı:</strong> {formatCurrency(pageSubtotals[page.pageIndex])}
                </div>
                {page.pageIndex === pages - 1 && (
                  <div className="print-grand-total">
                    <strong>GENEL TOPLAM:</strong> {formatCurrency(totalIncome - totalExpense)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary cards - SCREEN ONLY */}
      {transactions.length > 0 && (
        <div className="screen-only flex justify-end gap-8 p-4 bg-muted/50 rounded-md">
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
