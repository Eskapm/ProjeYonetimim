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

interface TimesheetEntry {
  id: string;
  date: string;
  isGrubu: string;
  workerCount: number;
  hours: number;
  notes?: string;
}

interface TimesheetTableProps {
  entries: TimesheetEntry[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TimesheetTable({ entries, onEdit, onDelete }: TimesheetTableProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const totalWorkerHours = entries.reduce(
    (sum, entry) => sum + (entry.workerCount * entry.hours),
    0
  );

  const totalWorkers = entries.reduce((sum, entry) => sum + entry.workerCount, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>İş Grubu</TableHead>
              <TableHead className="text-right">İşçi Sayısı</TableHead>
              <TableHead className="text-right">Çalışma Saati</TableHead>
              <TableHead className="text-right">Toplam Saat</TableHead>
              <TableHead>Notlar</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Henüz puantaj kaydı bulunmamaktadır
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id} data-testid={`row-timesheet-${entry.id}`}>
                  <TableCell className="font-medium">{entry.date}</TableCell>
                  <TableCell>{entry.isGrubu}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(entry.workerCount)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(entry.hours)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatNumber(entry.workerCount * entry.hours)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {entry.notes || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(entry.id)}
                        data-testid={`button-edit-timesheet-${entry.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete?.(entry.id)}
                        data-testid={`button-delete-timesheet-${entry.id}`}
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

      {entries.length > 0 && (
        <div className="flex justify-end gap-8 p-4 bg-muted/50 rounded-md">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Toplam İşçi</div>
            <div className="text-lg font-bold font-mono text-primary">
              {formatNumber(totalWorkers)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Toplam Adam×Saat</div>
            <div className="text-lg font-bold font-mono text-primary">
              {formatNumber(totalWorkerHours)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
