import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ContactCard } from "@/components/contact-card";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSubcontractorSchema, type Subcontractor, type InsertSubcontractor } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";

const formSchema = insertSubcontractorSchema.extend({
  name: z.string().min(1, "Firma adı zorunludur"),
});

type FormData = z.infer<typeof formSchema>;

function SubcontractorFormDialog({
  open,
  onOpenChange,
  subcontractor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subcontractor?: Subcontractor;
}) {
  const { toast } = useToast();
  const isEditing = !!subcontractor;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: subcontractor?.name || "",
      contactPerson: subcontractor?.contactPerson || "",
      phone: subcontractor?.phone || "",
      email: subcontractor?.email || "",
      specialty: subcontractor?.specialty || "",
      address: subcontractor?.address || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSubcontractor) => {
      return await apiRequest("POST", "/api/subcontractors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcontractors"] });
      toast({
        title: "Başarılı",
        description: "Taşeron başarıyla eklendi",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Taşeron eklenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertSubcontractor>) => {
      return await apiRequest("PATCH", `/api/subcontractors/${subcontractor?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcontractors"] });
      toast({
        title: "Başarılı",
        description: "Taşeron başarıyla güncellendi",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Taşeron güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Taşeron Düzenle" : "Yeni Taşeron Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Taşeron bilgilerini güncelleyin"
              : "Yeni taşeron firma bilgilerini girin"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Firma Adı <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Örn: Aydın İnşaat Ltd. Şti."
                        {...field}
                        data-testid="input-subcontractor-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yetkili Kişi</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Örn: Mehmet Aydın"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-subcontractor-contact"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Örn: +90 532 123 45 67"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-subcontractor-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Örn: info@firma.com"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-subcontractor-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uzmanlık Alanı</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Örn: Kaba İmalat, Elektrik"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-subcontractor-specialty"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adres</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Örn: Kadıköy, İstanbul"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-subcontractor-address"
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
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel-subcontractor"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-save-subcontractor"
              >
                {isPending ? "Kaydediliyor..." : isEditing ? "Güncelle" : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Subcontractors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: subcontractors = [], isLoading, error } = useQuery<Subcontractor[]>({
    queryKey: ["/api/subcontractors"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/subcontractors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcontractors"] });
      toast({
        title: "Başarılı",
        description: "Taşeron başarıyla silindi",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Taşeron silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (subcontractor: Subcontractor) => {
    setEditingSubcontractor(subcontractor);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const handleAddNew = () => {
    setEditingSubcontractor(undefined);
    setIsFormOpen(true);
  };

  const filteredSubcontractors = subcontractors.filter((sub) =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PrintHeader documentTitle="TAŞERONLAR LİSTESİ" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Taşeronlar</h1>
          <p className="text-muted-foreground mt-1">Taşeron firma bilgilerini görüntüleyin ve yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button onClick={handleAddNew} data-testid="button-add-subcontractor">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Taşeron Ekle
          </Button>
        </div>
      </div>

      <div className="relative no-print">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Firma adı, yetkili veya uzmanlık alanı ile ara..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-subcontractors"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-4 p-6 rounded-lg border">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12" data-testid="error-state">
          <p className="text-destructive">
            Taşeronlar yüklenirken bir hata oluştu
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {error instanceof Error ? error.message : "Lütfen daha sonra tekrar deneyin"}
          </p>
        </div>
      ) : filteredSubcontractors.length === 0 ? (
        <div className="text-center py-12" data-testid="empty-state">
          <p className="text-muted-foreground">
            {searchTerm
              ? "Arama kriterlerine uygun taşeron bulunamadı"
              : "Henüz taşeron eklenmemiş"}
          </p>
          {!searchTerm && (
            <Button
              onClick={handleAddNew}
              className="mt-4"
              data-testid="button-add-first-subcontractor"
            >
              <Plus className="h-4 w-4 mr-2" />
              İlk Taşeronu Ekle
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubcontractors.map((sub) => (
            <ContactCard
              key={sub.id}
              id={sub.id}
              name={sub.name}
              contactPerson={sub.contactPerson || undefined}
              phone={sub.phone || undefined}
              email={sub.email || undefined}
              address={sub.address || undefined}
              specialty={sub.specialty || undefined}
              type="subcontractor"
              onEdit={() => handleEdit(sub)}
              onDelete={() => handleDelete(sub.id)}
            />
          ))}
        </div>
      )}

      <SubcontractorFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        subcontractor={editingSubcontractor}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Taşeronu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu taşeronu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
