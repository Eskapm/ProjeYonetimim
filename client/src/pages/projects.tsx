import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ProjectCard } from "@/components/project-card";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, type InsertProject, type Project, type Customer, projectStatusEnum } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch projects
  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch customers for the form
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Başarılı",
        description: "Proje başarıyla oluşturuldu",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Proje oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProject> }) => {
      const response = await apiRequest("PATCH", `/api/projects/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Başarılı",
        description: "Proje başarıyla güncellendi",
      });
      setIsDialogOpen(false);
      setEditingProject(null);
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

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Başarılı",
        description: "Proje başarıyla silindi",
      });
      setDeleteProjectId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Proje silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      location: "",
      area: "",
      startDate: "",
      endDate: "",
      status: "Planlama",
      description: "",
      notes: "",
      customerId: undefined,
    },
  });

  const onSubmit = (data: InsertProject) => {
    // Convert empty strings to null for optional fields
    const cleanedData = {
      ...data,
      location: data.location || null,
      area: data.area || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      description: data.description || null,
      notes: data.notes || null,
      // Explicitly convert empty string or undefined to null
      customerId: (data.customerId === "" || !data.customerId) ? null : data.customerId,
    };

    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data: cleanedData });
    } else {
      createProjectMutation.mutate(cleanedData);
    }
  };

  const handleAddProject = () => {
    console.log("Yeni Proje Ekle butonuna tıklandı");
    setEditingProject(null);
    form.reset({
      name: "",
      location: "",
      area: "",
      startDate: "",
      endDate: "",
      status: "Planlama",
      description: "",
      notes: "",
      customerId: "",
    });
    setIsDialogOpen(true);
    console.log("Dialog açıldı, isDialogOpen:", true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    form.reset({
      name: project.name,
      location: project.location ?? "",
      area: project.area ?? "",
      startDate: project.startDate ?? "",
      endDate: project.endDate ?? "",
      status: project.status,
      description: project.description ?? "",
      notes: project.notes ?? "",
      customerId: project.customerId ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProject = (id: string) => {
    setDeleteProjectId(id);
  };

  const confirmDelete = () => {
    if (deleteProjectId) {
      deleteProjectMutation.mutate(deleteProjectId);
    }
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate cost per sqm for display
  const getProjectWithCostPerSqm = (project: Project) => {
    // This is a placeholder - in a real app, you'd calculate this from transactions
    return {
      ...project,
      costPerSqm: "₺0",
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projeler</h1>
          <p className="text-muted-foreground mt-1">Tüm projelerinizi görüntüleyin ve yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button onClick={handleAddProject} data-testid="button-add-project">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Proje Ekle
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Proje adı veya konum ile ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-projects"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-status-filter">
            <SelectValue placeholder="Durum filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            {projectStatusEnum.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error state */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive">Projeler yüklenirken bir hata oluştu</p>
          <p className="text-muted-foreground text-sm mt-2">{error.message}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {searchTerm || statusFilter !== "all" 
              ? "Proje bulunamadı" 
              : "Henüz proje eklenmemiş"}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Button onClick={handleAddProject} className="mt-4" data-testid="button-add-first-project">
              <Plus className="h-4 w-4 mr-2" />
              İlk Projeyi Ekle
            </Button>
          )}
        </div>
      )}

      {/* Projects grid */}
      {!isLoading && !error && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const projectWithCost = getProjectWithCostPerSqm(project);
            return (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                location={project.location || undefined}
                area={project.area || undefined}
                startDate={project.startDate || undefined}
                endDate={project.endDate || undefined}
                status={project.status}
                costPerSqm={projectWithCost.costPerSqm}
                onEdit={() => handleEditProject(project)}
                onDelete={() => handleDeleteProject(project.id)}
              />
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Proje Düzenle" : "Yeni Proje Ekle"}
            </DialogTitle>
            <DialogDescription>
              {editingProject 
                ? "Proje bilgilerini güncelleyin" 
                : "Yeni bir proje oluşturmak için aşağıdaki bilgileri doldurun"}
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
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-project-customer">
                            <SelectValue placeholder="Müşteri seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Müşteri yok</SelectItem>
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
                    setIsDialogOpen(false);
                    setEditingProject(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-project"
                >
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                  data-testid="button-save-project"
                >
                  {(createProjectMutation.isPending || updateProjectMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingProject ? "Güncelle" : "Oluştur"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Projeyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu projeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteProjectMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteProjectMutation.isPending && (
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
