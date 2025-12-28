import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SiteDiaryCard } from "@/components/site-diary-card";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";
import { useProjectContext } from "@/hooks/use-project-context";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSiteDiarySchema, type InsertSiteDiary, type SiteDiary, type Project } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const weatherOptions = ["Güneşli", "Bulutlu", "Yağmurlu", "Karlı"] as const;

export default function SiteDiary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SiteDiary | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const { toast } = useToast();
  const { activeProjectId, activeProject } = useProjectContext();

  // Fetch site diary entries
  const { data: diaryEntries = [], isLoading: isLoadingDiary, error: diaryError } = useQuery<SiteDiary[]>({
    queryKey: ["/api/site-diary"],
  });

  // Fetch projects for the dropdown
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Create site diary entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (data: InsertSiteDiary) => {
      const response = await apiRequest("POST", "/api/site-diary", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-diary"] });
      toast({
        title: "Başarılı",
        description: "Şantiye defteri kaydı başarıyla oluşturuldu",
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

  // Update site diary entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSiteDiary> }) => {
      const response = await apiRequest("PATCH", `/api/site-diary/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-diary"] });
      toast({
        title: "Başarılı",
        description: "Şantiye defteri kaydı başarıyla güncellendi",
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

  // Delete site diary entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/site-diary/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-diary"] });
      toast({
        title: "Başarılı",
        description: "Şantiye defteri kaydı başarıyla silindi",
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
  const form = useForm<InsertSiteDiary>({
    resolver: zodResolver(insertSiteDiarySchema),
    defaultValues: {
      projectId: "",
      date: "",
      weather: "",
      workDone: "",
      materialsUsed: "",
      totalWorkers: undefined,
      issues: "",
      notes: "",
    },
  });

  const onSubmit = (data: InsertSiteDiary) => {
    // Convert empty strings to null for optional fields
    const cleanedData = {
      ...data,
      weather: data.weather || null,
      materialsUsed: data.materialsUsed || null,
      totalWorkers: data.totalWorkers || null,
      issues: data.issues || null,
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
      projectId: activeProjectId || "",
      date: "",
      weather: "",
      workDone: "",
      materialsUsed: "",
      totalWorkers: undefined,
      issues: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditEntry = (entry: SiteDiary) => {
    setEditingEntry(entry);
    form.reset({
      projectId: entry.projectId,
      date: entry.date,
      weather: entry.weather || "",
      workDone: entry.workDone,
      materialsUsed: entry.materialsUsed || "",
      totalWorkers: entry.totalWorkers || undefined,
      issues: entry.issues || "",
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

  // Enrich diary entries with project names
  const enrichedEntries = diaryEntries.map(entry => ({
    ...entry,
    projectName: projectMap.get(entry.projectId)?.name || "Bilinmeyen Proje",
  }));

  // Filter diary entries
  const filteredDiaryEntries = enrichedEntries.filter((entry) => {
    const matchesSearch =
      entry.workDone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === "all" || entry.projectId === selectedProject;
    return matchesSearch && matchesProject;
  });

  const isPending = createEntryMutation.isPending || updateEntryMutation.isPending;

  return (
    <div className="space-y-6">
      <PrintHeader documentTitle="ŞANTİYE DEFTERİ" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Şantiye Defteri</h1>
          <p className="text-muted-foreground mt-1">Günlük şantiye raporları ve çalışma kayıtları</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button onClick={handleAddEntry} data-testid="button-add-diary-entry">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Kayıt Ekle
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 no-print">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Yapılan işlerde ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-diary"
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

      {isLoadingDiary ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : diaryError ? (
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            Veriler yüklenirken bir hata oluştu
          </CardContent>
        </Card>
      ) : filteredDiaryEntries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {diaryEntries.length === 0 ? "Henüz kayıt eklenmemiş" : "Kayıt bulunamadı"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDiaryEntries.map((entry) => (
            <SiteDiaryCard
              key={entry.id}
              entry={{
                id: entry.id,
                date: entry.date,
                projectName: entry.projectName,
                weather: entry.weather ?? undefined,
                workDone: entry.workDone,
                materialsUsed: entry.materialsUsed ?? undefined,
                totalWorkers: entry.totalWorkers ?? undefined,
                issues: entry.issues ?? undefined,
                notes: entry.notes ?? undefined,
              }}
              onEdit={() => handleEditEntry(entry)}
              onDelete={() => handleDeleteEntry(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Şantiye Defteri Kaydını Düzenle" : "Yeni Şantiye Defteri Kaydı"}
            </DialogTitle>
            <DialogDescription>
              Şantiye defteri bilgilerini girin. * işaretli alanlar zorunludur.
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

                {/* Weather Select */}
                <FormField
                  control={form.control}
                  name="weather"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hava Durumu</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-weather">
                            <SelectValue placeholder="Hava durumu seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {weatherOptions.map((weather) => (
                            <SelectItem key={weather} value={weather}>
                              {weather}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Total Workers */}
                <FormField
                  control={form.control}
                  name="totalWorkers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Toplam İşçi Sayısı</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? undefined : parseInt(value));
                          }}
                          data-testid="input-total-workers"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Work Done */}
              <FormField
                control={form.control}
                name="workDone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yapılan İşler *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Bugün yapılan işleri detaylı olarak yazın..."
                        className="min-h-24"
                        {...field}
                        data-testid="textarea-work-done"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Materials Used */}
              <FormField
                control={form.control}
                name="materialsUsed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kullanılan Malzemeler</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Kullanılan malzemeleri listeleyin..."
                        className="min-h-20"
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-materials"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Issues */}
              <FormField
                control={form.control}
                name="issues"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sorunlar</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Karşılaşılan sorunları yazın..."
                        className="min-h-20"
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-issues"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
              Bu şantiye defteri kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
