import { TransactionTable } from '../transaction-table';

const mockTransactions = [
  {
    id: "1",
    date: "15.01.2024",
    projectName: "Ataşehir Konut Projesi",
    type: "Gider" as const,
    amount: 125000,
    isGrubu: "Kaba İmalat",
    rayicGrubu: "Malzeme",
    description: "Beton ve demir malzeme alımı",
  },
  {
    id: "2",
    date: "18.01.2024",
    projectName: "Beykoz Villa İnşaatı",
    type: "Gelir" as const,
    amount: 500000,
    isGrubu: "Genel Giderler ve Endirekt Giderler",
    rayicGrubu: "Paket",
    description: "Müşteri ilk hakediş ödemesi",
  },
  {
    id: "3",
    date: "22.01.2024",
    projectName: "Ataşehir Konut Projesi",
    type: "Gider" as const,
    amount: 85000,
    isGrubu: "Kaba İmalat",
    rayicGrubu: "İşçilik",
    description: "İşçi maaşları - Ocak ayı",
  },
];

export default function TransactionTableExample() {
  return (
    <div className="p-6">
      <TransactionTable
        transactions={mockTransactions}
        onEdit={(id) => console.log('Edit transaction', id)}
        onDelete={(id) => console.log('Delete transaction', id)}
      />
    </div>
  );
}
