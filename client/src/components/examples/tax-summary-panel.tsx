import { TaxSummaryPanel } from '../tax-summary-panel';

export default function TaxSummaryPanelExample() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Vergi Hesaplama Örneği</h2>
        <p className="text-muted-foreground">
          Gelir: ₺2,450,000 | Gider: ₺1,850,000 | Kar: ₺600,000
        </p>
      </div>
      
      <TaxSummaryPanel
        totalIncome={2450000}
        totalExpense={1850000}
        profit={600000}
        kdvCollected={490000} // %20 of income
        kdvPaid={370000}      // %20 of expense
        kdvPayable={120000}   // difference
        incomeTax={0}
        corporateTax={150000} // %25 of profit
        effectiveRate={25}
        isCompany={true}
      />
    </div>
  );
}
