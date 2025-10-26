import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type Task, type InsertTask, type Project } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  MoreVertical,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const taskFormSchema = insertTaskSchema.extend({
  checklist: z.array(z.object({
    id: z.string(),
    text: z.string().min(1, "Görev metni gerekli"),
    completed: z.boolean(),
  })).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const statusColors = {
  "Beklemede": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  "Devam Ediyor": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "Tamamlandı": "bg-green-500/10 text-green-700 dark:text-green-400",
  "İptal": "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

const priorityColors = {
  "Düşük": "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  "Orta": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "Yüksek": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  "Acil": "bg-red-500/10 text-red-700 dark:text-red-400",
};

const statusIcons = {
  "Beklemede": Clock,
  "Devam Ediyor": AlertCircle,
  "Tamamlandı": CheckCircle2,
  "İptal": XCircle,
};

export default function WorkSchedule() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDate");

  const { data: tasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: "",
      status: "Beklemede",
      priority: "Orta",
      progress: 0,
      startDate: "",
      dueDate: "",
      assignedTo: "",
      checklist: [],
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      return await apiRequest("/api/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Başarılı",
        description: "Görev oluşturuldu",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Görev oluşturulamadı",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTask> }) => {
      return await apiRequest(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Başarılı",
        description: "Görev güncellendi",
      });
      setIsDialogOpen(false);
      setEditingTask(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Görev güncellenemedi",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/tasks/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Başarılı",
        description: "Görev silindi",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Görev silinemedi",
      });
    },
  });

  const onSubmit = (data: TaskFormValues) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data });
    } else {
      createTaskMutation.mutate(data as InsertTask);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    form.reset({
      title: task.title,
      description: task.description || "",
      projectId: task.projectId || "",
      status: task.status,
      priority: task.priority || "Orta",
      progress: task.progress || 0,
      startDate: task.startDate || "",
      dueDate: task.dueDate || "",
      assignedTo: task.assignedTo || "",
      checklist: task.checklist || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bu görevi silmek istediğinizden emin misiniz?")) {
      deleteTaskMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTask(null);
    form.reset();
  };

  const addChecklistItem = () => {
    const currentChecklist = form.getValues("checklist") || [];
    form.setValue("checklist", [
      ...currentChecklist,
      { id: Math.random().toString(36).substr(2, 9), text: "", completed: false },
    ]);
  };

  const removeChecklistItem = (index: number) => {
    const currentChecklist = form.getValues("checklist") || [];
    form.setValue("checklist", currentChecklist.filter((_, i) => i !== index));
  };

  const updateChecklistItem = (index: number, field: "text" | "completed", value: string | boolean) => {
    const currentChecklist = form.getValues("checklist") || [];
    const updated = [...currentChecklist];
    updated[index] = { ...updated[index], [field]: value };
    form.setValue("checklist", updated);
  };

  const filteredAndSortedTasks = useMemo(() => {
    if (!tasks) return [];

    let filtered = tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesProject = projectFilter === "all" || task.projectId === projectFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesProject;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          return new Date(a.dueDate || "").getTime() - new Date(b.dueDate || "").getTime();
        case "priority": {
          const priorityOrder = { "Acil": 0, "Yüksek": 1, "Orta": 2, "Düşük": 3 };
          return priorityOrder[a.priority || "Orta"] - priorityOrder[b.priority || "Orta"];
        }
        case "progress":
          return (b.progress || 0) - (a.progress || 0);
        case "title":
          return a.title.localeCompare(b.title, "tr");
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, searchQuery, statusFilter, priorityFilter, projectFilter, sortBy]);

  const getProjectName = (projectId: string | null) => {
    if (!projectId || !projects) return "-";
    const project = projects.find((p) => p.id === projectId);
    return project?.name || "-";
  };

  const getChecklistSummary = (checklist: any[]) => {
    if (!checklist || checklist.length === 0) return null;
    const completed = checklist.filter((item) => item.completed).length;
    return { completed, total: checklist.length };
  };

  const summary = useMemo(() => {
    if (!tasks) return { total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 };
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "Beklemede").length,
      inProgress: tasks.filter((t) => t.status === "Devam Ediyor").length,
      completed: tasks.filter((t) => t.status === "Tamamlandı").length,
      cancelled: tasks.filter((t) => t.status === "İptal").length,
    };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">İş Programı</h1>
              <p className="text-sm text-muted-foreground mt-2">Görev yönetimi ve takip sistemi</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button
                  size="default"
                  onClick={() => {
                    setEditingTask(null);
                    form.reset();
                    setIsDialogOpen(true);
                  }}
                  data-testid="button-new-task"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Görev
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingTask ? "Görevi Düzenle" : "Yeni Görev Oluştur"}</DialogTitle>
                  <DialogDescription>
                    Görev detaylarını girin ve ilerlemeyi takip edin
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Görev Başlığı *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Örn: Temel kazı işleri"
                                {...field}
                                data-testid="input-task-title"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Açıklama</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Görev detayları..."
                                rows={3}
                                {...field}
                                data-testid="input-task-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Proje</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-task-project">
                                  <SelectValue placeholder="Proje seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Seçim yapılmadı</SelectItem>
                                {projects?.map((project) => (
                                  <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="assignedTo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sorumlu Kişi</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ad Soyad"
                                {...field}
                                data-testid="input-task-assigned"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Başlangıç Tarihi</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                data-testid="input-task-start-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bitiş Tarihi</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                data-testid="input-task-due-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Durum *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-task-status">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Beklemede">Beklemede</SelectItem>
                                <SelectItem value="Devam Ediyor">Devam Ediyor</SelectItem>
                                <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                                <SelectItem value="İptal">İptal</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Öncelik</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "Orta"}>
                              <FormControl>
                                <SelectTrigger data-testid="select-task-priority">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Düşük">Düşük</SelectItem>
                                <SelectItem value="Orta">Orta</SelectItem>
                                <SelectItem value="Yüksek">Yüksek</SelectItem>
                                <SelectItem value="Acil">Acil</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="progress"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>İlerleme: {field.value}%</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-4">
                                <Slider
                                  value={[field.value || 0]}
                                  onValueChange={(value) => field.onChange(value[0])}
                                  max={100}
                                  step={5}
                                  className="flex-1"
                                  data-testid="slider-task-progress"
                                />
                                <span className="text-sm font-medium w-12 text-right">
                                  {field.value}%
                                </span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel>Alt Görevler (Checklist)</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addChecklistItem}
                          data-testid="button-add-checklist-item"
                        >
                          <Plus className="mr-2 h-3 w-3" />
                          Ekle
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {form.watch("checklist")?.map((item, index) => (
                          <div key={item.id} className="flex items-start gap-2">
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={(checked) =>
                                updateChecklistItem(index, "completed", checked as boolean)
                              }
                              className="mt-2"
                              data-testid={`checkbox-checklist-item-${index}`}
                            />
                            <Input
                              value={item.text}
                              onChange={(e) => updateChecklistItem(index, "text", e.target.value)}
                              placeholder="Alt görev açıklaması"
                              className="flex-1"
                              data-testid={`input-checklist-item-${index}`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeChecklistItem(index)}
                              data-testid={`button-remove-checklist-item-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDialogClose}
                        data-testid="button-cancel-task"
                      >
                        İptal
                      </Button>
                      <Button
                        type="submit"
                        disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                        data-testid="button-save-task"
                      >
                        {editingTask ? "Güncelle" : "Oluştur"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="hover-elevate">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Toplam Görev
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-total-tasks">
                  {summary.total}
                </div>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Beklemede
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600" data-testid="text-pending-tasks">
                  {summary.pending}
                </div>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Devam Ediyor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600" data-testid="text-inprogress-tasks">
                  {summary.inProgress}
                </div>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tamamlandı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600" data-testid="text-completed-tasks">
                  {summary.completed}
                </div>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  İptal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-600" data-testid="text-cancelled-tasks">
                  {summary.cancelled}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtrele ve Ara
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Görev ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-tasks"
                  />
                </div>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger data-testid="select-filter-project">
                    <SelectValue placeholder="Tüm Projeler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Projeler</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-filter-status">
                    <SelectValue placeholder="Tüm Durumlar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="Beklemede">Beklemede</SelectItem>
                    <SelectItem value="Devam Ediyor">Devam Ediyor</SelectItem>
                    <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                    <SelectItem value="İptal">İptal</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger data-testid="select-filter-priority">
                    <SelectValue placeholder="Tüm Öncelikler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Öncelikler</SelectItem>
                    <SelectItem value="Düşük">Düşük</SelectItem>
                    <SelectItem value="Orta">Orta</SelectItem>
                    <SelectItem value="Yüksek">Yüksek</SelectItem>
                    <SelectItem value="Acil">Acil</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger data-testid="select-sort-by">
                    <SelectValue placeholder="Sırala" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dueDate">Bitiş Tarihi</SelectItem>
                    <SelectItem value="priority">Öncelik</SelectItem>
                    <SelectItem value="progress">İlerleme</SelectItem>
                    <SelectItem value="title">Başlık</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {isLoadingTasks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || projectFilter !== "all"
                    ? "Filtrelere uygun görev bulunamadı"
                    : "Henüz görev eklenmemiş"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Yeni görev eklemek için "Yeni Görev" butonuna tıklayın
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedTasks.map((task) => {
                const StatusIcon = statusIcons[task.status];
                const checklistSummary = getChecklistSummary(task.checklist || []);
                return (
                  <Card key={task.id} className="hover-elevate" data-testid={`card-task-${task.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg leading-tight truncate" data-testid={`text-task-title-${task.id}`}>
                            {task.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {getProjectName(task.projectId)}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              data-testid={`button-task-menu-${task.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(task)} data-testid={`button-edit-task-${task.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(task.id)}
                              className="text-destructive"
                              data-testid={`button-delete-task-${task.id}`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Badge className={statusColors[task.status]} data-testid={`badge-status-${task.id}`}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {task.status}
                        </Badge>
                        <Badge className={priorityColors[task.priority || "Orta"]} data-testid={`badge-priority-${task.id}`}>
                          {task.priority || "Orta"}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">İlerleme</span>
                          <span className="font-medium" data-testid={`text-progress-${task.id}`}>
                            {task.progress || 0}%
                          </span>
                        </div>
                        <Progress value={task.progress || 0} className="h-2" />
                      </div>

                      {checklistSummary && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground" data-testid={`text-checklist-${task.id}`}>
                            {checklistSummary.completed}/{checklistSummary.total} alt görev
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                        {task.startDate && (
                          <div>
                            <span className="text-muted-foreground">Başlangıç:</span>
                            <div className="font-medium">
                              {format(new Date(task.startDate), "dd MMM yyyy", { locale: tr })}
                            </div>
                          </div>
                        )}
                        {task.dueDate && (
                          <div>
                            <span className="text-muted-foreground">Bitiş:</span>
                            <div className="font-medium">
                              {format(new Date(task.dueDate), "dd MMM yyyy", { locale: tr })}
                            </div>
                          </div>
                        )}
                      </div>

                      {task.assignedTo && (
                        <div className="text-sm text-muted-foreground pt-2 border-t">
                          <span className="font-medium">Sorumlu:</span> {task.assignedTo}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
