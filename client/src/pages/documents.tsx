import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useProjectContext } from "@/hooks/use-project-context";
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
import { Plus, Search, Edit, Trash2, FileIcon, Loader2, Download, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertDocumentSchema,
  type InsertDocument,
  type Document,
  type Project,
  documentCategoryEnum,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Documents() {
  const { activeProjectId, setActiveProjectId } = useProjectContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Local state synced with global context for immediate UI updates
  const [projectFilter, setProjectFilterLocal] = useState<string>(activeProjectId || "all");
  
  // Sync from context to local state
  useEffect(() => {
    setProjectFilterLocal(activeProjectId || "all");
  }, [activeProjectId]);
  
  // Update both local state and context when user changes selection
  const setProjectFilter = (id: string) => {
    setProjectFilterLocal(id);
    setActiveProjectId(id === "all" ? null : id);
  };
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: documents = [], isLoading: isLoadingDocs } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const form = useForm<InsertDocument>({
    resolver: zodResolver(insertDocumentSchema),
    defaultValues: {
      projectId: "",
      name: "",
      category: "Diğer",
      fileUrl: "",
      fileType: "",
      description: "",
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: InsertDocument) => {
      const response = await apiRequest("POST", "/api/documents", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Başarılı",
        description: "Döküman başarıyla eklendi",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Döküman eklenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertDocument> }) => {
      const response = await apiRequest("PATCH", `/api/documents/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Başarılı",
        description: "Döküman başarıyla güncellendi",
      });
      setIsDialogOpen(false);
      setEditingDocument(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Döküman güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Başarılı",
        description: "Döküman başarıyla silindi",
      });
      setDeleteDocumentId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Döküman silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const project = projects.find(p => p.id === doc.projectId);
      const projectName = project?.name || "";
      
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
      const matchesProject = projectFilter === "all" || doc.projectId === projectFilter;
      
      return matchesSearch && matchesCategory && matchesProject;
    });
  }, [documents, projects, searchTerm, categoryFilter, projectFilter]);

  const handleAddDocument = () => {
    setEditingDocument(null);
    form.reset({
      projectId: "",
      name: "",
      category: "Diğer",
      fileUrl: "",
      fileType: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
    form.reset({
      projectId: doc.projectId,
      name: doc.name,
      category: doc.category,
      fileUrl: doc.fileUrl,
      fileType: doc.fileType || "",
      description: doc.description || "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: InsertDocument) => {
    if (editingDocument) {
      updateDocumentMutation.mutate({ id: editingDocument.id, data });
    } else {
      createDocumentMutation.mutate(data);
    }
  };

  const confirmDelete = () => {
    if (deleteDocumentId) {
      deleteDocumentMutation.mutate(deleteDocumentId);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "Sözleşme": return "default";
      case "Proje": return "secondary";
      case "Hakediş": return "outline";
      case "Fatura": return "outline";
      case "Teknik Çizim": return "secondary";
      case "Fotoğraf": return "outline";
      case "Rapor": return "default";
      default: return "outline";
    }
  };

  const totalDocuments = filteredDocuments.length;
  const contractDocs = filteredDocuments.filter(d => d.category === "Sözleşme").length;
  const projectDocs = filteredDocuments.filter(d => d.category === "Proje").length;

  if (isLoadingDocs) {
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
          <h1 className="text-3xl font-bold">Döküman Yönetimi</h1>
          <p className="text-muted-foreground">Proje dökümanlarını yönetin</p>
        </div>
        <Button onClick={handleAddDocument} data-testid="button-add-document">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Döküman
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Döküman</CardTitle>
            <FileIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sözleşmeler</CardTitle>
            <FileIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{contractDocs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proje Dökümanları</CardTitle>
            <FileIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{projectDocs}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Döküman adı veya açıklama ile ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-documents"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-category-filter">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {documentCategoryEnum.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Döküman Adı</TableHead>
              <TableHead>Proje</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Boyut</TableHead>
              <TableHead>Eklenme Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Döküman bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => {
                const project = projects.find(p => p.id === doc.projectId);
                return (
                  <TableRow key={doc.id} data-testid={`row-document-${doc.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                        {doc.name}
                      </div>
                    </TableCell>
                    <TableCell>{project?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getCategoryBadgeVariant(doc.category)}>
                        {doc.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{doc.fileType || "-"}</TableCell>
                    <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                    <TableCell>{formatDate(doc.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {doc.fileUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(doc.fileUrl, '_blank')}
                            data-testid={`button-open-doc-${doc.id}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditDocument(doc)}
                          data-testid={`button-edit-doc-${doc.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDocumentId(doc.id)}
                          data-testid={`button-delete-doc-${doc.id}`}
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
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDocument ? "Döküman Düzenle" : "Yeni Döküman Ekle"}
            </DialogTitle>
            <DialogDescription>
              {editingDocument
                ? "Döküman bilgilerini güncelleyin"
                : "Yeni bir döküman eklemek için bilgileri doldurun"}
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
                          <SelectTrigger data-testid="select-doc-project">
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-doc-category">
                            <SelectValue placeholder="Kategori seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {documentCategoryEnum.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
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
                    <FormItem className="md:col-span-2">
                      <FormLabel>Döküman Adı *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Döküman adı"
                          data-testid="input-doc-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Dosya URL *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://..."
                          data-testid="input-doc-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fileType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosya Türü</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Örn: PDF, DOC, JPG"
                          data-testid="input-doc-type"
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
                          placeholder="Döküman açıklaması..."
                          rows={3}
                          data-testid="input-doc-description"
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
                    setEditingDocument(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-doc"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={createDocumentMutation.isPending || updateDocumentMutation.isPending}
                  data-testid="button-save-doc"
                >
                  {(createDocumentMutation.isPending || updateDocumentMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingDocument ? "Güncelle" : "Ekle"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDocumentId} onOpenChange={(open) => !open && setDeleteDocumentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dökümanı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu dökümanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-doc">İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteDocumentMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-doc"
            >
              {deleteDocumentMutation.isPending && (
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
