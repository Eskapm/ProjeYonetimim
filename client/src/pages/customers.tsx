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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema as baseInsertCustomerSchema, type Customer, type ContactPerson } from "@shared/schema";
import { z } from "zod";

const insertCustomerSchema = baseInsertCustomerSchema.extend({
  contactPerson: z.string().optional().transform(val => val || ""),
  phone: z.string().optional().transform(val => val || ""),
  email: z.string().optional().transform(val => val || ""),
  address: z.string().optional().transform(val => val || ""),
});

type InsertCustomer = z.infer<typeof insertCustomerSchema>;
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const { toast } = useToast();

  const { data: customers = [], isLoading, error } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  useEffect(() => {
    if (isDialogOpen && editingCustomer) {
      form.reset({
        name: editingCustomer.name,
        contactPerson: editingCustomer.contactPerson ?? "",
        phone: editingCustomer.phone ?? "",
        email: editingCustomer.email ?? "",
        address: editingCustomer.address ?? "",
      });
      setContacts((editingCustomer.contacts as ContactPerson[]) || []);
    } else if (isDialogOpen && !editingCustomer) {
      form.reset({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
      });
      setContacts([]);
    }
  }, [isDialogOpen, editingCustomer, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      return await apiRequest("POST", "/api/customers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Başarılı",
        description: "Müşteri başarıyla eklendi",
      });
      setIsDialogOpen(false);
      form.reset();
      setContacts([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Müşteri eklenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertCustomer }) => {
      return await apiRequest("PATCH", `/api/customers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Başarılı",
        description: "Müşteri başarıyla güncellendi",
      });
      setIsDialogOpen(false);
      setEditingCustomer(null);
      form.reset();
      setContacts([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Müşteri güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Başarılı",
        description: "Müşteri başarıyla silindi",
      });
      setDeleteCustomerId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Müşteri silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCustomer) => {
    const submitData = {
      ...data,
      contacts: contacts,
    };

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: submitData as InsertCustomer });
    } else {
      createMutation.mutate(submitData as InsertCustomer);
    }
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
    form.reset({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    });
    setContacts([]);
    setIsDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.reset({
      name: customer.name,
      contactPerson: customer.contactPerson ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      address: customer.address ?? "",
    });
    setContacts((customer.contacts as ContactPerson[]) || []);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteCustomerId(id);
  };

  const confirmDelete = () => {
    if (deleteCustomerId) {
      deleteMutation.mutate(deleteCustomerId);
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

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PrintHeader documentTitle="MÜŞTERİLER LİSTESİ" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Müşteriler</h1>
          <p className="text-muted-foreground mt-1">Müşteri bilgilerini görüntüleyin ve yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button onClick={handleAddNew} data-testid="button-add-customer">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Müşteri Ekle
          </Button>
        </div>
      </div>

      <div className="relative no-print">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Müşteri adı veya yetkili ile ara..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-customers"
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full" data-testid={`skeleton-customer-${i}`} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12" data-testid="error-customers">
          <p className="text-destructive">Müşteriler yüklenirken bir hata oluştu</p>
          <p className="text-sm text-muted-foreground mt-2">
            {error instanceof Error ? error.message : "Bilinmeyen hata"}
          </p>
        </div>
      )}

      {!isLoading && !error && filteredCustomers.length === 0 && (
        <div className="text-center py-12" data-testid="empty-customers">
          <p className="text-muted-foreground">
            {searchTerm ? "Müşteri bulunamadı" : "Henüz müşteri eklenmemiş"}
          </p>
          {!searchTerm && (
            <Button onClick={handleAddNew} className="mt-4" data-testid="button-add-first-customer">
              <Plus className="h-4 w-4 mr-2" />
              İlk Müşterinizi Ekleyin
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && filteredCustomers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <ContactCard
              key={customer.id}
              id={customer.id}
              name={customer.name}
              contactPerson={customer.contactPerson ?? undefined}
              phone={customer.phone ?? undefined}
              email={customer.email ?? undefined}
              address={customer.address ?? undefined}
              contacts={(customer.contacts as ContactPerson[]) || []}
              type="customer"
              onEdit={() => handleEdit(customer)}
              onDelete={() => handleDelete(customer.id)}
            />
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingCustomer(null);
          form.reset();
          setContacts([]);
        }
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" data-testid="dialog-customer-form">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Müşteri Düzenle" : "Yeni Müşteri Ekle"}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? "Müşteri bilgilerini güncelleyin."
                : "Yeni müşteri bilgilerini girin."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firma Adı *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Örn: Yılmaz Holding A.Ş."
                        {...field}
                        data-testid="input-customer-name"
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
                        placeholder="Örn: Ataşehir, İstanbul"
                        {...field}
                        data-testid="input-customer-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          data-testid="input-customer-phone"
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
                          data-testid="input-customer-email"
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
                              placeholder="Örn: Ahmet Yılmaz"
                              value={contact.name}
                              onChange={(e) => updateContact(index, "name", e.target.value)}
                              data-testid={`input-contact-name-${index}`}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Ünvan</label>
                            <Input
                              placeholder="Örn: Genel Müdür"
                              value={contact.title || ""}
                              onChange={(e) => updateContact(index, "title", e.target.value)}
                              data-testid={`input-contact-title-${index}`}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Telefon</label>
                            <Input
                              placeholder="Örn: +90 532 555 66 77"
                              value={contact.phone || ""}
                              onChange={(e) => updateContact(index, "phone", e.target.value)}
                              data-testid={`input-contact-phone-${index}`}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">E-posta</label>
                            <Input
                              type="email"
                              placeholder="Örn: ahmet@firma.com"
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
                    setIsDialogOpen(false);
                    setEditingCustomer(null);
                    form.reset();
                    setContacts([]);
                  }}
                  data-testid="button-cancel-customer"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-customer"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Kaydediliyor..."
                    : editingCustomer
                    ? "Güncelle"
                    : "Kaydet"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCustomerId} onOpenChange={(open) => !open && setDeleteCustomerId(null)}>
        <AlertDialogContent data-testid="dialog-delete-customer">
          <AlertDialogHeader>
            <AlertDialogTitle>Müşteriyi silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Müşteri kalıcı olarak silinecektir.
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
