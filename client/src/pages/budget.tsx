import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useProjectContext } from "@/hooks/use-project-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetItemSchema, budgetItemStatusEnum, isGrubuEnum, rayicGrubuEnum, type BudgetItem, type InsertBudgetItem, type Project } from "@shared/schema";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, DollarSign, Clock, Filter, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PrintHeader } from "@/components/print-header";
import { formatCurrency } from "@/lib/format";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PrintButton } from "@/components/print-button";
import { ExportToExcel } from "@/components/export-to-excel";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formSchema = insertBudgetItemSchema.extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BudgetPage() {
  const { toast } = useToast();
  const { activeProjectId, setActiveProjectId } = useProjectContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIsGrubu, setSelectedIsGrubu] = useState<string>("all");
  const [selectedRayicGrubu, setSelectedRayicGrubu] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Local state synced with global context for immediate UI updates
  const [selectedProject, setSelectedProjectLocal] = useState<string>(activeProjectId || "all");
  
  // Sync from context to local state
  useEffect(() => {
    setSelectedProjectLocal(activeProjectId || "all");
  }, [activeProjectId]);
  
  // Update both local state and context when user changes selection
  const setSelectedProject = (id: string) => {
    setSelectedProjectLocal(id);
    setActiveProjectId(id === "all" ? null : id);
  };

  const { data: items = [], isLoading: itemsLoading } = useQuery<BudgetItem[]>({
    queryKey: ["/api/budget-items"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertBudgetItem) => {
      return apiRequest("POST", "/api/budget-items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-items"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Bütçe kalemi oluşturuldu" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Bütçe kalemi oluşturulamadı", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertBudgetItem> }) => {
      return apiRequest("PATCH", `/api/budget-items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-items"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Bütçe kalemi güncellendi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Bütçe kalemi güncellenemedi", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/budget-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-items"] });
      toast({ title: "Bütçe kalemi silindi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Bütçe kalemi silinemedi", variant: "destructive" });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: activeProjectId || "",
      name: "",
      description: "",
      quantity: "",
      unit: "",
      unitPrice: "",
      isGrubu: "",
      rayicGrubu: "",
      status: "Başlamadı",
      progress: 0,
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      actualQuantity: "",
      actualUnitPrice: "",
    },
  });

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset({
        projectId: activeProjectId || "",
        name: "",
        description: "",
        quantity: "",
        unit: "",
        unitPrice: "",
        isGrubu: "",
        rayicGrubu: "",
        status: "Başlamadı",
        progress: 0,
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        actualQuantity: "",
        actualUnitPrice: "",
      });
    } else {
      setIsDialogOpen(true);
    }
  };

  const handleEdit = (item: BudgetItem) => {
    setEditingItem(item);
    form.reset({
      projectId: item.projectId,
      name: item.name,
      description: item.description || "",
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      isGrubu: item.isGrubu,
      rayicGrubu: item.rayicGrubu,
      status: item.status,
      progress: item.progress,
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      actualQuantity: item.actualQuantity || "",
      actualUnitPrice: item.actualUnitPrice || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bu bütçe kalemini silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: FormValues) => {
    const submitData = {
      ...data,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
      actualQuantity: data.actualQuantity || undefined,
      actualUnitPrice: data.actualUnitPrice || undefined,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  // Filtreleme
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject = selectedProject === "all" || item.projectId === selectedProject;
      const matchesIsGrubu = selectedIsGrubu === "all" || item.isGrubu === selectedIsGrubu;
      const matchesRayicGrubu = selectedRayicGrubu === "all" || item.rayicGrubu === selectedRayicGrubu;
      const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;
      return matchesSearch && matchesProject && matchesIsGrubu && matchesRayicGrubu && matchesStatus;
    });
  }, [items, searchQuery, selectedProject, selectedIsGrubu, selectedRayicGrubu, selectedStatus]);

  // Özet hesaplamalar
  const summary = useMemo(() => {
    const totalBudget = filteredItems.reduce((sum, item) => {
      const budgetAmount = parseFloat(item.quantity) * parseFloat(item.unitPrice);
      return sum + budgetAmount;
    }, 0);

    const totalActual = filteredItems.reduce((sum, item) => {
      if (item.actualQuantity && item.actualUnitPrice) {
        const actualAmount = parseFloat(item.actualQuantity) * parseFloat(item.actualUnitPrice);
        return sum + actualAmount;
      }
      return sum;
    }, 0);

    const variance = totalActual - totalBudget;
    const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

    const avgProgress = filteredItems.length > 0
      ? filteredItems.reduce((sum, item) => sum + item.progress, 0) / filteredItems.length
      : 0;

    return {
      totalBudget,
      totalActual,
      variance,
      variancePercent,
      avgProgress,
      totalItems: filteredItems.length,
    };
  }, [filteredItems]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Başlamadı":
        return <Badge variant="secondary" className="no-default-hover-elevate">{status}</Badge>;
      case "Devam Ediyor":
        return <Badge className="bg-blue-500 text-white no-default-hover-elevate">{status}</Badge>;
      case "Tamamlandı":
        return <Badge className="bg-green-500 text-white no-default-hover-elevate">{status}</Badge>;
      default:
        return <Badge variant="outline" className="no-default-hover-elevate">{status}</Badge>;
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Bilinmiyor";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PrintHeader documentTitle="BÜTÇE-KEŞİF RAPORU" />
      
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-3xl font-bold">Bütçe-Keşif</h1>
          <p className="text-muted-foreground">Proje bütçelerini yönetin ve gerçekleşen maliyetleri takip edin</p>
        </div>
        <div className="flex gap-2">
          <ExportToExcel
            data={filteredItems.map(item => ({
              "Kalem Adı": item.name,
              "Proje": getProjectName(item.projectId),
              "Miktar": parseFloat(item.quantity),
              "Birim": item.unit,
              "Birim Fiyat": parseFloat(item.unitPrice),
              "Bütçe Tutarı": parseFloat(item.quantity) * parseFloat(item.unitPrice),
              "Gerçekleşen Miktar": item.actualQuantity ? parseFloat(item.actualQuantity) : 0,
              "Gerçekleşen Birim Fiyat": item.actualUnitPrice ? parseFloat(item.actualUnitPrice) : 0,
              "Gerçekleşen Tutar": (item.actualQuantity && item.actualUnitPrice) ? parseFloat(item.actualQuantity) * parseFloat(item.actualUnitPrice) : 0,
              "Fark": (parseFloat(item.quantity) * parseFloat(item.unitPrice)) - ((item.actualQuantity && item.actualUnitPrice) ? parseFloat(item.actualQuantity) * parseFloat(item.actualUnitPrice) : 0),
              "İş Grubu": item.isGrubu,
              "Rayiç Grubu": item.rayicGrubu,
              "Durum": item.status,
              "İlerleme %": item.progress,
            }))}
            filename="butce-kesifleri"
            sheetName="Bütçe Kalemleri"
          />
          <PrintButton />
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-budget-item" className="no-print">
                <Plus className="mr-2 h-4 w-4" />
                Yeni Kalem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Bütçe Kalemini Düzenle" : "Yeni Bütçe Kalemi"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proje *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kalem Adı *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Örn: Beton dökümü" data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Detaylı açıklama" rows={2} data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
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

                  <FormField
                    control={form.control}
                    name="rayicGrubu"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rayiç Grubu *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-rayic-grubu">
                              <SelectValue placeholder="Rayiç grubu seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rayicGrubuEnum.map((grup) => (
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
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Miktar *</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0,00" data-testid="input-quantity" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birim *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="m³, ton, adet" data-testid="input-unit" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birim Fiyat *</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0,00 TL" data-testid="input-unit-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Başlangıç Tarihi</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-start-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bitiş Tarihi</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-end-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durum</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {budgetItemStatusEnum.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
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
                    name="progress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İlerleme: {field.value || 0}%</FormLabel>
                        <FormControl>
                          <Slider
                            min={0}
                            max={100}
                            step={5}
                            value={[field.value || 0]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                            data-testid="slider-progress"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Gerçekleşen Değerler</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="actualQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gerçekleşen Miktar</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} type="number" step="0.01" placeholder="0,00" data-testid="input-actual-quantity" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="actualUnitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gerçekleşen Birim Fiyat</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} type="number" step="0.01" placeholder="0,00 TL" data-testid="input-actual-unit-price" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => handleDialogClose(false)} data-testid="button-cancel">
                    İptal
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                    {editingItem ? "Güncelle" : "Oluştur"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Özet Kartlar */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 no-print">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Bütçe</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold whitespace-nowrap" data-testid="text-total-budget">{formatCurrency(summary.totalBudget)}</div>
            <p className="text-xs text-muted-foreground">{summary.totalItems} kalem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gerçekleşen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold whitespace-nowrap" data-testid="text-total-actual">{formatCurrency(summary.totalActual)}</div>
            <p className="text-xs text-muted-foreground">Toplam harcama</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fark</CardTitle>
            {summary.variance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold whitespace-nowrap ${summary.variance >= 0 ? 'text-red-500' : 'text-green-500'}`} data-testid="text-variance">
              {formatCurrency(Math.abs(summary.variance))}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.variancePercent >= 0 ? '+' : ''}{summary.variancePercent.toFixed(1)}% fark
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama İlerleme</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-progress">{summary.avgProgress.toFixed(0)}%</div>
            <Progress value={summary.avgProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ara</label>
              <Input
                placeholder="Kalem adı..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Proje</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger data-testid="filter-project">
                  <SelectValue />
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

            <div>
              <label className="text-sm font-medium mb-2 block">İş Grubu</label>
              <Select value={selectedIsGrubu} onValueChange={setSelectedIsGrubu}>
                <SelectTrigger data-testid="filter-is-grubu">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {isGrubuEnum.map((grup) => (
                    <SelectItem key={grup} value={grup}>
                      {grup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Rayiç Grubu</label>
              <Select value={selectedRayicGrubu} onValueChange={setSelectedRayicGrubu}>
                <SelectTrigger data-testid="filter-rayic-grubu">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {rayicGrubuEnum.map((grup) => (
                    <SelectItem key={grup} value={grup}>
                      {grup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Durum</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger data-testid="filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {budgetItemStatusEnum.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste Görünümü */}
      <Card>
        <CardHeader>
          <CardTitle>Bütçe Kalemleri ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {itemsLoading ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Henüz bütçe kalemi eklenmemiş</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kalem</TableHead>
                    <TableHead>Proje</TableHead>
                    <TableHead>İş Grubu</TableHead>
                    <TableHead>Rayiç</TableHead>
                    <TableHead className="text-right">Miktar</TableHead>
                    <TableHead className="text-right">B.Fiyat</TableHead>
                    <TableHead className="text-right">Bütçe</TableHead>
                    <TableHead className="text-right">Gerçekleşen</TableHead>
                    <TableHead className="text-center">İlerleme</TableHead>
                    <TableHead className="text-center">Durum</TableHead>
                    <TableHead className="text-center no-print">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const budgetTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
                    const actualTotal = item.actualQuantity && item.actualUnitPrice
                      ? parseFloat(item.actualQuantity) * parseFloat(item.actualUnitPrice)
                      : 0;

                    return (
                      <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getProjectName(item.projectId)}</Badge>
                        </TableCell>
                        <TableCell>{item.isGrubu}</TableCell>
                        <TableCell>{item.rayicGrubu}</TableCell>
                        <TableCell className="text-right font-mono">
                          {parseFloat(item.quantity).toLocaleString('tr-TR')} {item.unit}
                        </TableCell>
                        <TableCell className="text-right font-mono whitespace-nowrap">
                          {formatCurrency(parseFloat(item.unitPrice))}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold whitespace-nowrap">
                          {formatCurrency(budgetTotal)}
                        </TableCell>
                        <TableCell className="text-right font-mono whitespace-nowrap">
                          {actualTotal > 0 ? formatCurrency(actualTotal) : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={item.progress} className="flex-1" />
                            <span className="text-xs font-medium w-10 text-right">{item.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell className="text-center no-print">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(item)}
                              data-testid={`button-edit-${item.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(item.id)}
                              data-testid={`button-delete-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {/* Özet Bilgiler - Sadece yazdırmada görünür */}
              {filteredItems.length > 0 && (
                <div className="mt-8 pt-6 border-t-2 border-border print-only">
                  <div className="grid grid-cols-3 gap-6 max-w-3xl ml-auto">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-1">Toplam Bütçe</div>
                      <div className="text-2xl font-bold whitespace-nowrap">
                        {summary.totalBudget.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-1">Gerçekleşen Tutar</div>
                      <div className="text-2xl font-bold text-blue-600 whitespace-nowrap">
                        {summary.totalActual.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-1">Fark</div>
                      <div className={cn(
                        "text-2xl font-bold whitespace-nowrap",
                        summary.variance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {summary.variance >= 0 ? "+" : ""}{summary.variance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
