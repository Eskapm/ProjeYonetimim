import { SiteDiaryCard } from '../site-diary-card';

const mockDiaryEntry = {
  id: "1",
  date: "26.10.2024",
  projectName: "Ataşehir Konut Projesi",
  weather: "Bulutlu",
  workDone: "Temel kazısı tamamlandı.\n2. kat kolon kalıpları yerleştirildi.\nBeton dökümü için hazırlık yapıldı.",
  materialsUsed: "Beton C30: 45m³\nİnşaat Demiri: 2.5 ton\nKalıp malzemesi",
  totalWorkers: 28,
  issues: "Beton mikserinde küçük bir arıza oluştu, 2 saat gecikme yaşandı.",
  notes: "Yarın hava durumu uygunsa beton dökümü yapılacak.",
};

export default function SiteDiaryCardExample() {
  return (
    <div className="p-6 max-w-2xl">
      <SiteDiaryCard
        entry={mockDiaryEntry}
        onEdit={() => console.log('Edit diary')}
        onDelete={() => console.log('Delete diary')}
      />
    </div>
  );
}
