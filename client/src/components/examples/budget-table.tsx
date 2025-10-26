import { BudgetTable } from '../budget-table';

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
  {
    id: "3",
    name: "Ustası İşçilik",
    quantity: 2500,
    unit: "m²",
    unitPrice: 125,
    isGrubu: "İnce İmalat",
    rayicGrubu: "İşçilik",
  },
  {
    id: "4",
    name: "Elektrik Panosu",
    quantity: 4,
    unit: "adet",
    unitPrice: 12500,
    isGrubu: "Elektrik Tesisat",
    rayicGrubu: "Paket",
  },
];

export default function BudgetTableExample() {
  return (
    <div className="p-6">
      <BudgetTable
        items={mockBudgetItems}
        onEdit={(id) => console.log('Edit budget item', id)}
        onDelete={(id) => console.log('Delete budget item', id)}
      />
    </div>
  );
}
