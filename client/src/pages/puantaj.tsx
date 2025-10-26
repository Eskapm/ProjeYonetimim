import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PrintButton } from "@/components/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Search, Calendar as CalendarIcon, Loader2, Edit2, Trash2, Users, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTimesheetSchema, isGrubuEnum, type InsertTimesheet, type Timesheet, type Project } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Puantaj() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Timesheet | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch timesheet entries
  const { data: timesheets = [], isLoading: isLoadingTimesheets, error: timesheetsError } = useQuery<Timesheet[]>({
    queryKey: ["/api/timesheets"],
  });

  // Fetch projects for the dropdown
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Create timesheet entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (data: InsertTimesheet) => {
      const response = await apiRequest("POST", "/api/timesheets", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      toast({
        title: "Başarılı",
        description: "Puantaj kaydı başarıyla oluşturuldu",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Kayıt oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Update timesheet entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTimesheet> }) => {
      const response = await apiRequest("PATCH", `/api/timesheets/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      toast({
        title: "Başarılı",
        description: "Puantaj kaydı başarıyla güncellendi",
      });
      setIsDialogOpen(false);
      setEditingEntry(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Kayıt güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Delete timesheet entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/timesheets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      toast({
        title: "Başarılı",
        description: "Puantaj kaydı başarıyla silindi",
      });
      setDeleteEntryId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Kayıt silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<InsertTimesheet>({
    resolver: zodResolver(insertTimesheetSchema),
    defaultValues: {
      projectId: "",
      date: "",
      isGrubu: "",
      workerCount: 0,
      hours: "",
      notes: "",
    },
  });

  const onSubmit = (data: InsertTimesheet) => {
    // Convert empty strings to null for optional fields
    const cleanedData = {
      ...data,
      notes: data.notes || null,
    };

    if (editingEntry) {
      updateEntryMutation.mutate({ id: editingEntry.id, data: cleanedData });
    } else {
      createEntryMutation.mutate(cleanedData);
    }
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    form.reset({
      projectId: "",
      date: "",
      isGrubu: "",
      workerCount: 0,
      hours: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditEntry = (entry: Timesheet) => {
    setEditingEntry(entry);
    form.reset({
      projectId: entry.projectId,
      date: entry.date,
      isGrubu: entry.isGrubu,
      workerCount: entry.workerCount,
      hours: entry.hours,
      notes: entry.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteEntry = (id: string) => {
    setDeleteEntryId(id);
  };

  const confirmDelete = () => {
    if (deleteEntryId) {
      deleteEntryMutation.mutate(deleteEntryId);
    }
  };

  // Create a map of projects for easy lookup
  const projectMap = new Map(projects.map(p => [p.id, p]));

  // Enrich timesheet entries with project names
  const enrichedEntries = timesheets.map(entry => ({
    ...entry,
    projectName: projectMap.get(entry.projectId)?.name || "Bilinmeyen Proje",
  }));

  // Filter timesheet entries
  const filteredTimesheets = enrichedEntries.filter((entry) => {
    const matchesSearch =
      entry.isGrubu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === "all" || entry.projectId === selectedProject;
    return matchesSearch && matchesProject;
  });

  const isPending = createEntryMutation.isPending || updateEntryMutation.isPending;

  // Calculate summary statistics
  const totalWorkers = filteredTimesheets.reduce((sum, entry) => sum + entry.workerCount, 0);
  const totalHours = filteredTimesheets.reduce((sum, entry) => sum + parseFloat(entry.hours), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Puantaj</h1>
          <p className="text-muted-foreground mt-1">Günlük işçi çalışma saatleri takibi</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button onClick={handleAddEntry} data-testid="button-add-timesheet">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Kayıt Ekle
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="İş grubunda ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-timesheet"
          />
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full sm:w-[250px]" data-testid="select-project-filter">
            <SelectValue placeholder="Proje seç" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Projeler</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam İşçi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-workers">{totalWorkers}</div>
            <p className="text-xs text-muted-foreground">
              {filteredTimesheets.length} kayıt
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Saat</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-hours">{totalHours.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Çalışma saati
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timesheet Table */}
      <Card>
        <CardHeader>
          <CardTitle>Puantaj Kayıtları</CardTitle>
          <CardDescription>
            İş gruplarına göre günlük işçi çalışma saatleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTimesheets ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : timesheetsError ? (
            <div className="py-12 text-center text-destructive">
              Veriler yüklenirken bir hata oluştu
            </div>
          ) : filteredTimesheets.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {timesheets.length === 0 ? "Henüz kayıt eklenmemiş" : "Kayıt bulunamadı"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Proje</TableHead>
                    <TableHead>İş Grubu</TableHead>
                    <TableHead className="text-right">İşçi Sayısı</TableHead>
                    <TableHead className="text-right">Saat</TableHead>
                    <TableHead>Notlar</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTimesheets.map((entry) => (
                    <TableRow key={entry.id} data-testid={`row-timesheet-${entry.id}`}>
                      <TableCell>
                        {format(new Date(entry.date), "dd MMMM yyyy", { locale: tr })}
                      </TableCell>
                      <TableCell className="font-medium">{entry.projectName}</TableCell>
                      <TableCell>{entry.isGrubu}</TableCell>
                      <TableCell className="text-right font-mono">{entry.workerCount}</TableCell>
                      <TableCell className="text-right font-mono">{entry.hours}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {entry.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditEntry(entry)}
                            data-testid={`button-edit-${entry.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEntry(entry.id)}
                            data-testid={`button-delete-${entry.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Puantaj Kaydını Düzenle" : "Yeni Puantaj Kaydı"}
            </DialogTitle>
            <DialogDescription>
              Puantaj bilgilerini girin. * işaretli alanlar zorunludur.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Select */}
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proje *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingProjects}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-project">
                            <SelectValue placeholder="Proje seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
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

                {/* Date Picker */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tarih *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-date-picker"
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP", { locale: tr })
                              ) : (
                                <span>Tarih seçin</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(format(date, "yyyy-MM-dd"));
                              }
                            }}
                            locale={tr}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* İş Grubu Select */}
                <FormField
                  control={form.control}
                  name="isGrubu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İş Grubu *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-is-grubu">
                            <SelectValue placeholder="İş grubu seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isGrubuEnum.map((grup) => (
                            <SelectItem key={grup} value={grup}>
                              {grup}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Worker Count */}
                <FormField
                  control={form.control}
                  name="workerCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İşçi Sayısı *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? 0 : parseInt(value));
                          }}
                          data-testid="input-worker-count"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hours */}
                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Çalışma Saati *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="8.00"
                          {...field}
                          data-testid="input-hours"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ek notlar..."
                        className="min-h-20"
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isPending}
                  data-testid="button-cancel"
                >
                  İptal
                </Button>
                <Button type="submit" disabled={isPending} data-testid="button-submit">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingEntry ? "Güncelle" : "Kaydet"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteEntryId} onOpenChange={() => setDeleteEntryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu puantaj kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              data-testid="button-confirm-delete"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
