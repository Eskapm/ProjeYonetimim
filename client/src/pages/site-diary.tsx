import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
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
import { Plus, Search, Calendar as CalendarIcon, Loader2, Image, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSiteDiarySchema, type InsertSiteDiary, type SiteDiary, type Project } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format, startOfDay, endOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const weatherOptions = ["Güneşli", "Bulutlu", "Yağmurlu", "Karlı"] as const;

export default function SiteDiary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SiteDiary | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const { toast } = useToast();
  const { activeProjectId, activeProject } = useProjectContext();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  // State for puantaj worker count
  const [puantajWorkerCount, setPuantajWorkerCount] = useState<number | null>(null);
  const [isLoadingWorkerCount, setIsLoadingWorkerCount] = useState(false);
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);
  
  // Date range filter states
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Photo upload states
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Form setup - must be before useEffects that use it
  const form = useForm<InsertSiteDiary>({
    resolver: zodResolver(insertSiteDiarySchema),
    defaultValues: {
      projectId: "",
      date: new Date().toISOString().split("T")[0],
      weather: "",
      workDone: "",
      materialsUsed: "",
      totalWorkers: undefined,
      issues: "",
      notes: "",
      photos: [],
    },
  });

  // Sync filter with active project
  useEffect(() => {
    setSelectedProject(activeProjectId || "all");
  }, [activeProjectId]);
  
  // Parse URL parameters and handle redirect from puantaj
  useEffect(() => {
    if (urlParamsProcessed) return;
    
    const params = new URLSearchParams(searchString);
    const dateParam = params.get("date");
    const fromPuantaj = params.get("fromPuantaj");
    
    if (dateParam && fromPuantaj === "true" && activeProjectId) {
      setUrlParamsProcessed(true);
      // Clear URL params
      setLocation("/site-diary", { replace: true });
      
      // Reset photos
      setPhotos([]);
      
      // Open dialog with date pre-filled
      form.reset({
        projectId: activeProjectId,
        date: dateParam,
        weather: "",
        workDone: "",
        materialsUsed: "",
        totalWorkers: undefined,
        issues: "",
        notes: "",
        photos: [],
      });
      setIsDialogOpen(true);
      
      // Fetch worker count from puantaj
      fetchWorkerCount(activeProjectId, dateParam);
      
      toast({
        title: "Puantaj Kaydedildi",
        description: "Şimdi şantiye defteri kaydını tamamlayabilirsiniz. İşçi sayısı puantajdan otomatik alınacak.",
      });
    }
  }, [searchString, activeProjectId, urlParamsProcessed]);

  // Function to fetch worker count from puantaj
  const fetchWorkerCount = useCallback(async (projectId: string, date: string) => {
    setIsLoadingWorkerCount(true);
    try {
      const response = await fetch(`/api/timesheets/worker-count?projectId=${projectId}&date=${date}`);
      if (response.ok) {
        const data = await response.json();
        if (data.workerCount > 0) {
          setPuantajWorkerCount(data.workerCount);
          form.setValue("totalWorkers", data.workerCount);
        } else {
          // No puantaj record - set to 0 and show warning
          setPuantajWorkerCount(0);
          form.setValue("totalWorkers", 0);
        }
      }
    } catch (error) {
      console.error("Error fetching worker count:", error);
      setPuantajWorkerCount(0);
      form.setValue("totalWorkers", 0);
    } finally {
      setIsLoadingWorkerCount(false);
    }
  }, []);

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

  const onSubmit = (data: InsertSiteDiary) => {
    // Convert empty strings to null for optional fields, keep photos as array
    const cleanedData = {
      ...data,
      weather: data.weather || null,
      materialsUsed: data.materialsUsed || null,
      totalWorkers: data.totalWorkers || null,
      issues: data.issues || null,
      notes: data.notes || null,
      photos: photos, // Always send as array (empty or with items)
    };

    if (editingEntry) {
      updateEntryMutation.mutate({ id: editingEntry.id, data: cleanedData });
    } else {
      createEntryMutation.mutate(cleanedData);
    }
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setPuantajWorkerCount(null);
    setPhotos([]);
    const today = new Date().toISOString().split("T")[0];
    form.reset({
      projectId: activeProjectId || "",
      date: today,
      weather: "",
      workDone: "",
      materialsUsed: "",
      totalWorkers: undefined,
      issues: "",
      notes: "",
      photos: [],
    });
    setIsDialogOpen(true);
    
    // Fetch worker count for today if project is selected
    if (activeProjectId) {
      fetchWorkerCount(activeProjectId, today);
    }
  };

  const handleEditEntry = (entry: SiteDiary) => {
    setEditingEntry(entry);
    setPuantajWorkerCount(null); // Don't show puantaj hint when editing
    setPhotos(entry.photos || []);
    form.reset({
      projectId: entry.projectId,
      date: entry.date,
      weather: entry.weather || "",
      workDone: entry.workDone,
      materialsUsed: entry.materialsUsed || "",
      totalWorkers: entry.totalWorkers || undefined,
      issues: entry.issues || "",
      notes: entry.notes || "",
      photos: entry.photos || [],
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
    
    // Date range filtering - use local date parsing to avoid timezone issues
    let matchesDateRange = true;
    if (startDate || endDate) {
      // Parse entry.date as local date to avoid UTC offset issues
      const entryDate = new Date(`${entry.date}T00:00:00`);
      if (startDate && endDate) {
        const normalizedStart = startOfDay(startDate);
        const normalizedEnd = endOfDay(endDate);
        matchesDateRange = entryDate >= normalizedStart && entryDate <= normalizedEnd;
      } else if (startDate) {
        const normalizedStart = startOfDay(startDate);
        matchesDateRange = entryDate >= normalizedStart;
      } else if (endDate) {
        const normalizedEnd = endOfDay(endDate);
        matchesDateRange = entryDate <= normalizedEnd;
      }
    }
    
    return matchesSearch && matchesProject && matchesDateRange;
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

      <div className="flex flex-col gap-4 no-print">
        <div className="flex flex-col sm:flex-row gap-4">
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

        <div className="flex flex-col sm:flex-row gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[250px] justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
                data-testid="button-start-date-filter"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP", { locale: tr }) : "Başlangıç tarihi"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                locale={tr}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[250px] justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
                data-testid="button-end-date-filter"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP", { locale: tr }) : "Bitiş tarihi"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                locale={tr}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {(startDate || endDate) && (
            <Button
              variant="ghost"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
              }}
              data-testid="button-clear-date-filters"
            >
              Tarihleri Temizle
            </Button>
          )}
        </div>
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
                                const dateStr = format(date, "yyyy-MM-dd");
                                field.onChange(dateStr);
                                // Fetch worker count for the new date
                                const projectId = form.getValues("projectId");
                                if (projectId && !editingEntry) {
                                  fetchWorkerCount(projectId, dateStr);
                                }
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
                      <FormLabel className="flex items-center gap-2">
                        Toplam İşçi Sayısı
                        {isLoadingWorkerCount && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? undefined : parseInt(value));
                            // Clear puantaj indicator if user manually changes
                            if (value !== String(puantajWorkerCount)) {
                              setPuantajWorkerCount(null);
                            }
                          }}
                          data-testid="input-total-workers"
                        />
                      </FormControl>
                      {puantajWorkerCount !== null && puantajWorkerCount > 0 && !editingEntry && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Puantajdan otomatik alındı ({puantajWorkerCount} işçi)
                        </p>
                      )}
                      {(puantajWorkerCount === null || puantajWorkerCount === 0) && !editingEntry && !isLoadingWorkerCount && (
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                          Bu tarihte puantaj kaydı oluşturulmamış!
                        </p>
                      )}
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

              {/* Photos Section */}
              <div className="space-y-2">
                <Label>Fotoğraflar</Label>
                <div className="flex flex-wrap gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Fotoğraf ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newPhotos = photos.filter((_, i) => i !== index);
                          setPhotos(newPhotos);
                        }}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-remove-photo-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label
                    className={cn(
                      "w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed rounded-md cursor-pointer",
                      "hover:border-primary hover:bg-muted/50 transition-colors",
                      isUploadingPhoto && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingPhoto}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        setIsUploadingPhoto(true);
                        try {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64 = reader.result as string;
                            setPhotos([...photos, base64]);
                            setIsUploadingPhoto(false);
                          };
                          reader.readAsDataURL(file);
                        } catch (error) {
                          toast({
                            title: "Hata",
                            description: "Fotoğraf yüklenirken bir hata oluştu",
                            variant: "destructive",
                          });
                          setIsUploadingPhoto(false);
                        }
                        e.target.value = "";
                      }}
                      data-testid="input-photo-upload"
                    />
                    {isUploadingPhoto ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Image className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">Ekle</span>
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Yapılan işlere ait fotoğrafları ekleyebilirsiniz
                </p>
              </div>

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
