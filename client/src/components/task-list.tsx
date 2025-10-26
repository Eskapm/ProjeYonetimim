import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Edit, Trash2 } from "lucide-react";

interface Task {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  responsible?: string;
  notes?: string;
}

interface TaskListProps {
  tasks: Task[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  "Bekliyor": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  "Devam Ediyor": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Tamamlandı": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "İptal": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function TaskList({ tasks, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Henüz görev eklenmemiştir
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className="hover-elevate" data-testid={`card-task-${task.id}`}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-base">{task.name}</CardTitle>
              <Badge className={statusColors[task.status] || ""}>{task.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{task.startDate} - {task.endDate}</span>
              </div>
              {task.responsible && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{task.responsible}</span>
                </div>
              )}
              {task.notes && (
                <p className="text-sm text-muted-foreground border-l-2 border-muted pl-3">
                  {task.notes}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.(task.id)}
                  data-testid={`button-edit-task-${task.id}`}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete?.(task.id)}
                  data-testid={`button-delete-task-${task.id}`}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
