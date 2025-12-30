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
  BookOpen,
  ClipboardList,
  Receipt,
  FileSignature,
  Wallet,
  FolderOpen,
  CreditCard
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
import logoUrl from "@assets/ESKA LOGO TASARIMI_1761497797352.png";

const menuItems = [
  { title: "Ana Sayfa", url: "/", icon: Home },
  { title: "Projeler", url: "/projeler", icon: FolderKanban },
  { title: "Gelir/Gider", url: "/islemler", icon: ArrowLeftRight },
  { title: "Şantiye Defteri", url: "/santiye-defteri", icon: BookOpen },
  { title: "Puantaj", url: "/puantaj", icon: ClipboardList },
  { title: "Faturalar", url: "/faturalar", icon: FileText },
  { title: "Hakediş", url: "/hakedis", icon: Receipt },
  { title: "Sözleşmeler", url: "/sozlesmeler", icon: FileSignature },
  { title: "Ödeme Planları", url: "/odeme-planlari", icon: Wallet },
  { title: "Dökümanlar", url: "/dokumanlar", icon: FolderOpen },
  { title: "İş Programı", url: "/is-programi", icon: CalendarDays },
  { title: "Bütçe & Keşif", url: "/butce", icon: Calculator },
  { title: "Taşeron/Tedarikçi", url: "/taseronlar", icon: Users },
  { title: "Müşteriler", url: "/musteriler", icon: UserCircle },
  { title: "Raporlar", url: "/raporlar", icon: BarChart3 },
  { title: "Abonelik Planları", url: "/abonelik", icon: CreditCard },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-sidebar-border bg-background">
        <div className="flex flex-col items-center gap-3">
          <img 
            src={logoUrl} 
            alt="ESKA Logo" 
            className="h-16 w-auto object-contain"
          />
          <div className="text-center">
            <p className="text-xs font-medium text-sidebar-foreground leading-tight">İnşaat Proje Yönetim Sistemi</p>
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
