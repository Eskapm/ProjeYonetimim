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
import { Edit, Trash2 } from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  projectName: string;
  type: "Gelir" | "Gider";
  amount: number;
  isGrubu: string;
  rayicGrubu: string;
  description?: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TransactionTable({ transactions, onEdit, onDelete }: TransactionTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const totalIncome = transactions
    .filter(t => t.type === "Gelir")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === "Gider")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Proje</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>İş Grubu</TableHead>
              <TableHead>Rayiç Grubu</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead className="text-right">Tutar</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Henüz işlem kaydı bulunmamaktadır
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                  <TableCell className="font-medium">{transaction.date}</TableCell>
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
                    {transaction.description}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(transaction.id)}
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
