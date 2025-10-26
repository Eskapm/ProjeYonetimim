import { useState } from "react";
import { useRoute } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintButton } from "@/components/print-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BudgetTable } from "@/components/budget-table";
import { TaskList } from "@/components/task-list";
import { TimesheetTable } from "@/components/timesheet-table";
import { SiteDiaryCard } from "@/components/site-diary-card";
import { Edit, MapPin, Calendar, Ruler, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function ProjectDetail() {
  const [, params] = useRoute("/projeler/:id");
  const projectId = params?.id;

  // TODO: Remove mock data - fetch from API using projectId
  const mockProject = {
    id: "1",
    name: "Ataşehir Konut Projesi",
    location: "İstanbul, Ataşehir",
    area: "2,500",
    startDate: "01.01.2024",
    endDate: "31.12.2024",
    status: "Devam Ediyor",
    description: "2500 m² inşaat alanında 3 blok konut projesi",
    notes: "Müşteri ile haftalık toplantılar yapılıyor",
  };

  const mockBudgetItems = [
    {
      id: "1",
      name: "Beton C30",
      quantity: 250,
      unit: "m³",
      unitPrice: 850,
      isGrubu: "Kaba İmalat",
      rayicGrubu: "Malzeme",
    },
    {
      id: "2",
      name: "İnşaat Demiri",
      quantity: 15000,
      unit: "kg",
      unitPrice: 18.5,
      isGrubu: "Kaba İmalat",
      rayicGrubu: "Malzeme",
    },
  ];

  const mockTasks = [
    {
      id: "1",
      name: "Temel kazısı ve beton dökümü",
      startDate: "01.02.2024",
      endDate: "15.02.2024",
      status: "Tamamlandı",
      responsible: "Mehmet Aydın",
      notes: "Hava şartları nedeniyle 2 gün gecikme yaşandı",
    },
    {
      id: "2",
      name: "Kolon ve kiriş imalatı",
      startDate: "16.02.2024",
      endDate: "10.03.2024",
      status: "Devam Ediyor",
      responsible: "Ali Yılmaz",
    },
  ];

  const mockTimesheets = [
    {
      id: "1",
      date: "26.10.2024",
      isGrubu: "Kaba İmalat",
      workerCount: 15,
      hours: 8,
      notes: "Temel kazısı",
    },
    {
      id: "2",
      date: "26.10.2024",
      isGrubu: "İnce İmalat",
      workerCount: 8,
      hours: 9,
      notes: "Kalıp işleri",
    },
  ];

  const mockDiaryEntries = [
    {
      id: "1",
      date: "26.10.2024",
      weather: "Bulutlu",
      workDone: "Temel kazısı tamamlandı.\n2. kat kolon kalıpları yerleştirildi.\nBeton dökümü için hazırlık yapıldı.",
      materialsUsed: "Beton C30: 45m³\nİnşaat Demiri: 2.5 ton\nKalıp malzemesi",
      totalWorkers: 28,
      issues: "Beton mikserinde küçük bir arıza oluştu, 2 saat gecikme yaşandı.",
      notes: "Yarın hava durumu uygunsa beton dökümü yapılacak.",
    },
  ];

  const statusColors: Record<string, string> = {
    "Planlama": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    "Devam Ediyor": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    "Tamamlandı": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    "Askıda": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projeler">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{mockProject.name}</h1>
            <Badge className={statusColors[mockProject.status] || ""}>
              {mockProject.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">Proje detayları ve ilerleme takibi</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button data-testid="button-edit-project">
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proje Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProject.location && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Konum</span>
                </div>
                <p className="font-medium">{mockProject.location}</p>
              </div>
            )}
            {mockProject.area && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Ruler className="h-4 w-4" />
                  <span>Alan</span>
                </div>
                <p className="font-medium">{mockProject.area} m²</p>
              </div>
            )}
            {(mockProject.startDate || mockProject.endDate) && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Tarih Aralığı</span>
                </div>
                <p className="font-medium">
                  {mockProject.startDate} - {mockProject.endDate}
                </p>
              </div>
            )}
          </div>
          {mockProject.description && (
            <div className="mt-6 space-y-1">
              <p className="text-sm text-muted-foreground">Açıklama</p>
              <p className="font-medium">{mockProject.description}</p>
            </div>
          )}
          {mockProject.notes && (
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Notlar</p>
              <p className="text-sm">{mockProject.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="budget" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="budget" data-testid="tab-budget">
            Bütçe
          </TabsTrigger>
          <TabsTrigger value="schedule" data-testid="tab-schedule">
            İş Programı
          </TabsTrigger>
          <TabsTrigger value="timesheet" data-testid="tab-timesheet-detail">
            Puantaj
          </TabsTrigger>
          <TabsTrigger value="diary" data-testid="tab-diary-detail">
            Şantiye Defteri
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bütçe Kalemleri</CardTitle>
                <Button size="sm" data-testid="button-add-budget-item">
                  Kalem Ekle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <BudgetTable
                items={mockBudgetItems}
                onEdit={(id) => console.log('Edit budget', id)}
                onDelete={(id) => console.log('Delete budget', id)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">İş Programı Görevleri</h2>
              <Button size="sm" data-testid="button-add-task">
                Görev Ekle
              </Button>
            </div>
            <TaskList
              tasks={mockTasks}
              onEdit={(id) => console.log('Edit task', id)}
              onDelete={(id) => console.log('Delete task', id)}
            />
          </div>
        </TabsContent>

        <TabsContent value="timesheet">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Günlük Puantaj Kayıtları</CardTitle>
                <Button size="sm" data-testid="button-add-timesheet">
                  Puantaj Ekle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TimesheetTable
                entries={mockTimesheets}
                onEdit={(id) => console.log('Edit timesheet', id)}
                onDelete={(id) => console.log('Delete timesheet', id)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diary">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Günlük Şantiye Raporları</h2>
              <Button size="sm" data-testid="button-add-site-diary">
                Rapor Ekle
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockDiaryEntries.map((entry) => (
                <SiteDiaryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={() => console.log('Edit diary', entry.id)}
                  onDelete={() => console.log('Delete diary', entry.id)}
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
