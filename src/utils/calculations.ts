import {
  BSD_TIERS,
  ABSD_RATES,
  MSR_LIMIT,
  TDSR_LIMIT,
  HDB_LOAN_RATE,
  HDB_MAX_LTV,
  HDB_MAX_TENURE_YEARS,
  HDB_AGE_CAP,
  BANK_MAX_LTV_FIRST,
  BANK_MAX_LTV_SECOND,
  BANK_MAX_LTV_THIRD,
  BANK_MAX_TENURE_HDB,
  BANK_MAX_TENURE_PRIVATE,
  BANK_AGE_CAP,
  BANK_STRESS_TEST_RATE,
  HDB_INCOME_CEILING_FAMILY,
  HDB_INCOME_CEILING_MULTIGEN,
  HDB_INCOME_CEILING_SINGLE,
  MIN_CASH_PERCENT,
  LEGAL_FEE_ESTIMATES,
  HDB_LEASE_COVERAGE_AGE,
  type PropertyType,
  type BuyingScheme,
  type CitizenshipProfile,
  type LoanType,
} from '@/constants/property';

// ─── BSD ───────────────────────────────────────────────

export function calculateBSD(price: number): number {
  let remaining = price;
  let prevLimit = 0;
  let bsd = 0;

  for (const tier of BSD_TIERS) {
    const taxable = Math.min(remaining, tier.limit - prevLimit);
    if (taxable <= 0) break;
    bsd += taxable * tier.rate;
    remaining -= taxable;
    prevLimit = tier.limit;
  }

  return Math.round(bsd);
}

// ─── ABSD ──────────────────────────────────────────────

export function calculateABSD(
  price: number,
  citizenship: CitizenshipProfile,
  propertyCount: number
): number {
  const rates = ABSD_RATES[citizenship];
  const index = Math.min(propertyCount - 1, rates.length - 1);
  const rate = rates[index] / 100;
  return Math.round(price * rate);
}

// ─── Loan Tenure ───────────────────────────────────────

export function getMaxTenure(
  loanType: LoanType,
  propertyType: PropertyType,
  youngestAge: number,
  remainingLease?: number
): number {
  let maxByType: number;
  let ageCap: number;

  if (loanType === 'hdb') {
    maxByType = HDB_MAX_TENURE_YEARS;
    ageCap = HDB_AGE_CAP;
  } else {
    const isHdbProperty = propertyType === 'hdb-bto' || propertyType === 'hdb-resale';
    maxByType = isHdbProperty ? BANK_MAX_TENURE_HDB : BANK_MAX_TENURE_PRIVATE;
    ageCap = BANK_AGE_CAP;
  }

  let tenure = Math.min(maxByType, ageCap - youngestAge);

  // Remaining lease check for HDB/EC leasehold properties
  if (remainingLease !== undefined && remainingLease > 0 &&
      (propertyType.startsWith('hdb') || propertyType === 'ec')) {
    // HDB rule: remaining lease must cover youngest buyer to age 95
    // This means: remainingLease >= (95 - youngestAge), and tenure <= remainingLease - (95 - youngestAge - tenure)
    // Simplified: tenure cannot exceed remainingLease such that lease runs out before age 95
    const leaseNeeded = HDB_LEASE_COVERAGE_AGE - youngestAge;
    if (remainingLease < leaseNeeded) {
      // Lease too short — reduce tenure proportionally
      // Max loan tenure = remaining lease - minimum coverage gap
      const maxTenureByLease = Math.max(0, remainingLease - (leaseNeeded - tenure));
      tenure = Math.min(tenure, maxTenureByLease);
    }
    // Also: tenure cannot exceed remaining lease itself
    tenure = Math.min(tenure, remainingLease);
  }

  return Math.max(0, Math.floor(tenure));
}

// ─── LTV ───────────────────────────────────────────────

export function getLTV(loanType: LoanType, propertyCount: number): number {
  if (loanType === 'hdb') return HDB_MAX_LTV;
  if (propertyCount === 1) return BANK_MAX_LTV_FIRST;
  if (propertyCount === 2) return BANK_MAX_LTV_SECOND;
  return BANK_MAX_LTV_THIRD;
}

// ─── HDB Loan Eligibility ─────────────────────────────

export function isEligibleForHDBLoan(
  propertyType: PropertyType,
  buyingScheme: BuyingScheme,
  grossMonthlyIncome: number,
  citizenship: CitizenshipProfile
): { eligible: boolean; reason?: string } {
  if (propertyType !== 'hdb-bto' && propertyType !== 'hdb-resale') {
    return { eligible: false, reason: 'HDB loan is only for HDB flats' };
  }

  if (citizenship === 'pr-pr') {
    return { eligible: false, reason: 'At least one applicant must be a Singapore Citizen' };
  }

  let ceiling: number;
  if (buyingScheme === 'multi-gen') {
    ceiling = HDB_INCOME_CEILING_MULTIGEN;
  } else if (buyingScheme === 'single') {
    ceiling = HDB_INCOME_CEILING_SINGLE;
  } else {
    ceiling = HDB_INCOME_CEILING_FAMILY;
  }

  if (grossMonthlyIncome > ceiling) {
    return {
      eligible: false,
      reason: `Gross monthly income exceeds $${ceiling.toLocaleString()} ceiling`,
    };
  }

  return { eligible: true };
}

// ─── MSR / TDSR ────────────────────────────────────────

export function calculateMSR(grossMonthlyIncome: number): number {
  return Math.round(grossMonthlyIncome * MSR_LIMIT);
}

export function calculateTDSR(grossMonthlyIncome: number, existingDebt: number): number {
  return Math.max(0, Math.round(grossMonthlyIncome * TDSR_LIMIT - existingDebt));
}

// ─── Monthly Payment ───────────────────────────────────

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  tenureYears: number
): number {
  if (principal <= 0 || tenureYears <= 0) return 0;
  if (annualRate === 0) return principal / (tenureYears * 12);

  const r = annualRate / 100 / 12;
  const n = tenureYears * 12;
  const payment = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(payment * 100) / 100;
}

// ─── Max Loan from Payment ─────────────────────────────

export function maxLoanFromPayment(
  maxMonthly: number,
  annualRate: number,
  tenureYears: number
): number {
  if (maxMonthly <= 0 || tenureYears <= 0) return 0;
  if (annualRate === 0) return maxMonthly * tenureYears * 12;

  const r = annualRate / 100 / 12;
  const n = tenureYears * 12;
  return Math.round(maxMonthly * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));
}

// ─── Affordability ─────────────────────────────────────

export interface AffordabilityResult {
  maxLoanMSR: number;
  maxLoanTDSR: number;
  maxLoanLTV: number;
  maxLoan: number;
  bindingConstraint: 'MSR' | 'TDSR' | 'LTV';
  maxPropertyPrice: number;
  maxMonthlyMSR: number;
  maxMonthlyTDSR: number;
}

export function calculateAffordability(params: {
  grossMonthlyIncome: number;
  existingDebt: number;
  propertyPrice: number;
  loanType: LoanType;
  propertyType: PropertyType;
  propertyCount: number;
  annualRate: number;
  tenureYears: number;
  buyingScheme: BuyingScheme;
}): AffordabilityResult {
  const {
    grossMonthlyIncome,
    existingDebt,
    propertyPrice,
    loanType,
    propertyType,
    propertyCount,
    annualRate,
    tenureYears,
  } = params;

  const income = grossMonthlyIncome;

  // MSR only applies to HDB and EC, NOT private condo/landed
  const isHdbOrEc = propertyType === 'hdb-bto' || propertyType === 'hdb-resale' || propertyType === 'ec';
  const maxMonthlyMSR = isHdbOrEc ? calculateMSR(income) : Infinity;
  const maxMonthlyTDSR = calculateTDSR(income, existingDebt);

  // For bank loans, use stress test rate
  const rateForCalc = loanType === 'bank'
    ? Math.max(annualRate, BANK_STRESS_TEST_RATE, annualRate + 0.5)
    : annualRate;

  const maxLoanMSR = isHdbOrEc
    ? maxLoanFromPayment(maxMonthlyMSR, rateForCalc, tenureYears)
    : Infinity;
  const maxLoanTDSR = maxLoanFromPayment(maxMonthlyTDSR, rateForCalc, tenureYears);

  const ltv = getLTV(loanType, propertyCount);
  const maxLoanLTV = Math.round(propertyPrice * ltv / 100);

  const maxLoan = Math.min(maxLoanMSR, maxLoanTDSR, maxLoanLTV);

  let bindingConstraint: 'MSR' | 'TDSR' | 'LTV';
  if (maxLoan === maxLoanLTV) bindingConstraint = 'LTV';
  else if (maxLoan === maxLoanMSR && isHdbOrEc) bindingConstraint = 'MSR';
  else bindingConstraint = 'TDSR';

  // Max property price (working backwards from income)
  const maxLoanFromIncome = isHdbOrEc ? Math.min(maxLoanMSR, maxLoanTDSR) : maxLoanTDSR;
  const maxPropertyPrice = Math.round(maxLoanFromIncome / (ltv / 100));

  return {
    maxLoanMSR,
    maxLoanTDSR,
    maxLoanLTV,
    maxLoan,
    bindingConstraint,
    maxPropertyPrice,
    maxMonthlyMSR,
    maxMonthlyTDSR,
  };
}

// ─── Downpayment ───────────────────────────────────────

export interface DownpaymentBreakdown {
  totalDownpayment: number;
  minCash: number;
  cpfForDownpayment: number;
  cpfForLoan: number;
  cpfUsedTotal: number;
  cashNeeded: number;
  loanAmount: number;
  effectiveLoanAmount: number;
  ltv: number;
}

export function calculateDownpayment(
  propertyPrice: number,
  loanType: LoanType,
  propertyCount: number,
  totalCpfOa: number = 0
): DownpaymentBreakdown {
  const ltv = getLTV(loanType, propertyCount);
  const maxLoan = Math.round(propertyPrice * ltv / 100);
  const totalDownpayment = propertyPrice - maxLoan;

  let minCash: number;
  let cpfForDownpayment: number;

  if (loanType === 'hdb') {
    // HDB loan: entire downpayment can be paid by CPF, no minimum cash
    minCash = 0;
    cpfForDownpayment = Math.min(totalCpfOa, totalDownpayment);
  } else {
    // Bank loan: 5% must be cash, remaining can be cash or CPF
    minCash = Math.round(propertyPrice * MIN_CASH_PERCENT.bank / 100);
    const remainingDp = totalDownpayment - minCash;
    cpfForDownpayment = Math.min(totalCpfOa, remainingDp);
  }

  // Excess CPF after downpayment can reduce the loan amount
  const cpfRemaining = Math.max(0, totalCpfOa - cpfForDownpayment);
  const cpfForLoan = Math.min(cpfRemaining, maxLoan);
  const effectiveLoanAmount = maxLoan - cpfForLoan;

  const cpfUsedTotal = cpfForDownpayment + cpfForLoan;
  const cashNeeded = Math.max(0, totalDownpayment - cpfForDownpayment);

  return {
    totalDownpayment,
    minCash,
    cpfForDownpayment,
    cpfForLoan,
    cpfUsedTotal,
    cashNeeded,
    loanAmount: maxLoan,
    effectiveLoanAmount,
    ltv,
  };
}

// ─── Amortisation ──────────────────────────────────────

export interface AmortisationEntry {
  month: number;
  year: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
  totalPrincipal: number;
}

export function generateAmortisation(
  loanAmount: number,
  annualRate: number,
  tenureYears: number
): AmortisationEntry[] {
  const entries: AmortisationEntry[] = [];
  const monthlyPayment = calculateMonthlyPayment(loanAmount, annualRate, tenureYears);
  const r = annualRate / 100 / 12;
  const n = tenureYears * 12;

  // Use full precision for running totals, only round for display
  let balance = loanAmount;
  let totalInterest = 0;
  let totalPrincipal = 0;

  for (let i = 1; i <= n; i++) {
    const interest = balance * r;
    let principal = monthlyPayment - interest;

    // Last month: clear remaining balance exactly
    if (i === n) {
      principal = balance;
    }

    balance = Math.max(0, balance - principal);
    totalInterest += interest;
    totalPrincipal += principal;

    entries.push({
      month: i,
      year: Math.ceil(i / 12),
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance),
      totalInterest: Math.round(totalInterest),
      totalPrincipal: Math.round(totalPrincipal),
    });
  }

  return entries;
}

// ─── Legal Fee Estimate ────────────────────────────────

export function estimateLegalFees(propertyType: PropertyType): [number, number] {
  return LEGAL_FEE_ESTIMATES[propertyType];
}

// ─── Total Costs Summary ───────────────────────────────

export interface CostBreakdown {
  propertyPrice: number;
  bsd: number;
  absd: number;
  legalFeeLow: number;
  legalFeeHigh: number;
  valuationFee: number;
  optionFee: number;
  exerciseFee: number;
  resaleLevy: number;
  cov: number;
  totalCashOutlayLow: number;
  totalCashOutlayHigh: number;
  downpayment: DownpaymentBreakdown;
  loanType: LoanType;
}

export function calculateCosts(params: {
  propertyPrice: number;
  valuation: number;
  propertyType: PropertyType;
  citizenship: CitizenshipProfile;
  propertyCount: number;
  loanType: LoanType;
  optionFee?: number;
  exerciseFee?: number;
  totalCpfOa?: number;
  resaleLevy?: number;
}): CostBreakdown {
  const {
    propertyPrice,
    valuation,
    propertyType,
    citizenship,
    propertyCount,
    loanType,
    optionFee = 0,
    exerciseFee = 0,
    totalCpfOa = 0,
    resaleLevy = 0,
  } = params;

  const bsd = calculateBSD(propertyPrice);
  const absd = calculateABSD(propertyPrice, citizenship, propertyCount);

  const [legalFeeLow, legalFeeHigh] = LEGAL_FEE_ESTIMATES[propertyType];

  // $120 processing fee for HDB Request for Value (required for resale after OTP)
  const valuationFee = propertyType === 'hdb-resale' ? 120 : 0;
  const cov = propertyType === 'hdb-resale' ? Math.max(0, propertyPrice - valuation) : 0;

  const downpayment = calculateDownpayment(propertyPrice, loanType, propertyCount, totalCpfOa);

  // COV and resale levy must be in cash
  const cashFees = legalFeeLow + valuationFee + optionFee + exerciseFee + cov + resaleLevy;
  const cashFeesHigh = legalFeeHigh + valuationFee + optionFee + exerciseFee + cov + resaleLevy;

  const totalCashOutlayLow = downpayment.cashNeeded + cashFees;
  const totalCashOutlayHigh = downpayment.cashNeeded + cashFeesHigh;

  return {
    propertyPrice,
    bsd,
    absd,
    legalFeeLow,
    legalFeeHigh,
    valuationFee,
    optionFee,
    exerciseFee,
    resaleLevy,
    cov,
    totalCashOutlayLow,
    totalCashOutlayHigh,
    downpayment,
    loanType,
  };
}
