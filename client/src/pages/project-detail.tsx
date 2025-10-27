import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintButton } from "@/components/print-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BudgetTable } from "@/components/budget-table";
import { TaskList } from "@/components/task-list";
import { TimesheetTable } from "@/components/timesheet-table";
import { SiteDiaryCard } from "@/components/site-diary-card";
import { Edit, MapPin, Calendar, Ruler, ArrowLeft, Plus } from "lucide-react";
import { Link } from "wouter";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, type InsertProject, type Project, type Customer, type BudgetItem, type InsertBudgetItem, projectStatusEnum, contractTypeEnum, insertBudgetItemSchema, budgetItemStatusEnum, isGrubuEnum, rayicGrubuEnum } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Slider } from "@/components/ui/slider";
import { z } from "zod";

const budgetFormSchema = insertBudgetItemSchema.extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export default function ProjectDetail() {
  const [, params] = useRoute("/projeler/:id");
  const [, setLocation] = useLocation();
  const projectId = params?.id;
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [editingBudgetItem, setEditingBudgetItem] = useState<BudgetItem | null>(null);
  const [deleteBudgetItemId, setDeleteBudgetItemId] = useState<string | null>(null);

  // Fetch real project data
  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  // Fetch customers for the form
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Fetch budget items for this project
  const { data: allBudgetItems = [], isLoading: budgetItemsLoading } = useQuery<BudgetItem[]>({
    queryKey: ["/api/budget-items"],
    enabled: !!projectId,
  });

  // Filter budget items by this project
  const budgetItems = allBudgetItems.filter(item => item.projectId === projectId);

  // Project form setup
  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      location: "",
      area: undefined,
      startDate: "",
      endDate: "",
      status: "Planlama",
      contractType: undefined,
      contractAmount: undefined,
      customerId: undefined,
      description: "",
      notes: "",
    },
  });

  // Budget item form setup
  const budgetForm = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      projectId: projectId || "",
      name: "",
      description: "",
      quantity: "",
      unit: "",
      unitPrice: "",
      isGrubu: "",
      rayicGrubu: "",
      status: "Başlamadı",
      progress: 0,
      startDate: "",
      endDate: "",
      actualQuantity: "",
      actualUnitPrice: "",
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (data: Partial<InsertProject>) => {
      const response = await apiRequest("PATCH", `/api/projects/${projectId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Başarılı",
        description: "Proje başarıyla güncellendi",
      });
      setIsEditDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Proje güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Budget item mutations
  const updateBudgetItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertBudgetItem> }) => {
      return apiRequest("PATCH", `/api/budget-items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-items"] });
      setIsBudgetDialogOpen(false);
      setEditingBudgetItem(null);
      toast({ title: "Başarılı", description: "Bütçe kalemi güncellendi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Bütçe kalemi güncellenemedi", variant: "destructive" });
    },
  });

  const deleteBudgetItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/budget-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-items"] });
      setDeleteBudgetItemId(null);
      toast({ title: "Başarılı", description: "Bütçe kalemi silindi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Bütçe kalemi silinemedi", variant: "destructive" });
    },
  });

  const handleEdit = () => {
    // Open edit dialog and populate form with current project data
    if (project) {
      form.reset({
        name: project.name,
        location: project.location || "",
        area: project.area || undefined,
        startDate: project.startDate || "",
        endDate: project.endDate || "",
        status: project.status,
        contractType: project.contractType || undefined,
        contractAmount: project.contractAmount || undefined,
        customerId: project.customerId || undefined,
        description: project.description || "",
        notes: project.notes || "",
      });
      setIsEditDialogOpen(true);
    }
  };

  const onSubmit = (data: InsertProject) => {
    updateProjectMutation.mutate(data);
  };

  const handleEditBudgetItem = (id: string) => {
    const item = budgetItems.find(item => item.id === id);
    if (!item) return;
    
    setEditingBudgetItem(item);
    budgetForm.reset({
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
    setIsBudgetDialogOpen(true);
  };

  const handleDeleteBudgetItem = (id: string) => {
    setDeleteBudgetItemId(id);
  };

  const confirmDeleteBudgetItem = () => {
    if (deleteBudgetItemId) {
      deleteBudgetItemMutation.mutate(deleteBudgetItemId);
    }
  };

  const onBudgetSubmit = (data: BudgetFormValues) => {
    const submitData = {
      ...data,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
      actualQuantity: data.actualQuantity || undefined,
      actualUnitPrice: data.actualUnitPrice || undefined,
    };

    if (editingBudgetItem) {
      updateBudgetItemMutation.mutate({ id: editingBudgetItem.id, data: submitData });
    }
  };

  const handleAddBudgetItem = () => {
    // Navigate to budget page with this project pre-selected
    setLocation(`/butce?project=${projectId}`);
  };

  const handleAddTask = () => {
    // Navigate to work schedule page with this project pre-selected
    setLocation(`/is-programi?project=${projectId}`);
  };

  const handleAddTimesheet = () => {
    // Navigate to timesheet page with this project pre-selected
    setLocation(`/puantaj?project=${projectId}`);
  };

  const handleAddSiteDiary = () => {
    // Navigate to site diary page with this project pre-selected
    setLocation(`/santiye-defteri?project=${projectId}`);
  };

  if (!projectId) {
    return <div>Proje ID bulunamadı</div>;
  }

  if (isLoading) {
    return <div className="container mx-auto p-6">Yükleniyor...</div>;
  }

  if (!project) {
    return <div className="container mx-auto p-6">Proje bulunamadı</div>;
  }

  const mockTasks = [
    {
      id: "1",
      name: "Temel kazısı ve beton dökümü",
      startDate: "01.02.2024",
      endDate: "15.02.2024",
      status: "Tamamlandı",
      responsible: "Mehmet Aydın",
      notes: "Hava şartları nedeniyle 2 gün gecikme yaşandı",
    },
    {
      id: "2",
      name: "Kolon ve kiriş imalatı",
      startDate: "16.02.2024",
      endDate: "10.03.2024",
      status: "Devam Ediyor",
      responsible: "Ali Yılmaz",
    },
  ];

  const mockTimesheets = [
    {
      id: "1",
      date: "26.10.2024",
      isGrubu: "Kaba İmalat",
      workerCount: 15,
      hours: 8,
      notes: "Temel kazısı",
    },
    {
      id: "2",
      date: "26.10.2024",
      isGrubu: "İnce İmalat",
      workerCount: 8,
      hours: 9,
      notes: "Kalıp işleri",
    },
  ];

  const mockDiaryEntries = [
    {
      id: "1",
      date: "26.10.2024",
      weather: "Bulutlu",
      workDone: "Temel kazısı tamamlandı.\n2. kat kolon kalıpları yerleştirildi.\nBeton dökümü için hazırlık yapıldı.",
      materialsUsed: "Beton C30: 45m³\nİnşaat Demiri: 2.5 ton\nKalıp malzemesi",
      totalWorkers: 28,
      issues: "Beton mikserinde küçük bir arıza oluştu, 2 saat gecikme yaşandı.",
      notes: "Yarın hava durumu uygunsa beton dökümü yapılacak.",
    },
  ];

  const statusColors: Record<string, string> = {
    "Planlama": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    "Devam Ediyor": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    "Tamamlandı": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    "Askıda": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projeler">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge className={statusColors[project.status] || ""}>
              {project.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">Proje detayları ve ilerleme takibi</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button onClick={handleEdit} data-testid="button-edit-project">
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proje Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.location && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Konum</span>
                </div>
                <p className="font-medium">{project.location}</p>
              </div>
            )}
            {project.area && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Ruler className="h-4 w-4" />
                  <span>Alan</span>
                </div>
                <p className="font-medium">{project.area} m²</p>
              </div>
            )}
            {(project.startDate || project.endDate) && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Tarih Aralığı</span>
                </div>
                <p className="font-medium">
                  {project.startDate} - {project.endDate}
                </p>
              </div>
            )}
          </div>
          {project.description && (
            <div className="mt-6 space-y-1">
              <p className="text-sm text-muted-foreground">Açıklama</p>
              <p className="font-medium">{project.description}</p>
            </div>
          )}
          {project.notes && (
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Notlar</p>
              <p className="text-sm">{project.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="budget" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="budget" data-testid="tab-budget">
            Bütçe
          </TabsTrigger>
          <TabsTrigger value="schedule" data-testid="tab-schedule">
            İş Programı
          </TabsTrigger>
          <TabsTrigger value="timesheet" data-testid="tab-timesheet-detail">
            Puantaj
          </TabsTrigger>
          <TabsTrigger value="diary" data-testid="tab-diary-detail">
            Şantiye Defteri
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bütçe Kalemleri</CardTitle>
                <Button size="sm" onClick={handleAddBudgetItem} data-testid="button-add-budget-item">
                  <Plus className="h-4 w-4 mr-2" />
                  Kalem Ekle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {budgetItemsLoading ? (
                <div className="text-center py-8">Yükleniyor...</div>
              ) : (
                <BudgetTable
                  items={budgetItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: parseFloat(item.quantity),
                    unit: item.unit,
                    unitPrice: parseFloat(item.unitPrice),
                    isGrubu: item.isGrubu,
                    rayicGrubu: item.rayicGrubu,
                  }))}
                  onEdit={handleEditBudgetItem}
                  onDelete={handleDeleteBudgetItem}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">İş Programı Görevleri</h2>
              <Button size="sm" onClick={handleAddTask} data-testid="button-add-task">
                <Plus className="h-4 w-4 mr-2" />
                Görev Ekle
              </Button>
            </div>
            <TaskList
              tasks={mockTasks}
              onEdit={handleEdit}
              onDelete={(id) => toast({ title: "Bilgi", description: "Görev silme işlemi için İş Programı sayfasını kullanın." })}
            />
          </div>
        </TabsContent>

        <TabsContent value="timesheet">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Günlük Puantaj Kayıtları</CardTitle>
                <Button size="sm" onClick={handleAddTimesheet} data-testid="button-add-timesheet">
                  <Plus className="h-4 w-4 mr-2" />
                  Puantaj Ekle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TimesheetTable
                entries={mockTimesheets}
                onEdit={handleEdit}
                onDelete={(id) => toast({ title: "Bilgi", description: "Puantaj silme işlemi için Puantaj sayfasını kullanın." })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diary">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Günlük Şantiye Raporları</h2>
              <Button size="sm" onClick={handleAddSiteDiary} data-testid="button-add-site-diary">
                <Plus className="h-4 w-4 mr-2" />
                Rapor Ekle
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockDiaryEntries.map((entry) => (
                <SiteDiaryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={() => toast({ title: "Bilgi", description: "Şantiye defteri silme işlemi için Şantiye Defteri sayfasını kullanın." })}
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditDialogOpen(false);
          form.reset();
        } else {
          setIsEditDialogOpen(true);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proje Düzenle</DialogTitle>
            <DialogDescription>
              Proje bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Proje Adı *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Örn: Ataşehir Konut Projesi" data-testid="input-project-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konum</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="Örn: İstanbul, Ataşehir" data-testid="input-project-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alan (m²)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} type="number" step="0.01" placeholder="2500" data-testid="input-project-area" />
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
                        <Input {...field} value={field.value ?? ""} type="date" data-testid="input-project-start-date" />
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
                        <Input {...field} value={field.value ?? ""} type="date" data-testid="input-project-end-date" />
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
                          <SelectTrigger data-testid="select-project-status">
                            <SelectValue placeholder="Durum seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projectStatusEnum.map((status) => (
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
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Müşteri</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "none"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-project-customer">
                            <SelectValue placeholder="Müşteri seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Müşteri yok</SelectItem>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
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
                  name="contractType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sözleşme Türü</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "none"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-contract-type">
                            <SelectValue placeholder="Sözleşme türü seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sözleşme yok</SelectItem>
                          {contractTypeEnum.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
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
                  name="contractAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sözleşme Tutarı (TL)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value ?? ""} 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          data-testid="input-contract-amount" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="advancePayment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avans Ödemesi (TL)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value ?? ""} 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          data-testid="input-advance-payment" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("contractType") === "Maliyet + Kar Marjı" && (
                  <FormField
                    control={form.control}
                    name="profitMargin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kar Marjı (%)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value ?? ""} 
                            type="number" 
                            step="0.01" 
                            placeholder="15" 
                            data-testid="input-profit-margin" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Açıklama</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Proje hakkında detaylı bilgi..."
                          rows={3}
                          data-testid="input-project-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Notlar</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Ekstra notlar..."
                          rows={3}
                          data-testid="input-project-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    form.reset();
                  }}
                  data-testid="button-cancel-project"
                >
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProjectMutation.isPending}
                  data-testid="button-save-project"
                >
                  {updateProjectMutation.isPending && (
                    <span className="mr-2">⏳</span>
                  )}
                  Güncelle
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Budget Item Edit Dialog */}
      <Dialog open={isBudgetDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsBudgetDialogOpen(false);
          setEditingBudgetItem(null);
          budgetForm.reset();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bütçe Kalemini Düzenle</DialogTitle>
          </DialogHeader>
          <Form {...budgetForm}>
            <form onSubmit={budgetForm.handleSubmit(onBudgetSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={budgetForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Kalem Adı *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Örn: Beton dökümü" data-testid="input-budget-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={budgetForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} placeholder="Detaylı açıklama" rows={2} data-testid="input-budget-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={budgetForm.control}
                  name="isGrubu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İş Grubu *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-budget-is-grubu">
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
                  control={budgetForm.control}
                  name="rayicGrubu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rayiç Grubu *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-budget-rayic-grubu">
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
                  control={budgetForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Miktar *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="100" data-testid="input-budget-quantity" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={budgetForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birim *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="m³, ton, adet" data-testid="input-budget-unit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={budgetForm.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birim Fiyat *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="1500" data-testid="input-budget-unit-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={budgetForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Başlangıç Tarihi</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-budget-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={budgetForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bitiş Tarihi</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-budget-end-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={budgetForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durum</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-budget-status">
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
                  control={budgetForm.control}
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
                          data-testid="slider-budget-progress"
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
                    control={budgetForm.control}
                    name="actualQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gerçekleşen Miktar</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="number" step="0.01" placeholder="85" data-testid="input-budget-actual-quantity" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={budgetForm.control}
                    name="actualUnitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gerçekleşen Birim Fiyat</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="number" step="0.01" placeholder="1650" data-testid="input-budget-actual-unit-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsBudgetDialogOpen(false);
                    setEditingBudgetItem(null);
                    budgetForm.reset();
                  }}
                  data-testid="button-cancel-budget"
                >
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateBudgetItemMutation.isPending}
                  data-testid="button-save-budget"
                >
                  {updateBudgetItemMutation.isPending && (
                    <span className="mr-2">⏳</span>
                  )}
                  Güncelle
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Budget Item Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteBudgetItemId} onOpenChange={(open) => !open && setDeleteBudgetItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bütçe Kalemini Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu bütçe kalemini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-budget">İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteBudgetItem}
              disabled={deleteBudgetItemMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-budget"
            >
              {deleteBudgetItemMutation.isPending && (
                <span className="mr-2">⏳</span>
              )}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
