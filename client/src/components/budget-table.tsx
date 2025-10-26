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

  const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

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
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead>İş Grubu</TableHead>
              <TableHead>Rayiç Grubu</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Henüz bütçe kalemi eklenmemiştir
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} data-testid={`row-budget-${item.id}`}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(item.quantity)}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatCurrency(item.quantity * item.unitPrice)}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {items.length > 0 && (
        <div className="flex justify-end p-4 bg-muted/50 rounded-md">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Toplam Bütçe</div>
            <div className="text-2xl font-bold font-mono text-primary">
              {formatCurrency(total)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
