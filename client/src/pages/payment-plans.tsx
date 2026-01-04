import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Calendar, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertPaymentPlanSchema,
  type InsertPaymentPlan,
  type PaymentPlan,
  type Project,
  type Contract,
  paymentPlanStatusEnum,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function PaymentPlans() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: paymentPlans = [], isLoading: isLoadingPlans } = useQuery<PaymentPlan[]>({
    queryKey: ["/api/payment-plans"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const form = useForm<InsertPaymentPlan>({
    resolver: zodResolver(insertPaymentPlanSchema),
    defaultValues: {
      projectId: "",
      contractId: "",
      title: "",
      type: "Gelir",
      description: "",
      plannedAmount: "",
      plannedDate: "",
      status: "Bekliyor",
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: InsertPaymentPlan) => {
      const response = await apiRequest("POST", "/api/payment-plans", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-plans"] });
      toast({
        title: "Başarılı",
        description: "Ödeme planı başarıyla oluşturuldu",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Ödeme planı oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPaymentPlan> }) => {
      const response = await apiRequest("PATCH", `/api/payment-plans/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-plans"] });
      toast({
        title: "Başarılı",
        description: "Ödeme planı başarıyla güncellendi",
      });
      setIsDialogOpen(false);
      setEditingPlan(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Ödeme planı güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/payment-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-plans"] });
      toast({
        title: "Başarılı",
        description: "Ödeme planı başarıyla silindi",
      });
      setDeletePlanId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Ödeme planı silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const filteredPlans = useMemo(() => {
    return paymentPlans.filter((plan) => {
      const project = projects.find(p => p.id === plan.projectId);
      const projectName = project?.name || "";
      
      const matchesSearch =
        plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projectName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || plan.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [paymentPlans, projects, searchTerm, statusFilter]);

  const handleAddPlan = () => {
    setEditingPlan(null);
    form.reset({
      projectId: "",
      contractId: "",
      title: "",
      type: "Gelir",
      description: "",
      plannedAmount: "",
      plannedDate: "",
      status: "Bekliyor",
    });
    setIsDialogOpen(true);
  };

  const handleEditPlan = (plan: PaymentPlan) => {
    setEditingPlan(plan);
    form.reset({
      projectId: plan.projectId,
      contractId: plan.contractId || "",
      title: plan.title,
      type: plan.type,
      description: plan.description || "",
      plannedAmount: plan.plannedAmount,
      plannedDate: plan.plannedDate,
      actualDate: plan.actualDate || "",
      actualAmount: plan.actualAmount || "",
      status: plan.status,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: InsertPaymentPlan) => {
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data });
    } else {
      createPlanMutation.mutate(data);
    }
  };

  const confirmDelete = () => {
    if (deletePlanId) {
      deletePlanMutation.mutate(deletePlanId);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrencyValue = (amount: string | null) => {
    if (!amount) return "-";
    return formatCurrency(Number(amount));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Tamamlandı": return "default";
      case "Kısmi Ödeme": return "secondary";
      case "Gecikmiş": return "destructive";
      case "İptal": return "outline";
      default: return "outline";
    }
  };

  const isOverdue = (plan: PaymentPlan) => {
    if (plan.status === "Tamamlandı" || plan.status === "İptal") return false;
    const today = new Date();
    const plannedDate = new Date(plan.plannedDate);
    return plannedDate < today;
  };

  const totalPlannedAmount = filteredPlans.reduce((sum, p) => sum + Number(p.plannedAmount || 0), 0);
  const completedPlans = filteredPlans.filter(p => p.status === "Tamamlandı").length;
  const overduePlans = filteredPlans.filter(isOverdue).length;

  if (isLoadingPlans) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ödeme Planları</h1>
          <p className="text-muted-foreground">Planlanan ödemeleri takip edin</p>
        </div>
        <Button onClick={handleAddPlan} data-testid="button-add-payment-plan">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Ödeme Planı
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Plan</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPlans.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedPlans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gecikmiş</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overduePlans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tutar</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalPlannedAmount)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ödeme planı veya proje adı ile ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-payment-plans"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            {paymentPlanStatusEnum.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Başlık</TableHead>
              <TableHead>Proje</TableHead>
              <TableHead>Planlanan Tarih</TableHead>
              <TableHead>Planlanan Tutar</TableHead>
              <TableHead>Gerçekleşen Tarih</TableHead>
              <TableHead>Gerçekleşen Tutar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Ödeme planı bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              filteredPlans.map((plan) => {
                const project = projects.find(p => p.id === plan.projectId);
                const overdue = isOverdue(plan);
                return (
                  <TableRow 
                    key={plan.id} 
                    data-testid={`row-payment-plan-${plan.id}`}
                    className={overdue ? "bg-destructive/5" : ""}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {overdue && <AlertTriangle className="h-4 w-4 text-destructive" />}
                        {plan.title}
                      </div>
                    </TableCell>
                    <TableCell>{project?.name || "-"}</TableCell>
                    <TableCell>{formatDate(plan.plannedDate)}</TableCell>
                    <TableCell className="font-mono">{formatCurrencyValue(plan.plannedAmount)}</TableCell>
                    <TableCell>{formatDate(plan.actualDate)}</TableCell>
                    <TableCell className="font-mono">{formatCurrencyValue(plan.actualAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(plan.status)}>
                        {plan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPlan(plan)}
                          data-testid={`button-edit-plan-${plan.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletePlanId(plan.id)}
                          data-testid={`button-delete-plan-${plan.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Ödeme Planı Düzenle" : "Yeni Ödeme Planı Ekle"}
            </DialogTitle>
            <DialogDescription>
              {editingPlan
                ? "Ödeme planı bilgilerini güncelleyin"
                : "Yeni bir ödeme planı oluşturmak için bilgileri doldurun"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proje *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-plan-project">
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
                  name="contractId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sözleşme</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-plan-contract">
                            <SelectValue placeholder="Sözleşme seçin (opsiyonel)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">Sözleşme yok</SelectItem>
                          {contracts.map((contract) => (
                            <SelectItem key={contract.id} value={contract.id}>
                              {contract.title}
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
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Başlık *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ödeme planı başlığı"
                          data-testid="input-plan-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tür *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-plan-type">
                            <SelectValue placeholder="Tür seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Gelir">Gelir</SelectItem>
                          <SelectItem value="Gider">Gider</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plannedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planlanan Tarih *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          data-testid="input-plan-planned-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plannedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planlanan Tutar (₺) *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          data-testid="input-plan-planned-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {editingPlan && (
                  <>
                    <FormField
                      control={form.control}
                      name="actualDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gerçekleşen Tarih</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              type="date"
                              data-testid="input-plan-actual-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="actualAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gerçekleşen Tutar (₺)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              data-testid="input-plan-actual-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durum</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-plan-status">
                            <SelectValue placeholder="Durum seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentPlanStatusEnum.map((status) => (
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
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Açıklama</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Ödeme planı açıklaması..."
                          rows={3}
                          data-testid="input-plan-description"
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
                    setIsDialogOpen(false);
                    setEditingPlan(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-plan"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                  data-testid="button-save-plan"
                >
                  {(createPlanMutation.isPending || updatePlanMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingPlan ? "Güncelle" : "Oluştur"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePlanId} onOpenChange={(open) => !open && setDeletePlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ödeme Planını Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu ödeme planını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-plan">İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletePlanMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-plan"
            >
              {deletePlanMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
