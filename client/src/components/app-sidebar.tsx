import { 
  Home, 
  FolderKanban, 
  ArrowLeftRight, 
  FileText, 
  Users, 
  UserCircle, 
  BarChart3,
  CalendarDays,
  Calculator,
  BookOpen
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import logoUrl from "@assets/Eska Logo.png";

const menuItems = [
  { title: "Ana Sayfa", url: "/", icon: Home },
  { title: "Projeler", url: "/projeler", icon: FolderKanban },
  { title: "Gelir/Gider", url: "/islemler", icon: ArrowLeftRight },
  { title: "Şantiye Defteri", url: "/santiye-defteri", icon: BookOpen },
  { title: "Faturalar", url: "/faturalar", icon: FileText },
  { title: "İş Programı", url: "/is-programi", icon: CalendarDays },
  { title: "Bütçe & Keşif", url: "/butce", icon: Calculator },
  { title: "Taşeronlar", url: "/taseronlar", icon: Users },
  { title: "Müşteriler", url: "/musteriler", icon: UserCircle },
  { title: "Raporlar", url: "/raporlar", icon: BarChart3 },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Eska Yapı" className="h-8 w-auto" />
          <div>
            <h2 className="text-sm font-semibold text-sidebar-foreground">ESKA YAPI</h2>
            <p className="text-xs text-muted-foreground">Proje Yönetim</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menü</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')}`}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
