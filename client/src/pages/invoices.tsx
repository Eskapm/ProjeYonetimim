import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Calendar as CalendarIcon, Loader2, Edit2, Trash2, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  insertInvoiceSchema, 
  invoiceTypeEnum, 
  invoiceStatusEnum,
  type InsertInvoice, 
  type Invoice, 
  type Project,
  type Customer,
  type Subcontractor
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch invoices
  const { data: invoices = [], isLoading: isLoadingInvoices, error: invoicesError } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Fetch subcontractors
  const { data: subcontractors = [] } = useQuery<Subcontractor[]>({
    queryKey: ["/api/subcontractors"],
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InsertInvoice) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Başarılı",
        description: "Fatura başarıyla oluşturuldu",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Fatura oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertInvoice> }) => {
      const response = await apiRequest("PATCH", `/api/invoices/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Başarılı",
        description: "Fatura başarıyla güncellendi",
      });
      setIsDialogOpen(false);
      setEditingInvoice(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Fatura güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Başarılı",
        description: "Fatura başarıyla silindi",
      });
      setDeleteInvoiceId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Fatura silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Form setup with custom calculation logic
  const form = useForm<InsertInvoice>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      invoiceNumber: "",
      type: "",
      projectId: null,
      customerId: null,
      subcontractorId: null,
      date: "",
      dueDate: null,
      subtotal: "0",
      taxRate: "20",
      taxAmount: "0",
      total: "0",
      status: "Ödenmedi",
      paidAmount: "0",
      description: "",
      notes: "",
    },
  });

  // Watch subtotal and taxRate to calculate taxAmount and total automatically
  const subtotal = form.watch("subtotal");
  const taxRate = form.watch("taxRate");

  // Update calculations when subtotal or taxRate changes
  useEffect(() => {
    const sub = parseFloat(subtotal as string) || 0;
    const rate = parseFloat(taxRate as string) || 0;
    const tax = (sub * rate) / 100;
    const tot = sub + tax;
    
    form.setValue("taxAmount", tax.toFixed(2));
    form.setValue("total", tot.toFixed(2));
  }, [subtotal, taxRate, form]);

  const onSubmit = (data: InsertInvoice) => {
    // Convert empty strings to null for optional fields
    const cleanedData = {
      ...data,
      projectId: data.projectId || null,
      customerId: data.customerId || null,
      subcontractorId: data.subcontractorId || null,
      dueDate: data.dueDate || null,
      description: data.description || null,
      notes: data.notes || null,
    };

    // Recalculate to ensure accuracy
    const sub = parseFloat(cleanedData.subtotal as string);
    const rate = parseFloat(cleanedData.taxRate as string);
    const tax = (sub * rate) / 100;
    const total = sub + tax;

    cleanedData.taxAmount = tax.toFixed(2);
    cleanedData.total = total.toFixed(2);

    if (editingInvoice) {
      updateInvoiceMutation.mutate({ id: editingInvoice.id, data: cleanedData });
    } else {
      createInvoiceMutation.mutate(cleanedData);
    }
  };

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    form.reset({
      invoiceNumber: "",
      type: "",
      projectId: null,
      customerId: null,
      subcontractorId: null,
      date: "",
      dueDate: null,
      subtotal: "0",
      taxRate: "20",
      taxAmount: "0",
      total: "0",
      status: "Ödenmedi",
      paidAmount: "0",
      description: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    form.reset({
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      projectId: invoice.projectId || null,
      customerId: invoice.customerId || null,
      subcontractorId: invoice.subcontractorId || null,
      date: invoice.date,
      dueDate: invoice.dueDate || null,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      status: invoice.status,
      paidAmount: invoice.paidAmount || "0",
      description: invoice.description || "",
      notes: invoice.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteInvoice = (id: string) => {
    setDeleteInvoiceId(id);
  };

  const confirmDelete = () => {
    if (deleteInvoiceId) {
      deleteInvoiceMutation.mutate(deleteInvoiceId);
    }
  };

  // Create lookup maps
  const projectMap = new Map(projects.map(p => [p.id, p]));
  const customerMap = new Map(customers.map(c => [c.id, c]));
  const subcontractorMap = new Map(subcontractors.map(s => [s.id, s]));

  // Enrich invoices with related names
  const enrichedInvoices = invoices.map(invoice => ({
    ...invoice,
    projectName: invoice.projectId ? projectMap.get(invoice.projectId)?.name : undefined,
    customerName: invoice.customerId ? customerMap.get(invoice.customerId)?.name : undefined,
    subcontractorName: invoice.subcontractorId ? subcontractorMap.get(invoice.subcontractorId)?.name : undefined,
  }));

  // Filter invoices
  const filteredInvoices = enrichedInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.subcontractorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || invoice.type === selectedType;
    const matchesStatus = selectedStatus === "all" || invoice.status === selectedStatus;
    const matchesProject = selectedProject === "all" || invoice.projectId === selectedProject;
    return matchesSearch && matchesType && matchesStatus && matchesProject;
  });

  const isPending = createInvoiceMutation.isPending || updateInvoiceMutation.isPending;

  // Calculate statistics
  const salesInvoices = invoices.filter(inv => inv.type === "Satış");
  const purchaseInvoices = invoices.filter(inv => inv.type === "Alış");
  const totalSales = salesInvoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
  const totalPurchases = purchaseInvoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
  const unpaidInvoices = invoices.filter(inv => inv.status === "Ödenmedi");

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Ödendi":
        return "default";
      case "Kısmi Ödendi":
        return "secondary";
      case "Ödenmedi":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <PrintHeader documentTitle="FATURALAR LİSTESİ" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faturalar</h1>
          <p className="text-muted-foreground mt-1">Alış ve satış faturaları yönetimi</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportToExcel
            data={filteredInvoices.map((invoice) => ({
              "Fatura No": invoice.invoiceNumber,
              "Tür": invoice.type,
              "Tarih": format(parseISO(invoice.date as string), "dd.MM.yyyy"),
              "Müşteri/Taşeron": invoice.type === "Satış" ? invoice.customerName : invoice.subcontractorName,
              "Proje": invoice.projectName || "-",
              "Tutar": parseFloat(invoice.subtotal),
              "KDV": parseFloat(invoice.taxAmount),
              "Toplam": parseFloat(invoice.total),
              "Ödenen": parseFloat(invoice.paidAmount || "0"),
              "Kalan": parseFloat(invoice.total) - parseFloat(invoice.paidAmount || "0"),
              "Durum": invoice.status,
              "Açıklama": invoice.description || "",
            }))}
            filename="faturalar"
            sheetName="Faturalar"
            documentTitle="FATURALAR LİSTESİ"
          />
          <PrintButton />
          <Button onClick={handleAddInvoice} data-testid="button-add-invoice">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Fatura Ekle
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 no-print">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Fatura numarası, açıklama veya projede ara..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-invoice"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-type-filter">
              <SelectValue placeholder="Fatura türü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Faturalar</SelectItem>
              {invoiceTypeEnum.map((type) => (
                <SelectItem key={type} value={type}>
                  {type} Faturası
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              {invoiceStatusEnum.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-project-filter">
              <SelectValue placeholder="Proje" />
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Satış</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-total-sales">
              {totalSales.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
            </div>
            <p className="text-xs text-muted-foreground">
              {salesInvoices.length} fatura
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Alış</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-total-purchases">
              {totalPurchases.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
            </div>
            <p className="text-xs text-muted-foreground">
              {purchaseInvoices.length} fatura
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ödenmemiş Faturalar</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-unpaid-count">{unpaidInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              Bekleyen ödeme
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fatura Listesi</CardTitle>
          <CardDescription>
            Tüm alış ve satış faturalarınız
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingInvoices ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : invoicesError ? (
            <div className="py-12 text-center text-destructive">
              Veriler yüklenirken bir hata oluştu
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {invoices.length === 0 ? "Henüz fatura eklenmemiş" : "Fatura bulunamadı"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fatura No</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Müşteri/Taşeron</TableHead>
                    <TableHead>Proje</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-right">KDV</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                    <TableHead className="text-right">Ödenen</TableHead>
                    <TableHead className="text-right">Kalan</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.type === "Satış" ? "default" : "secondary"}>
                          {invoice.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(invoice.date as string)}
                      </TableCell>
                      <TableCell>
                        {invoice.type === "Satış" ? invoice.customerName : invoice.subcontractorName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invoice.projectName || "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {parseFloat(invoice.subtotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {parseFloat(invoice.taxAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {parseFloat(invoice.total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                        {parseFloat(invoice.paidAmount || "0").toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </TableCell>
                      <TableCell className="text-right font-mono text-orange-600 dark:text-orange-400">
                        {(parseFloat(invoice.total) - parseFloat(invoice.paidAmount || "0")).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditInvoice(invoice)}
                            data-testid={`button-edit-${invoice.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            data-testid={`button-delete-${invoice.id}`}
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

      {/* Form Dialog - Part 1 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? "Faturayı Düzenle" : "Yeni Fatura"}
            </DialogTitle>
            <DialogDescription>
              Fatura bilgilerini girin. * işaretli alanlar zorunludur.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Invoice Number */}
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fatura Numarası *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="F-2024-001"
                          {...field}
                          data-testid="input-invoice-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fatura Türü *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-invoice-type">
                            <SelectValue placeholder="Tür seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {invoiceTypeEnum.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type} Faturası
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fatura Tarihi *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-invoice-date"
                            >
                              {field.value ? (
                                format(parseISO(field.value as string), "PPP", { locale: tr })
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
                            selected={field.value ? parseISO(field.value) : undefined}
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

                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Vade Tarihi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-due-date"
                            >
                              {field.value ? (
                                format(parseISO(field.value as string), "PPP", { locale: tr })
                              ) : (
                                <span>Vade tarihi seçin</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? parseISO(field.value) : undefined}
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

                {/* Project */}
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proje</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-project">
                            <SelectValue placeholder="Proje seçin (opsiyonel)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Projesiz</SelectItem>
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

                {/* Customer (for Sales Invoice) */}
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Müşteri (Satış Faturası için)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-customer">
                            <SelectValue placeholder="Müşteri seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Seçilmedi</SelectItem>
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

                {/* Subcontractor (for Purchase Invoice) */}
                <FormField
                  control={form.control}
                  name="subcontractorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taşeron (Alış Faturası için)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-subcontractor">
                            <SelectValue placeholder="Taşeron seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Seçilmedi</SelectItem>
                          {subcontractors.map((subcontractor) => (
                            <SelectItem key={subcontractor.id} value={subcontractor.id}>
                              {subcontractor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durum *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Durum seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {invoiceStatusEnum.map((status) => (
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

                {/* Subtotal */}
                <FormField
                  control={form.control}
                  name="subtotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tutar (KDV Hariç) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            // Trigger recalculation
                            const sub = parseFloat(e.target.value) || 0;
                            const rate = parseFloat(form.getValues("taxRate") as string) || 0;
                            const tax = (sub * rate) / 100;
                            const total = sub + tax;
                            form.setValue("taxAmount", tax.toFixed(2));
                            form.setValue("total", total.toFixed(2));
                          }}
                          data-testid="input-subtotal"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tax Rate */}
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>KDV Oranı (%) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="20"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            // Trigger recalculation
                            const sub = parseFloat(form.getValues("subtotal")) || 0;
                            const rate = parseFloat(e.target.value) || 0;
                            const tax = (sub * rate) / 100;
                            const total = sub + tax;
                            form.setValue("taxAmount", tax.toFixed(2));
                            form.setValue("total", total.toFixed(2));
                          }}
                          data-testid="input-tax-rate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tax Amount (readonly) */}
                <FormField
                  control={form.control}
                  name="taxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>KDV Tutarı</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly
                          className="bg-muted"
                          data-testid="input-tax-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Total (readonly) */}
                <FormField
                  control={form.control}
                  name="total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Toplam Tutar (KDV Dahil)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly
                          className="bg-muted font-bold"
                          data-testid="input-total"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Paid Amount */}
                <FormField
                  control={form.control}
                  name="paidAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ödenen Tutar</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value || "0"}
                          data-testid="input-paid-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Fatura açıklaması..."
                        className="min-h-20"
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-description"
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
                  {editingInvoice ? "Güncelle" : "Kaydet"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteInvoiceId} onOpenChange={() => setDeleteInvoiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu faturayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
