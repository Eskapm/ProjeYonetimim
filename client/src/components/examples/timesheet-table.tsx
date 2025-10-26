import { TimesheetTable } from '../timesheet-table';

const mockTimesheets = [
  {
    id: "1",
    date: "25.10.2024",
    isGrubu: "Kaba İmalat",
    workerCount: 12,
    hours: 8,
    notes: "Temel kazısı devam ediyor",
  },
  {
    id: "2",
    date: "25.10.2024",
    isGrubu: "İnce İmalat",
    workerCount: 5,
    hours: 9,
    notes: "Sıva işleri",
  },
  {
    id: "3",
    date: "26.10.2024",
    isGrubu: "Kaba İmalat",
    workerCount: 15,
    hours: 8,
  },
  {
    id: "4",
    date: "26.10.2024",
    isGrubu: "Elektrik Tesisat",
    workerCount: 3,
    hours: 7,
    notes: "Kablo döşeme",
  },
];

export default function TimesheetTableExample() {
  return (
    <div className="p-6">
      <TimesheetTable
        entries={mockTimesheets}
        onEdit={(id) => console.log('Edit timesheet', id)}
        onDelete={(id) => console.log('Delete timesheet', id)}
      />
    </div>
  );
}
