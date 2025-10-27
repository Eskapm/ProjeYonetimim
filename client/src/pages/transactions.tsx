import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TransactionTable } from "@/components/transaction-table";
import { TaxSummaryPanel } from "@/components/tax-summary-panel";
import { PrintButton } from "@/components/print-button";
import { ExportToExcel } from "@/components/export-to-excel";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Calculator, Loader2 } from "lucide-react";
import { calculateTaxSummary } from "@shared/taxCalculations";
import { PrintHeader } from "@/components/print-header";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertTransactionSchema,
  type InsertTransaction,
  type Transaction,
  type Project,
  transactionTypeEnum,
  isGrubuEnum,
  rayicGrubuEnum,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TransactionWithProject extends Transaction {
  projectName: string;
}

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [isGrubuFilter, setIsGrubuFilter] = useState("all");
  const [rayicGrubuFilter, setRayicGrubuFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: transactions = [], isLoading: isLoadingTransactions, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const response = await apiRequest("POST", "/api/transactions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Başarılı",
        description: "İşlem başarıyla oluşturuldu",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "İşlem oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTransaction> }) => {
      const response = await apiRequest("PATCH", `/api/transactions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Başarılı",
        description: "İşlem başarıyla güncellendi",
      });
      setIsDialogOpen(false);
      setEditingTransaction(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "İşlem güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Başarılı",
        description: "İşlem başarıyla silindi",
      });
      setDeleteTransactionId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "İşlem silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertTransaction>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      projectId: "",
      type: "Gider",
      amount: "",
      date: "",
      description: "",
      isGrubu: "",
      rayicGrubu: "",
      invoiceNumber: "",
    },
  });

  const onSubmit = (data: InsertTransaction) => {
    const cleanedData = {
      ...data,
      description: data.description || null,
      invoiceNumber: data.invoiceNumber || null,
    };

    if (editingTransaction) {
      updateTransactionMutation.mutate({ id: editingTransaction.id, data: cleanedData });
    } else {
      createTransactionMutation.mutate(cleanedData);
    }
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    form.reset({
      projectId: "",
      type: "Gider",
      amount: "",
      date: "",
      description: "",
      isGrubu: "",
      rayicGrubu: "",
      invoiceNumber: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    form.reset({
      projectId: transaction.projectId,
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date,
      description: transaction.description ?? "",
      isGrubu: transaction.isGrubu,
      rayicGrubu: transaction.rayicGrubu,
      invoiceNumber: transaction.invoiceNumber ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    setDeleteTransactionId(id);
  };

  const confirmDelete = () => {
    if (deleteTransactionId) {
      deleteTransactionMutation.mutate(deleteTransactionId);
    }
  };

  const transactionsWithProjects: TransactionWithProject[] = useMemo(() => {
    return transactions.map((transaction) => {
      const project = projects.find((p) => p.id === transaction.projectId);
      return {
        ...transaction,
        projectName: project?.name || "Bilinmeyen Proje",
      };
    });
  }, [transactions, projects]);

  const filteredTransactions = transactionsWithProjects.filter((transaction) => {
    const matchesSearch =
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesProject =
      selectedProject === "all" || transaction.projectId === selectedProject;
    const matchesIsGrubu = isGrubuFilter === "all" || transaction.isGrubu === isGrubuFilter;
    const matchesRayicGrubu = rayicGrubuFilter === "all" || transaction.rayicGrubu === rayicGrubuFilter;
    return matchesSearch && matchesType && matchesProject && matchesIsGrubu && matchesRayicGrubu;
  });

  const incomes = transactionsWithProjects
    .filter((t) => t.type === "Gelir")
    .map((t) => ({ amount: parseFloat(t.amount), hasKDV: true }));

  const expenses = transactionsWithProjects
    .filter((t) => t.type === "Gider")
    .map((t) => ({ amount: parseFloat(t.amount), hasKDV: true }));

  const taxSummary = calculateTaxSummary(incomes, expenses, true);

  const isLoading = isLoadingTransactions || isLoadingProjects;

  // Prepare data for Excel export
  const excelData = filteredTransactions.map((transaction) => ({
    "Tarih": transaction.date,
    "Proje": transaction.projectName,
    "Tür": transaction.type,
    "Tutar": parseFloat(transaction.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    "İş Grubu": transaction.isGrubu || "-",
    "Rayiç Grubu": transaction.rayicGrubu || "-",
    "Açıklama": transaction.description || "-",
    "Fatura No": transaction.invoiceNumber || "-",
  }));

  return (
    <div className="space-y-6">
      <PrintHeader documentTitle="İŞLEMLER RAPORU" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gelir & Gider İşlemleri</h1>
          <p className="text-muted-foreground mt-1">
            Tüm finansal işlemleri ve vergi hesaplamalarını görüntüleyin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportToExcel 
            data={excelData} 
            filename="islemler" 
            sheetName="İşlemler" 
          />
          <PrintButton />
          <Button onClick={handleAddTransaction} data-testid="button-add-transaction">
            <Plus className="h-4 w-4 mr-2" />
            Yeni İşlem Ekle
          </Button>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="transactions" data-testid="tab-transactions-list">
            İşlem Listesi
          </TabsTrigger>
          <TabsTrigger value="taxes" data-testid="tab-tax-summary">
            <Calculator className="h-4 w-4 mr-2" />
            Vergi Hesaplama
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="İşlem açıklaması veya proje adı ile ara..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-transactions"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[150px]" data-testid="select-type-filter">
                  <SelectValue placeholder="Tür" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="Gelir">Gelir</SelectItem>
                  <SelectItem value="Gider">Gider</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-full sm:w-[250px]" data-testid="select-project-filter-transactions">
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
              <Select value={isGrubuFilter} onValueChange={setIsGrubuFilter}>
                <SelectTrigger className="w-full sm:w-[280px]" data-testid="select-is-grubu-filter">
                  <SelectValue placeholder="İş Grubu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm İş Grupları</SelectItem>
                  {isGrubuEnum.map((grup) => (
                    <SelectItem key={grup} value={grup}>
                      {grup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={rayicGrubuFilter} onValueChange={setRayicGrubuFilter}>
                <SelectTrigger className="w-full sm:w-[280px]" data-testid="select-rayic-grubu-filter">
                  <SelectValue placeholder="Rayiç Grubu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Rayiç Grupları</SelectItem>
                  {rayicGrubuEnum.map((grup) => (
                    <SelectItem key={grup} value={grup}>
                      {grup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {transactionsError && (
            <div className="text-center py-12">
              <p className="text-destructive">İşlemler yüklenirken bir hata oluştu</p>
              <p className="text-muted-foreground text-sm mt-2">{transactionsError.message}</p>
            </div>
          )}

          {isLoading && (
            <Card>
              <CardHeader>
                <CardTitle>İşlem Kayıtları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoading && !transactionsError && filteredTransactions.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>İşlem Kayıtları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    {searchTerm || typeFilter !== "all" || selectedProject !== "all" || isGrubuFilter !== "all" || rayicGrubuFilter !== "all"
                      ? "İşlem bulunamadı"
                      : "Henüz işlem eklenmemiş"}
                  </p>
                  {!searchTerm && typeFilter === "all" && selectedProject === "all" && isGrubuFilter === "all" && rayicGrubuFilter === "all" && (
                    <Button onClick={handleAddTransaction} className="mt-4" data-testid="button-add-first-transaction">
                      <Plus className="h-4 w-4 mr-2" />
                      İlk İşlemi Ekle
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoading && !transactionsError && filteredTransactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>İşlem Kayıtları</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionTable
                  transactions={filteredTransactions}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="taxes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Vergi Hesaplama ve Özetler
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                2025 yılı vergi oranlarına göre hesaplanmıştır. KDV %20, Kurumlar Vergisi %25
              </p>
            </CardHeader>
            <CardContent>
              <TaxSummaryPanel
                totalIncome={taxSummary.grossIncome}
                totalExpense={taxSummary.grossExpense}
                profit={taxSummary.profit}
                kdvCollected={taxSummary.kdv.collected}
                kdvPaid={taxSummary.kdv.paid}
                kdvPayable={taxSummary.kdv.netPayable}
                incomeTax={taxSummary.incomeTax.amount}
                corporateTax={taxSummary.corporateTax}
                effectiveRate={taxSummary.incomeTax.effectiveRate}
                isCompany={true}
              />
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">Vergi Bilgilendirme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold mb-1">KDV (Katma Değer Vergisi)</h4>
                <p className="text-muted-foreground">
                  Genel oran %20. Tahsil edilen KDV ile ödenen KDV arasındaki fark ay sonunda
                  beyan edilir.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Kurumlar Vergisi</h4>
                <p className="text-muted-foreground">
                  Limited şirketler için oran %25. Yıllık net kar üzerinden hesaplanır. Geçici
                  vergi 3 aylık dönemlerde beyan edilir.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Kar Dağıtım Stopajı</h4>
                <p className="text-muted-foreground">
                  Ortaklara kar dağıtımı yapıldığında %10 stopaj uygulanır.
                </p>
              </div>
              <p className="text-xs text-muted-foreground italic mt-4">
                Bu hesaplamalar bilgilendirme amaçlıdır. Kesin vergi yükümlülükleriniz için mali
                müşavirinize danışınız.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? "İşlem Düzenle" : "Yeni İşlem Ekle"}
            </DialogTitle>
            <DialogDescription>
              {editingTransaction
                ? "İşlem bilgilerini güncelleyin"
                : "Yeni bir gelir veya gider işlemi oluşturmak için aşağıdaki bilgileri doldurun"}
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
                          <SelectTrigger data-testid="select-transaction-project">
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
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İşlem Türü *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-transaction-type">
                            <SelectValue placeholder="Tür seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {transactionTypeEnum.map((type) => (
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tutar (₺) *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-transaction-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarih *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          data-testid="input-transaction-date"
                        />
                      </FormControl>
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
                          <SelectTrigger data-testid="select-transaction-is-grubu">
                            <SelectValue placeholder="İş grubu seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isGrubuEnum.map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
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
                          <SelectTrigger data-testid="select-transaction-rayic-grubu">
                            <SelectValue placeholder="Rayiç grubu seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rayicGrubuEnum.map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
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
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Fatura Numarası</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Örn: FA-2024-001"
                          data-testid="input-transaction-invoice-number"
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
                          {...field}
                          value={field.value ?? ""}
                          placeholder="İşlem açıklaması..."
                          rows={3}
                          data-testid="input-transaction-description"
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
                    setEditingTransaction(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-transaction"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={createTransactionMutation.isPending || updateTransactionMutation.isPending}
                  data-testid="button-save-transaction"
                >
                  {(createTransactionMutation.isPending || updateTransactionMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingTransaction ? "Güncelle" : "Oluştur"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTransactionId} onOpenChange={(open) => !open && setDeleteTransactionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İşlemi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-transaction">İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteTransactionMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-transaction"
            >
              {deleteTransactionMutation.isPending && (
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
