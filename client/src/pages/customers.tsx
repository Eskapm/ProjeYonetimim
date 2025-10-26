import { useState } from "react";
import { ContactCard } from "@/components/contact-card";
import { PrintButton } from "@/components/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");

  // TODO: Remove mock data - replace with real data from API
  const mockCustomers = [
    {
      id: "1",
      name: "Yılmaz Holding A.Ş.",
      contactPerson: "Ahmet Yılmaz",
      phone: "+90 216 555 66 77",
      email: "a.yilmaz@yilmazholding.com",
      address: "Ataşehir, İstanbul",
    },
    {
      id: "2",
      name: "Demir Gayrimenkul Ltd.",
      contactPerson: "Zeynep Demir",
      phone: "+90 212 444 33 22",
      email: "zeynep@demirgayrimenkul.com",
      address: "Beşiktaş, İstanbul",
    },
    {
      id: "3",
      name: "Kaya İnşaat ve Emlak",
      contactPerson: "Mehmet Kaya",
      phone: "+90 533 111 22 33",
      email: "mehmet@kayainsaat.com",
      address: "Kadıköy, İstanbul",
    },
  ];

  const filteredCustomers = mockCustomers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Müşteriler</h1>
          <p className="text-muted-foreground mt-1">Müşteri bilgilerini görüntüleyin ve yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button data-testid="button-add-customer">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Müşteri Ekle
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Müşteri adı veya yetkili ile ara..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-customers"
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Müşteri bulunamadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <ContactCard
              key={customer.id}
              {...customer}
              type="customer"
              onEdit={() => console.log('Edit customer', customer.id)}
              onDelete={() => console.log('Delete customer', customer.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
