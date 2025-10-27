import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface BudgetItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  isGrubu: string;
  rayicGrubu: string;
  actualQuantity?: number;
  actualUnitPrice?: number;
}

interface BudgetTableProps {
  items: BudgetItem[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function BudgetTable({ items, onEdit, onDelete }: BudgetTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const totalBudget = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalActual = items.reduce((sum, item) => {
    const actual = (item.actualQuantity || 0) * (item.actualUnitPrice || 0);
    return sum + actual;
  }, 0);
  const totalDifference = totalBudget - totalActual;

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kalem Adı</TableHead>
              <TableHead className="text-right">Miktar</TableHead>
              <TableHead>Birim</TableHead>
              <TableHead className="text-right">Birim Fiyat</TableHead>
              <TableHead className="text-right">Bütçe Tutarı</TableHead>
              <TableHead className="text-right">Gerçekleşen Tutar</TableHead>
              <TableHead className="text-right">Artı/Eksi</TableHead>
              <TableHead>İş Grubu</TableHead>
              <TableHead>Rayiç Grubu</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  Henüz bütçe kalemi eklenmemiştir
                </TableCell>
              </TableRow>
            ) : (
              <>
                {items.map((item) => {
                  const budgetAmount = item.quantity * item.unitPrice;
                  const actualAmount = (item.actualQuantity || 0) * (item.actualUnitPrice || 0);
                  const difference = budgetAmount - actualAmount;
                  
                  return (
                    <TableRow key={item.id} data-testid={`row-budget-${item.id}`}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(item.quantity)}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(budgetAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {actualAmount > 0 ? formatCurrency(actualAmount) : '-'}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-semibold ${
                        difference > 0 ? 'text-green-600 dark:text-green-400' : 
                        difference < 0 ? 'text-red-600 dark:text-red-400' : 
                        'text-muted-foreground'
                      }`}>
                        {actualAmount > 0 ? (
                          <>
                            {difference > 0 && '+'}{formatCurrency(difference)}
                          </>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm">{item.isGrubu}</TableCell>
                      <TableCell className="text-sm">{item.rayicGrubu}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit?.(item.id)}
                            data-testid={`button-edit-budget-${item.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete?.(item.id)}
                            data-testid={`button-delete-budget-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </>
            )}
          </TableBody>
        </Table>
      </div>
      
      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-md border border-border/50">
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Toplam Bütçe</div>
            <div className="text-lg font-semibold font-mono text-primary">
              {formatCurrency(totalBudget)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Toplam Gerçekleşen</div>
            <div className="text-lg font-semibold font-mono text-blue-600 dark:text-blue-400">
              {formatCurrency(totalActual)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Toplam Fark</div>
            <div className={`text-lg font-semibold font-mono ${
              totalDifference > 0 ? 'text-green-600 dark:text-green-400' : 
              totalDifference < 0 ? 'text-red-600 dark:text-red-400' : 
              'text-muted-foreground'
            }`}>
              {totalDifference > 0 && '+'}{formatCurrency(totalDifference)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
