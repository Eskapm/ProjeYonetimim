import { StatsCard } from "@/components/stats-card";
import { ProjectCard } from "@/components/project-card";
import { TransactionTable } from "@/components/transaction-table";
import { PrintButton } from "@/components/print-button";
import { FolderKanban, TrendingUp, TrendingDown, DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  // TODO: Remove mock data - replace with real data from API
  const mockProjects = [
    {
      id: "1",
      name: "Ataşehir Konut Projesi",
      location: "İstanbul, Ataşehir",
      area: "2,500",
      startDate: "01.01.2024",
      endDate: "31.12.2024",
      status: "Devam Ediyor",
      costPerSqm: "₺4,250",
    },
    {
      id: "2",
      name: "Beykoz Villa İnşaatı",
      location: "İstanbul, Beykoz",
      area: "850",
      startDate: "15.03.2024",
      endDate: "15.09.2024",
      status: "Planlama",
      costPerSqm: "₺6,800",
    },
    {
      id: "3",
      name: "Maltepe Ofis Binası",
      location: "İstanbul, Maltepe",
      area: "3,200",
      startDate: "01.06.2023",
      endDate: "30.11.2023",
      status: "Tamamlandı",
      costPerSqm: "₺5,150",
    },
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
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ana Sayfa</h1>
          <p className="text-muted-foreground mt-1">Proje genel görünümü ve özet bilgiler</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button data-testid="button-new-project">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Proje
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Toplam Proje"
          value="12"
          icon={FolderKanban}
          description="Aktif: 8, Tamamlanan: 4"
        />
        <StatsCard
          title="Toplam Gelir"
          value="₺2,450,000"
          icon={TrendingUp}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Toplam Gider"
          value="₺1,850,000"
          icon={TrendingDown}
          trend={{ value: 8.2, isPositive: false }}
        />
        <StatsCard
          title="Net Kar"
          value="₺600,000"
          icon={DollarSign}
          description="Bu ay"
        />
      </div>

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList>
          <TabsTrigger value="projects" data-testid="tab-projects">Aktif Projeler</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">Son İşlemler</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aktif Projeler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    {...project}
                    onView={() => console.log('View project', project.id)}
                    onEdit={() => console.log('Edit project', project.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Son İşlemler</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable
                transactions={mockTransactions}
                onEdit={(id) => console.log('Edit transaction', id)}
                onDelete={(id) => console.log('Delete transaction', id)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
