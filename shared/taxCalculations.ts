/**
 * Türk Vergi Sistemi Hesaplamaları
 * 2025 yılı vergi oranları ve hesaplamaları
 */

/**
 * KDV (Katma Değer Vergisi) Hesaplama
 * Genel oran: %20
 */
export function calculateKDV(amount: number, rate: number = 20): number {
  return (amount * rate) / 100;
}

/**
 * 2025 Gelir Vergisi Hesaplama (Dilimli Tarife)
 * G.V.K. madde: 103
 */
export interface IncomeTaxBracket {
  min: number;
  max: number | null;
  rate: number;
  baseAmount: number;
}

export const incomeTaxBrackets2025: IncomeTaxBracket[] = [
  { min: 0, max: 158000, rate: 15, baseAmount: 0 },
  { min: 158000, max: 330000, rate: 20, baseAmount: 23700 },
  { min: 330000, max: 800000, rate: 27, baseAmount: 58100 },
  { min: 800000, max: 4300000, rate: 35, baseAmount: 185000 },
  { min: 4300000, max: null, rate: 40, baseAmount: 1410000 },
];

export function calculateIncomeTax(income: number): {
  tax: number;
  netIncome: number;
  effectiveRate: number;
  bracketDetails: Array<{
    bracket: number;
    income: number;
    rate: number;
    tax: number;
  }>;
} {
  let totalTax = 0;
  const bracketDetails: Array<{
    bracket: number;
    income: number;
    rate: number;
    tax: number;
  }> = [];

  for (let i = 0; i < incomeTaxBrackets2025.length; i++) {
    const bracket = incomeTaxBrackets2025[i];
    const nextBracket = incomeTaxBrackets2025[i + 1];

    if (income <= bracket.min) {
      break;
    }

    const bracketIncome = Math.min(
      income - bracket.min,
      nextBracket ? nextBracket.min - bracket.min : income - bracket.min
    );

    const bracketTax = (bracketIncome * bracket.rate) / 100;
    totalTax += bracketTax;

    bracketDetails.push({
      bracket: i + 1,
      income: bracketIncome,
      rate: bracket.rate,
      tax: bracketTax,
    });

    if (!bracket.max || income <= bracket.max) {
      break;
    }
  }

  return {
    tax: totalTax,
    netIncome: income - totalTax,
    effectiveRate: income > 0 ? (totalTax / income) * 100 : 0,
    bracketDetails,
  };
}

/**
 * Kurumlar Vergisi Hesaplama
 * 2025 oranı: %25
 */
export function calculateCorporateTax(profit: number, rate: number = 25): number {
  return (profit * rate) / 100;
}

/**
 * Stopaj Vergisi Hesaplama
 * Maaş ödemeleri için gelir vergisi stopajı
 */
export function calculateWithholdingTax(
  amount: number,
  type: 'salary' | 'rent' | 'dividend'
): number {
  switch (type) {
    case 'salary':
      // Maaşlar için gelir vergisi tarifesi kullanılır
      return calculateIncomeTax(amount).tax;
    case 'rent':
      // Kira ödemeleri %20 stopaj
      return (amount * 20) / 100;
    case 'dividend':
      // Kar dağıtımı %10 stopaj
      return (amount * 10) / 100;
    default:
      return 0;
  }
}

/**
 * Kar Dağıtım Stopajı
 * Oran: %10
 */
export function calculateDividendWithholding(dividendAmount: number): number {
  return (dividendAmount * 10) / 100;
}

/**
 * Geçici Vergi Hesaplama
 * 3 aylık dönemler için
 * Oran: %25 (Kurumlar vergisi oranıyla aynı)
 */
export function calculateAdvanceTax(quarterlyProfit: number): number {
  return calculateCorporateTax(quarterlyProfit, 25);
}

/**
 * Toplam Vergi Yükü Hesaplama
 */
export interface TaxSummary {
  grossIncome: number;
  grossExpense: number;
  profit: number;
  kdv: {
    collected: number; // Tahsil edilen KDV (gelirler üzerinden)
    paid: number; // Ödenen KDV (giderler üzerinden)
    netPayable: number; // Ödenecek net KDV
  };
  incomeTax: {
    amount: number;
    effectiveRate: number;
  };
  corporateTax: number;
  totalTaxBurden: number;
  netProfit: number;
}

export function calculateTaxSummary(
  incomes: Array<{ amount: number; hasKDV?: boolean }>,
  expenses: Array<{ amount: number; hasKDV?: boolean }>,
  isCompany: boolean = true
): TaxSummary {
  // Gelir hesaplama
  const grossIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const incomeKDV = incomes.reduce(
    (sum, item) => sum + (item.hasKDV !== false ? calculateKDV(item.amount) : 0),
    0
  );

  // Gider hesaplama
  const grossExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const expenseKDV = expenses.reduce(
    (sum, item) => sum + (item.hasKDV !== false ? calculateKDV(item.amount) : 0),
    0
  );

  // Net KDV
  const netKDV = incomeKDV - expenseKDV;

  // Kar hesaplama
  const profit = grossIncome - grossExpense;

  // Gelir/Kurumlar vergisi
  let incomeTax = 0;
  let effectiveRate = 0;
  let corporateTax = 0;

  if (isCompany) {
    corporateTax = calculateCorporateTax(profit);
  } else {
    const taxResult = calculateIncomeTax(profit);
    incomeTax = taxResult.tax;
    effectiveRate = taxResult.effectiveRate;
  }

  // Toplam vergi yükü
  const totalTaxBurden = netKDV + (isCompany ? corporateTax : incomeTax);

  // Net kar
  const netProfit = profit - totalTaxBurden;

  return {
    grossIncome,
    grossExpense,
    profit,
    kdv: {
      collected: incomeKDV,
      paid: expenseKDV,
      netPayable: netKDV,
    },
    incomeTax: {
      amount: incomeTax,
      effectiveRate,
    },
    corporateTax,
    totalTaxBurden,
    netProfit,
  };
}
