import { TaskList } from '../task-list';

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
  {
    id: "3",
    name: "Elektrik alt yapı döşeme",
    startDate: "11.03.2024",
    endDate: "25.03.2024",
    status: "Bekliyor",
    responsible: "Can Demir",
    notes: "Kolon-kiriş imalatı tamamlanması bekleniyor",
  },
];

export default function TaskListExample() {
  return (
    <div className="p-6 max-w-3xl">
      <TaskList
        tasks={mockTasks}
        onEdit={(id) => console.log('Edit task', id)}
        onDelete={(id) => console.log('Delete task', id)}
      />
    </div>
  );
}
