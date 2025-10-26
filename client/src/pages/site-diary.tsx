import { useState } from "react";
import { SiteDiaryCard } from "@/components/site-diary-card";
import { TimesheetTable } from "@/components/timesheet-table";
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
import { Plus, Search, Calendar } from "lucide-react";

export default function SiteDiary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  // TODO: Remove mock data - replace with real data from API
  const mockProjects = [
    { id: "1", name: "Ataşehir Konut Projesi" },
    { id: "2", name: "Beykoz Villa İnşaatı" },
    { id: "3", name: "Maltepe Ofis Binası" },
  ];

  const mockDiaryEntries = [
    {
      id: "1",
      date: "26.10.2024",
      projectName: "Ataşehir Konut Projesi",
      weather: "Bulutlu",
      workDone: "Temel kazısı tamamlandı.\n2. kat kolon kalıpları yerleştirildi.\nBeton dökümü için hazırlık yapıldı.",
      materialsUsed: "Beton C30: 45m³\nİnşaat Demiri: 2.5 ton\nKalıp malzemesi",
      totalWorkers: 28,
      issues: "Beton mikserinde küçük bir arıza oluştu, 2 saat gecikme yaşandı.",
      notes: "Yarın hava durumu uygunsa beton dökümü yapılacak.",
    },
    {
      id: "2",
      date: "25.10.2024",
      projectName: "Beykoz Villa İnşaatı",
      weather: "Güneşli",
      workDone: "İç sıva işleri devam ediyor.\nElektrik tesisatı %80 tamamlandı.",
      materialsUsed: "Sıva malzemesi: 150 kg\nElektrik kablosu: 200m",
      totalWorkers: 15,
    },
    {
      id: "3",
      date: "24.10.2024",
      projectName: "Ataşehir Konut Projesi",
      weather: "Yağmurlu",
      workDone: "Hava koşulları nedeniyle sadece kapalı alan işleri yapıldı.\nİç kapı kasası montajı.",
      totalWorkers: 8,
      notes: "Yağmur nedeniyle dış işler ertelendi.",
    },
  ];

  const mockTimesheets = [
    {
      id: "1",
      date: "26.10.2024",
      projectName: "Ataşehir Konut Projesi",
      isGrubu: "Kaba İmalat",
      workerCount: 15,
      hours: 8,
      notes: "Temel kazısı",
    },
    {
      id: "2",
      date: "26.10.2024",
      projectName: "Ataşehir Konut Projesi",
      isGrubu: "İnce İmalat",
      workerCount: 8,
      hours: 9,
      notes: "Kalıp işleri",
    },
    {
      id: "3",
      date: "26.10.2024",
      projectName: "Beykoz Villa İnşaatı",
      isGrubu: "İnce İmalat",
      workerCount: 10,
      hours: 8,
      notes: "Sıva işleri",
    },
    {
      id: "4",
      date: "26.10.2024",
      projectName: "Beykoz Villa İnşaatı",
      isGrubu: "Elektrik Tesisat",
      workerCount: 5,
      hours: 7,
      notes: "Kablo döşeme",
    },
  ];

  const filteredDiaryEntries = mockDiaryEntries.filter((entry) => {
    const matchesSearch =
      entry.workDone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === "all" || entry.projectName === selectedProject;
    return matchesSearch && matchesProject;
  });

  const filteredTimesheets = mockTimesheets.filter((entry) => {
    const matchesProject = selectedProject === "all" || entry.projectName === selectedProject;
    return matchesProject;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Şantiye Defteri</h1>
          <p className="text-muted-foreground mt-1">Günlük puantaj ve şantiye raporları</p>
        </div>
        <Button data-testid="button-add-diary-entry">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kayıt Ekle
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Yapılan işlerde ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-diary"
          />
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full sm:w-[250px]" data-testid="select-project-filter">
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

      <Tabs defaultValue="diary" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="diary" data-testid="tab-diary">
            Şantiye Defteri
          </TabsTrigger>
          <TabsTrigger value="timesheet" data-testid="tab-timesheet">
            Puantaj
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diary" className="space-y-6">
          {filteredDiaryEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Kayıt bulunamadı
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredDiaryEntries.map((entry) => (
                <SiteDiaryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={() => console.log('Edit diary', entry.id)}
                  onDelete={() => console.log('Delete diary', entry.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timesheet" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Günlük Puantaj Kayıtları</CardTitle>
            </CardHeader>
            <CardContent>
              <TimesheetTable
                entries={filteredTimesheets}
                onEdit={(id) => console.log('Edit timesheet', id)}
                onDelete={(id) => console.log('Delete timesheet', id)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
