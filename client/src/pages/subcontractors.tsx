import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ContactCard } from "@/components/contact-card";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, UserPlus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSubcontractorSchema, type Subcontractor, type InsertSubcontractor, type ContactPerson } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";

const formSchema = insertSubcontractorSchema.extend({
  name: z.string().min(1, "Firma adı zorunludur"),
  type: z.string().optional().transform(val => val || "Taşeron"),
});

type FormData = z.infer<typeof formSchema>;

function SubcontractorFormDialog({
  open,
  onOpenChange,
  subcontractor,
  contacts,
  setContacts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subcontractor?: Subcontractor;
  contacts: ContactPerson[];
  setContacts: (contacts: ContactPerson[]) => void;
}) {
  const { toast } = useToast();
  const isEditing = !!subcontractor;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      specialty: "",
      address: "",
      type: "Taşeron",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: subcontractor?.name || "",
        contactPerson: subcontractor?.contactPerson || "",
        phone: subcontractor?.phone || "",
        email: subcontractor?.email || "",
        specialty: subcontractor?.specialty || "",
        address: subcontractor?.address || "",
        type: subcontractor?.type || "Taşeron",
      });
    }
  }, [open, subcontractor, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertSubcontractor) => {
      return await apiRequest("POST", "/api/subcontractors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcontractors"] });
      toast({
        title: "Başarılı",
        description: "Kayıt başarıyla eklendi",
      });
      onOpenChange(false);
      form.reset();
      setContacts([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Kayıt eklenirken bir hata oluştu",
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
        description: "Kayıt başarıyla güncellendi",
      });
      onOpenChange(false);
      setContacts([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Kayıt güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const submitData = {
      ...data,
      contacts: contacts,
    };

    if (isEditing) {
      updateMutation.mutate(submitData as Partial<InsertSubcontractor>);
    } else {
      createMutation.mutate(submitData as InsertSubcontractor);
    }
  };

  const addContact = () => {
    setContacts([...contacts, { name: "", phone: "", email: "", title: "" }]);
  };

  const updateContact = (index: number, field: keyof ContactPerson, value: string) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setContacts(newContacts);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Kayıt Düzenle" : "Yeni Taşeron/Tedarikçi Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Kayıt bilgilerini güncelleyin"
              : "Yeni taşeron veya tedarikçi firma bilgilerini girin"}
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tür</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "Taşeron"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-subcontractor-type">
                          <SelectValue placeholder="Tür seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Taşeron">Taşeron</SelectItem>
                        <SelectItem value="Tedarikçi">Tedarikçi</SelectItem>
                      </SelectContent>
                    </Select>
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

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firma Telefonu</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Örn: +90 216 555 66 77"
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
                    <FormLabel>Firma E-posta</FormLabel>
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
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">İletişim Kişileri</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addContact}
                    data-testid="button-add-contact"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Kişi Ekle
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Henüz iletişim kişisi eklenmemiş. Yukarıdaki butona tıklayarak ekleyebilirsiniz.
                  </p>
                ) : (
                  contacts.map((contact, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Kişi {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeContact(index)}
                          data-testid={`button-remove-contact-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Ad Soyad *</label>
                          <Input
                            placeholder="Örn: Mehmet Aydın"
                            value={contact.name}
                            onChange={(e) => updateContact(index, "name", e.target.value)}
                            data-testid={`input-contact-name-${index}`}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Ünvan</label>
                          <Input
                            placeholder="Örn: Proje Müdürü"
                            value={contact.title || ""}
                            onChange={(e) => updateContact(index, "title", e.target.value)}
                            data-testid={`input-contact-title-${index}`}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Telefon</label>
                          <Input
                            placeholder="Örn: +90 532 123 45 67"
                            value={contact.phone || ""}
                            onChange={(e) => updateContact(index, "phone", e.target.value)}
                            data-testid={`input-contact-phone-${index}`}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">E-posta</label>
                          <Input
                            type="email"
                            placeholder="Örn: mehmet@firma.com"
                            value={contact.email || ""}
                            onChange={(e) => updateContact(index, "email", e.target.value)}
                            data-testid={`input-contact-email-${index}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setContacts([]);
                }}
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
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
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
        description: "Kayıt başarıyla silindi",
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Kayıt silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (subcontractor: Subcontractor) => {
    setEditingSubcontractor(subcontractor);
    setContacts((subcontractor.contacts as ContactPerson[]) || []);
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
    setContacts([]);
    setIsFormOpen(true);
  };

  const filteredSubcontractors = subcontractors
    .filter((sub) => {
      const matchesSearch =
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeTab === "all") return matchesSearch;
      return matchesSearch && sub.type === activeTab;
    });

  const taserronCount = subcontractors.filter((s) => s.type === "Taşeron" || !s.type).length;
  const tedarikciCount = subcontractors.filter((s) => s.type === "Tedarikçi").length;

  return (
    <div className="space-y-6">
      <PrintHeader documentTitle="TAŞERON VE TEDARİKÇİ LİSTESİ" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Taşeron ve Tedarikçi</h1>
          <p className="text-muted-foreground mt-1">Taşeron ve tedarikçi firma bilgilerini görüntüleyin ve yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button onClick={handleAddNew} data-testid="button-add-subcontractor">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ekle
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="no-print">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            Tümü ({subcontractors.length})
          </TabsTrigger>
          <TabsTrigger value="Taşeron" data-testid="tab-taseron">
            Taşeron ({taserronCount})
          </TabsTrigger>
          <TabsTrigger value="Tedarikçi" data-testid="tab-tedarikci">
            Tedarikçi ({tedarikciCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

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
            Veriler yüklenirken bir hata oluştu
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {error instanceof Error ? error.message : "Lütfen daha sonra tekrar deneyin"}
          </p>
        </div>
      ) : filteredSubcontractors.length === 0 ? (
        <div className="text-center py-12" data-testid="empty-state">
          <p className="text-muted-foreground">
            {searchTerm
              ? "Arama kriterlerine uygun kayıt bulunamadı"
              : "Henüz kayıt eklenmemiş"}
          </p>
          {!searchTerm && (
            <Button
              onClick={handleAddNew}
              className="mt-4"
              data-testid="button-add-first-subcontractor"
            >
              <Plus className="h-4 w-4 mr-2" />
              İlk Kaydı Ekle
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
              supplierType={sub.type || "Taşeron"}
              contacts={(sub.contacts as ContactPerson[]) || []}
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
        contacts={contacts}
        setContacts={setContacts}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kaydı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kaydı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
