import { StatsCard } from '../stats-card';
import { FolderKanban, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
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
  );
}
