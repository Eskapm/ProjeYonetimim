import { useState } from "react";
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
import { Plus, Search } from "lucide-react";

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
    {
      id: "4",
      name: "Kadıköy Residence",
      location: "İstanbul, Kadıköy",
      area: "4,800",
      startDate: "10.04.2024",
      endDate: "10.04.2025",
      status: "Planlama",
      costPerSqm: "₺5,500",
    },
    {
      id: "5",
      name: "Üsküdar Plaza",
      location: "İstanbul, Üsküdar",
      area: "2,100",
      startDate: "01.02.2024",
      endDate: "31.08.2024",
      status: "Devam Ediyor",
      costPerSqm: "₺4,800",
    },
  ];

  const filteredProjects = mockProjects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projeler</h1>
          <p className="text-muted-foreground mt-1">Tüm projelerinizi görüntüleyin ve yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button data-testid="button-add-project">
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
            <SelectItem value="Planlama">Planlama</SelectItem>
            <SelectItem value="Devam Ediyor">Devam Ediyor</SelectItem>
            <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
            <SelectItem value="Askıda">Askıda</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Proje bulunamadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              {...project}
              onView={() => console.log('View project', project.id)}
              onEdit={() => console.log('Edit project', project.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
