// CPF accrued interest rate — 2.5% p.a. (CPF OA floor rate)
const CPF_ACCRUED_INTEREST_RATE = 2.5;

export interface CpfMonthlyEntry {
  month: number;
  year: number;
  cpfUsedThisMonth: number;
  totalCpfWithdrawn: number;
  accruedInterest: number;
  totalOwedToCpf: number; // withdrawn + accrued interest
}

export interface CpfSimulationResult {
  entries: CpfMonthlyEntry[];
  yearlyEntries: CpfYearlyEntry[];
  totalCpfWithdrawn: number;
  totalAccruedInterest: number;
  totalOwedToCpf: number;
  cpfUsedForDownpayment: number;
  cpfUsedForLoan: number;
  cpfUsedForMonthlyPayments: number;
}

export interface CpfYearlyEntry {
  year: number;
  cpfUsedThisYear: number;
  totalCpfWithdrawn: number;
  accruedInterest: number;
  totalOwedToCpf: number;
}

/**
 * Simulate CPF usage and accrued interest over the loan tenure.
 *
 * CPF is used for:
 * 1. Upfront: downpayment (cpfForDownpayment) + loan offset (cpfForLoan)
 * 2. Monthly: loan instalments paid from CPF OA
 *
 * Accrued interest: 2.5% p.a. compounded on all withdrawn amounts.
 * This is what you must refund to your CPF OA when you sell.
 */
export function simulateCpfUsage(params: {
  cpfForDownpayment: number;
  cpfForLoan: number;
  monthlyPayment: number;
  monthlyFromCpf: number; // how much of monthly payment comes from CPF
  tenureYears: number;
}): CpfSimulationResult {
  const {
    cpfForDownpayment,
    cpfForLoan,
    monthlyFromCpf,
    tenureYears,
  } = params;

  const entries: CpfMonthlyEntry[] = [];
  const n = tenureYears * 12;
  const monthlyRate = CPF_ACCRUED_INTEREST_RATE / 100 / 12;

  // Upfront CPF usage (downpayment + loan offset at month 0)
  const upfrontCpf = cpfForDownpayment + cpfForLoan;
  let totalCpfWithdrawn = upfrontCpf;
  // Accrued interest: 2.5% p.a. compounded on total amount owed (withdrawn + interest)
  // Per CPF rules, interest accrues on the full amount that must be refunded
  let accruedInterest = 0;

  for (let i = 1; i <= n; i++) {
    // Monthly CPF withdrawal happens first
    const cpfThisMonth = monthlyFromCpf;
    totalCpfWithdrawn += cpfThisMonth;

    // Interest accrues on total owed (all withdrawn + accumulated interest)
    // Full precision — no rounding until display
    accruedInterest += (totalCpfWithdrawn + accruedInterest) * monthlyRate;

    entries.push({
      month: i,
      year: Math.ceil(i / 12),
      cpfUsedThisMonth: cpfThisMonth,
      totalCpfWithdrawn: Math.round(totalCpfWithdrawn),
      accruedInterest: Math.round(accruedInterest),
      totalOwedToCpf: Math.round(totalCpfWithdrawn + accruedInterest),
    });
  }

  // Aggregate yearly
  const yearlyEntries: CpfYearlyEntry[] = [];
  for (let y = 1; y <= tenureYears; y++) {
    const yearEntries = entries.filter((e) => e.year === y);
    const lastEntry = yearEntries[yearEntries.length - 1];
    const cpfThisYear = yearEntries.reduce((sum, e) => sum + e.cpfUsedThisMonth, 0);
    // Add upfront to year 1
    const totalThisYear = y === 1 ? cpfThisYear + upfrontCpf : cpfThisYear;

    yearlyEntries.push({
      year: y,
      cpfUsedThisYear: Math.round(totalThisYear),
      totalCpfWithdrawn: lastEntry.totalCpfWithdrawn,
      accruedInterest: lastEntry.accruedInterest,
      totalOwedToCpf: lastEntry.totalOwedToCpf,
    });
  }

  const lastEntry = entries[entries.length - 1];
  const totalMonthlyPayments = Math.round(monthlyFromCpf * n);

  return {
    entries,
    yearlyEntries,
    totalCpfWithdrawn: lastEntry?.totalCpfWithdrawn ?? 0,
    totalAccruedInterest: lastEntry?.accruedInterest ?? 0,
    totalOwedToCpf: lastEntry?.totalOwedToCpf ?? 0,
    cpfUsedForDownpayment: cpfForDownpayment,
    cpfUsedForLoan: cpfForLoan,
    cpfUsedForMonthlyPayments: totalMonthlyPayments,
  };
}

/**
 * Compare cash vs CPF strategies.
 * - Max CPF: use all available CPF for downpayment + monthly payments
 * - Max Cash: use minimum CPF, pay from cash
 * - Balanced: use CPF for downpayment, cash for monthly
 */
export interface CpfCashComparison {
  label: string;
  cpfForDownpayment: number;
  cpfForLoan: number;
  monthlyFromCpf: number;
  monthlyFromCash: number;
  totalCpfWithdrawn: number;
  totalAccruedInterest: number;
  totalOwedToCpf: number;
  totalCashSpent: number;
  cashRetained: number;
}

export function compareCpfCashStrategies(params: {
  cpfForDownpayment: number;
  cpfForLoan: number;
  monthlyPayment: number;
  tenureYears: number;
  totalCpfOa: number;
  cashNeeded: number;
  totalDownpayment: number;
  minCash: number;
}): CpfCashComparison[] {
  const {
    cpfForDownpayment,
    cpfForLoan,
    monthlyPayment,
    tenureYears,
    totalCpfOa,
    cashNeeded,
    totalDownpayment,
    minCash,
  } = params;

  const strategies: CpfCashComparison[] = [];

  // Strategy 1: Max CPF — use CPF for everything possible
  {
    const sim = simulateCpfUsage({
      cpfForDownpayment,
      cpfForLoan,
      monthlyPayment,
      monthlyFromCpf: monthlyPayment,
      tenureYears,
    });
    strategies.push({
      label: 'Max CPF',
      cpfForDownpayment,
      cpfForLoan,
      monthlyFromCpf: monthlyPayment,
      monthlyFromCash: 0,
      totalCpfWithdrawn: sim.totalCpfWithdrawn,
      totalAccruedInterest: sim.totalAccruedInterest,
      totalOwedToCpf: sim.totalOwedToCpf,
      totalCashSpent: cashNeeded,
      cashRetained: 0, // relative — not absolute
    });
  }

  // Strategy 2: Max Cash — pay everything in cash, don't touch CPF at all
  {
    const sim = simulateCpfUsage({
      cpfForDownpayment: 0,
      cpfForLoan: 0,
      monthlyPayment,
      monthlyFromCpf: 0,
      tenureYears,
    });
    // Full downpayment in cash + all monthly payments in cash
    const totalCash = totalDownpayment + monthlyPayment * tenureYears * 12;
    strategies.push({
      label: 'Max Cash',
      cpfForDownpayment: 0,
      cpfForLoan: 0,
      monthlyFromCpf: 0,
      monthlyFromCash: monthlyPayment,
      totalCpfWithdrawn: 0,
      totalAccruedInterest: 0,
      totalOwedToCpf: 0,
      totalCashSpent: totalCash,
      cashRetained: 0,
    });
  }

  // Strategy 3: Balanced — CPF for downpayment + loan offset, cash for monthly
  {
    const sim = simulateCpfUsage({
      cpfForDownpayment,
      cpfForLoan,
      monthlyPayment,
      monthlyFromCpf: 0,
      tenureYears,
    });
    // Cash needed for DP shortfall + all monthly payments in cash
    const totalCash = cashNeeded + monthlyPayment * tenureYears * 12;
    strategies.push({
      label: 'Balanced',
      cpfForDownpayment,
      cpfForLoan,
      monthlyFromCpf: 0,
      monthlyFromCash: monthlyPayment,
      totalCpfWithdrawn: sim.totalCpfWithdrawn,
      totalAccruedInterest: sim.totalAccruedInterest,
      totalOwedToCpf: sim.totalOwedToCpf,
      totalCashSpent: totalCash,
      cashRetained: 0,
    });
  }

  return strategies;
}
