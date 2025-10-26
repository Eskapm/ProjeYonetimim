import { useState } from "react";
import { TransactionTable } from "@/components/transaction-table";
import { TaxSummaryPanel } from "@/components/tax-summary-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Calculator } from "lucide-react";
import { calculateTaxSummary } from "@shared/taxCalculations";

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");

  // TODO: Remove mock data - replace with real data from API
  const mockProjects = [
    { id: "1", name: "Ataşehir Konut Projesi" },
    { id: "2", name: "Beykoz Villa İnşaatı" },
    { id: "3", name: "Maltepe Ofis Binası" },
  ];

  const mockTransactions = [
    {
      id: "1",
      date: "15.01.2024",
      projectName: "Ataşehir Konut Projesi",
      type: "Gider" as const,
      amount: 125000,
      isGrubu: "Kaba İmalat",
      rayicGrubu: "Malzeme",
      description: "Beton ve demir malzeme alımı",
    },
    {
      id: "2",
      date: "18.01.2024",
      projectName: "Beykoz Villa İnşaatı",
      type: "Gelir" as const,
      amount: 500000,
      isGrubu: "Genel Giderler ve Endirekt Giderler",
      rayicGrubu: "Paket",
      description: "Müşteri ilk hakediş ödemesi",
    },
    {
      id: "3",
      date: "22.01.2024",
      projectName: "Ataşehir Konut Projesi",
      type: "Gider" as const,
      amount: 85000,
      isGrubu: "Kaba İmalat",
      rayicGrubu: "İşçilik",
      description: "İşçi maaşları - Ocak ayı",
    },
    {
      id: "4",
      date: "25.01.2024",
      projectName: "Maltepe Ofis Binası",
      type: "Gelir" as const,
      amount: 750000,
      isGrubu: "Genel Giderler ve Endirekt Giderler",
      rayicGrubu: "Paket",
      description: "Hakediş ödemesi",
    },
    {
      id: "5",
      date: "28.01.2024",
      projectName: "Beykoz Villa İnşaatı",
      type: "Gider" as const,
      amount: 95000,
      isGrubu: "İnce İmalat",
      rayicGrubu: "Malzeme",
      description: "Fayans ve sıva malzemeleri",
    },
    {
      id: "6",
      date: "30.01.2024",
      projectName: "Ataşehir Konut Projesi",
      type: "Gelir" as const,
      amount: 1200000,
      isGrubu: "Genel Giderler ve Endirekt Giderler",
      rayicGrubu: "Paket",
      description: "Müşteri ikinci hakediş ödemesi",
    },
  ];

  const filteredTransactions = mockTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesProject =
      selectedProject === "all" || transaction.projectName === selectedProject;
    return matchesSearch && matchesType && matchesProject;
  });

  // Calculate tax summary
  const incomes = mockTransactions
    .filter((t) => t.type === "Gelir")
    .map((t) => ({ amount: t.amount, hasKDV: true }));

  const expenses = mockTransactions
    .filter((t) => t.type === "Gider")
    .map((t) => ({ amount: t.amount, hasKDV: true }));

  const taxSummary = calculateTaxSummary(incomes, expenses, true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gelir & Gider İşlemleri</h1>
          <p className="text-muted-foreground mt-1">
            Tüm finansal işlemleri ve vergi hesaplamalarını görüntüleyin
          </p>
        </div>
        <Button data-testid="button-add-transaction">
          <Plus className="h-4 w-4 mr-2" />
          Yeni İşlem Ekle
        </Button>
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
                {mockProjects.map((project) => (
                  <SelectItem key={project.id} value={project.name}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>İşlem Kayıtları</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable
                transactions={filteredTransactions}
                onEdit={(id) => console.log('Edit transaction', id)}
                onDelete={(id) => console.log('Delete transaction', id)}
              />
            </CardContent>
          </Card>
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
    </div>
  );
}
