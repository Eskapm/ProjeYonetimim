import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Search, Calendar as CalendarIcon, Loader2, Edit2, Trash2, Users, Clock, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTimesheetSchema, isGrubuEnum, type InsertTimesheet, type Timesheet, type Project, type Subcontractor } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
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

interface PendingEntry {
  id: string;
  isGrubu: string;
  subcontractorId: string | null;
  subcontractorName: string;
  workerCount: number;
  hours: string;
  notes: string;
}

export default function Puantaj() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Timesheet | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const { toast } = useToast();
  const { activeProjectId } = useProjectContext();
  const [, setLocation] = useLocation();

  // Batch entry state
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([]);
  const [batchDate, setBatchDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [currentIsGrubu, setCurrentIsGrubu] = useState("");
  const [currentSubcontractorId, setCurrentSubcontractorId] = useState("");
  const [currentWorkerCount, setCurrentWorkerCount] = useState("");
  const [currentHours, setCurrentHours] = useState("");
  const [currentNotes, setCurrentNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync filter with active project
  useEffect(() => {
    setSelectedProject(activeProjectId || "all");
  }, [activeProjectId]);

  // Fetch timesheet entries
  const { data: timesheets = [], isLoading: isLoadingTimesheets, error: timesheetsError } = useQuery<Timesheet[]>({
    queryKey: ["/api/timesheets"],
  });

  // Fetch projects for the dropdown
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch subcontractors for the dropdown
  const { data: subcontractors = [] } = useQuery<Subcontractor[]>({
    queryKey: ["/api/subcontractors"],
  });

  // Create timesheet entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (data: InsertTimesheet) => {
      const response = await apiRequest("POST", "/api/timesheets", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
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

  // Form setup for edit dialog
  const form = useForm<InsertTimesheet>({
    resolver: zodResolver(insertTimesheetSchema),
    defaultValues: {
      projectId: "",
      subcontractorId: null,
      date: new Date().toISOString().split("T")[0],
      isGrubu: "",
      workerCount: 0,
      hours: "",
      notes: "",
    },
  });

  const onSubmit = (data: InsertTimesheet) => {
    const cleanedData = {
      ...data,
      notes: data.notes || null,
      subcontractorId: data.subcontractorId || null,
    };

    if (editingEntry) {
      updateEntryMutation.mutate({ id: editingEntry.id, data: cleanedData });
    }
  };

  // Add entry to pending list
  const handleAddToPending = () => {
    if (!currentIsGrubu || !currentWorkerCount || !currentHours) {
      toast({
        title: "Eksik Bilgi",
        description: "İş grubu, işçi sayısı ve çalışma saati zorunludur",
        variant: "destructive",
      });
      return;
    }

    const subcontractor = subcontractors.find(s => s.id === currentSubcontractorId);
    const actualSubcontractorId = currentSubcontractorId && currentSubcontractorId !== "none" ? currentSubcontractorId : null;
    
    const newEntry: PendingEntry = {
      id: `pending-${Date.now()}-${Math.random()}`,
      isGrubu: currentIsGrubu,
      subcontractorId: actualSubcontractorId,
      subcontractorName: subcontractor?.name || "Belirtilmedi",
      workerCount: parseInt(currentWorkerCount),
      hours: currentHours,
      notes: currentNotes,
    };

    setPendingEntries([...pendingEntries, newEntry]);
    
    // Reset form fields for next entry
    setCurrentIsGrubu("");
    setCurrentSubcontractorId("");
    setCurrentWorkerCount("");
    setCurrentHours("");
    setCurrentNotes("");

    toast({
      title: "Eklendi",
      description: "Kayıt listeye eklendi. Tüm kayıtları tamamlayınca 'Kaydet' butonuna basın.",
    });
  };

  // Remove entry from pending list
  const handleRemovePending = (id: string) => {
    setPendingEntries(pendingEntries.filter(e => e.id !== id));
  };

  // Save all pending entries using Promise.all for efficiency
  const handleSaveAll = async () => {
    if (!activeProjectId) {
      toast({
        title: "Proje Seçin",
        description: "Lütfen önce ana sayfadan aktif proje seçin",
        variant: "destructive",
      });
      return;
    }

    if (pendingEntries.length === 0) {
      toast({
        title: "Kayıt Yok",
        description: "Kaydedilecek puantaj girişi bulunamadı",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Create all entries in parallel using Promise.all
      const createPromises = pendingEntries.map(entry => 
        apiRequest("POST", "/api/timesheets", {
          projectId: activeProjectId,
          subcontractorId: entry.subcontractorId,
          date: batchDate,
          isGrubu: entry.isGrubu,
          workerCount: entry.workerCount,
          hours: entry.hours,
          notes: entry.notes || null,
        })
      );

      await Promise.all(createPromises);

      // Invalidate cache once after all entries are created
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });

      toast({
        title: "Başarılı",
        description: `${pendingEntries.length} puantaj kaydı başarıyla oluşturuldu`,
      });

      // Store the date for redirect
      const savedDate = batchDate;
      
      // Reset all
      setPendingEntries([]);
      setBatchDate(new Date().toISOString().split("T")[0]);
      setIsDialogOpen(false);
      
      // Redirect to site diary with date parameter
      setLocation(`/santiye-defteri?date=${savedDate}&fromPuantaj=true`);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kayıtlar oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setPendingEntries([]);
    setBatchDate(new Date().toISOString().split("T")[0]);
    setCurrentIsGrubu("");
    setCurrentSubcontractorId("");
    setCurrentWorkerCount("");
    setCurrentHours("");
    setCurrentNotes("");
    setIsDialogOpen(true);
  };

  const handleEditEntry = (entry: Timesheet) => {
    setEditingEntry(entry);
    form.reset({
      projectId: entry.projectId,
      subcontractorId: entry.subcontractorId || "",
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

  // Create maps for easy lookup
  const projectMap = new Map(projects.map(p => [p.id, p]));
  const subcontractorMap = new Map(subcontractors.map(s => [s.id, s]));

  // Enrich timesheet entries with project and subcontractor names
  const enrichedEntries = timesheets.map(entry => ({
    ...entry,
    projectName: projectMap.get(entry.projectId)?.name || "Bilinmeyen Proje",
    subcontractorName: entry.subcontractorId ? subcontractorMap.get(entry.subcontractorId)?.name || "Bilinmeyen" : "Belirtilmedi",
  }));

  // Filter timesheet entries
  const filteredTimesheets = enrichedEntries.filter((entry) => {
    const matchesSearch =
      entry.isGrubu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.subcontractorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === "all" || entry.projectId === selectedProject;
    
    let matchesDate = true;
    if (startDate || endDate) {
      const entryDate = parseISO(entry.date);
      if (startDate && endDate) {
        const normalizedStart = startOfDay(startDate);
        const normalizedEnd = endOfDay(endDate);
        matchesDate = entryDate >= normalizedStart && entryDate <= normalizedEnd;
      } else if (startDate) {
        const normalizedStart = startOfDay(startDate);
        matchesDate = entryDate >= normalizedStart;
      } else if (endDate) {
        const normalizedEnd = endOfDay(endDate);
        matchesDate = entryDate <= normalizedEnd;
      }
    }
    
    return matchesSearch && matchesProject && matchesDate;
  });

  const isPending = createEntryMutation.isPending || updateEntryMutation.isPending;

  // Calculate summary statistics
  const totalWorkers = filteredTimesheets.reduce((sum, entry) => sum + entry.workerCount, 0);
  const totalHours = filteredTimesheets.reduce((sum, entry) => sum + parseFloat(entry.hours), 0);

  // Get active project name
  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className="space-y-6">
      <PrintHeader documentTitle="PUANTAJ LİSTESİ" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Puantaj</h1>
          <p className="text-muted-foreground mt-1">Günlük işçi çalışma saatleri takibi</p>
          {activeProject && (
            <p className="text-sm text-primary mt-1">Aktif Proje: {activeProject.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button onClick={handleAddEntry} data-testid="button-add-timesheet">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Puantaj Ekle
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 no-print">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="İş grubunda veya taşeronda ara..."
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
            İş gruplarına ve taşeronlara göre günlük işçi çalışma saatleri
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
                    <TableHead>Taşeron</TableHead>
                    <TableHead>İş Grubu</TableHead>
                    <TableHead className="text-right">İşçi Sayısı</TableHead>
                    <TableHead className="text-right">Saat</TableHead>
                    <TableHead>Notlar</TableHead>
                    <TableHead className="text-right no-print">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTimesheets.map((entry) => (
                    <TableRow key={entry.id} data-testid={`row-timesheet-${entry.id}`}>
                      <TableCell>
                        {format(new Date(entry.date), "dd MMMM yyyy", { locale: tr })}
                      </TableCell>
                      <TableCell className="font-medium">{entry.projectName}</TableCell>
                      <TableCell>{entry.subcontractorName}</TableCell>
                      <TableCell>{entry.isGrubu}</TableCell>
                      <TableCell className="text-right font-mono">{entry.workerCount}</TableCell>
                      <TableCell className="text-right font-mono">{entry.hours}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {entry.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right no-print">
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

      {/* Batch Entry Dialog */}
      <Dialog open={isDialogOpen && !editingEntry} onOpenChange={(open) => { if (!open) setIsDialogOpen(false); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Puantaj Ekle</DialogTitle>
            <DialogDescription>
              {activeProject ? (
                <span>Proje: <strong>{activeProject.name}</strong> - Birden fazla ekip için puantaj girişi yapabilirsiniz.</span>
              ) : (
                <span className="text-destructive">Lütfen önce ana sayfadan aktif proje seçin!</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Date Selection */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Tarih</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !batchDate && "text-muted-foreground"
                      )}
                      data-testid="button-batch-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {batchDate ? format(new Date(batchDate), "PPP", { locale: tr }) : "Tarih seçin"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={batchDate ? new Date(batchDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setBatchDate(format(date, "yyyy-MM-dd"));
                        }
                      }}
                      locale={tr}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Entry Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Yeni Kayıt Ekle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">İş Grubu *</label>
                    <Select value={currentIsGrubu} onValueChange={setCurrentIsGrubu}>
                      <SelectTrigger data-testid="select-is-grubu">
                        <SelectValue placeholder="Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {isGrubuEnum.map((grup) => (
                          <SelectItem key={grup} value={grup}>
                            {grup}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Taşeron</label>
                    <Select value={currentSubcontractorId} onValueChange={setCurrentSubcontractorId}>
                      <SelectTrigger data-testid="select-subcontractor">
                        <SelectValue placeholder="Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Belirtilmedi</SelectItem>
                        {subcontractors.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">İşçi Sayısı *</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={currentWorkerCount}
                      onChange={(e) => setCurrentWorkerCount(e.target.value)}
                      data-testid="input-worker-count"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Çalışma Saati *</label>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="0,00"
                      value={currentHours}
                      onChange={(e) => setCurrentHours(e.target.value)}
                      data-testid="input-hours"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={handleAddToPending}
                      className="w-full"
                      disabled={!activeProjectId}
                      data-testid="button-add-entry"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ekle
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium mb-2 block">Notlar</label>
                  <Textarea
                    placeholder="Ek notlar (opsiyonel)..."
                    value={currentNotes}
                    onChange={(e) => setCurrentNotes(e.target.value)}
                    className="min-h-16"
                    data-testid="textarea-notes"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pending Entries List */}
            {pendingEntries.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Bekleyen Kayıtlar ({pendingEntries.length})</CardTitle>
                  <CardDescription>Aşağıdaki kayıtlar kaydedilmeyi bekliyor</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>İş Grubu</TableHead>
                        <TableHead>Taşeron</TableHead>
                        <TableHead className="text-right">İşçi</TableHead>
                        <TableHead className="text-right">Saat</TableHead>
                        <TableHead>Notlar</TableHead>
                        <TableHead className="text-right">Kaldır</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.isGrubu}</TableCell>
                          <TableCell>{entry.subcontractorName}</TableCell>
                          <TableCell className="text-right font-mono">{entry.workerCount}</TableCell>
                          <TableCell className="text-right font-mono">{entry.hours}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{entry.notes || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemovePending(entry.id)}
                              data-testid={`button-remove-${entry.id}`}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Toplam İşçi:</span>
                      <span className="font-mono font-medium">{pendingEntries.reduce((sum, e) => sum + e.workerCount, 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>Toplam Saat:</span>
                      <span className="font-mono font-medium">{pendingEntries.reduce((sum, e) => sum + parseFloat(e.hours), 0).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
              data-testid="button-cancel"
            >
              İptal
            </Button>
            <Button 
              onClick={handleSaveAll} 
              disabled={isSaving || pendingEntries.length === 0 || !activeProjectId}
              data-testid="button-save-all"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tümünü Kaydet ({pendingEntries.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen && !!editingEntry} onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); setEditingEntry(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Puantaj Kaydını Düzenle</DialogTitle>
            <DialogDescription>
              Puantaj bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <FormField
                  control={form.control}
                  name="isGrubu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İş Grubu *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-is-grubu-edit">
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

                <FormField
                  control={form.control}
                  name="subcontractorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taşeron</FormLabel>
                      <Select onValueChange={(val) => field.onChange(val === "none" ? null : val)} value={field.value || "none"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-subcontractor-edit">
                            <SelectValue placeholder="Taşeron seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Belirtilmedi</SelectItem>
                          {subcontractors.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>
                              {sub.name}
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
                          data-testid="input-worker-count-edit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Çalışma Saati *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="0,00"
                          {...field}
                          data-testid="input-hours-edit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        data-testid="textarea-notes-edit"
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
                  onClick={() => { setIsDialogOpen(false); setEditingEntry(null); }}
                  disabled={isPending}
                  data-testid="button-cancel-edit"
                >
                  İptal
                </Button>
                <Button type="submit" disabled={isPending} data-testid="button-submit-edit">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Güncelle
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
