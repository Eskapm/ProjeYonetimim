import { useState } from "react";
import { ContactCard } from "@/components/contact-card";
import { PrintButton } from "@/components/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export default function Subcontractors() {
  const [searchTerm, setSearchTerm] = useState("");

  // TODO: Remove mock data - replace with real data from API
  const mockSubcontractors = [
    {
      id: "1",
      name: "Aydın İnşaat Ltd. Şti.",
      contactPerson: "Mehmet Aydın",
      phone: "+90 532 123 45 67",
      email: "mehmet@aydininsaat.com",
      address: "Kadıköy, İstanbul",
      specialty: "Kaba İmalat",
    },
    {
      id: "2",
      name: "Elektrik Sistemleri A.Ş.",
      contactPerson: "Can Demir",
      phone: "+90 541 789 01 23",
      email: "can@elektriksistem.com",
      address: "Beykoz, İstanbul",
      specialty: "Elektrik Tesisat",
    },
    {
      id: "3",
      name: "Peyzaj Tasarım Ltd.",
      contactPerson: "Ayşe Kaya",
      phone: "+90 555 234 56 78",
      email: "ayse@peyzajtasarim.com",
      address: "Ataşehir, İstanbul",
      specialty: "Çevre Düzenlemesi ve Altyapı",
    },
    {
      id: "4",
      name: "Mekanik Tesisat A.Ş.",
      contactPerson: "Ahmet Yıldız",
      phone: "+90 536 567 89 01",
      email: "ahmet@mekaniktesisat.com",
      address: "Maltepe, İstanbul",
      specialty: "Mekanik Tesisat",
    },
  ];

  const filteredSubcontractors = mockSubcontractors.filter((sub) =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Taşeronlar</h1>
          <p className="text-muted-foreground mt-1">Taşeron firma bilgilerini görüntüleyin ve yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button data-testid="button-add-subcontractor">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Taşeron Ekle
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Firma adı, yetkili veya uzmanlık alanı ile ara..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-subcontractors"
        />
      </div>

      {filteredSubcontractors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Taşeron bulunamadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubcontractors.map((sub) => (
            <ContactCard
              key={sub.id}
              {...sub}
              type="subcontractor"
              onEdit={() => console.log('Edit subcontractor', sub.id)}
              onDelete={() => console.log('Delete subcontractor', sub.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
