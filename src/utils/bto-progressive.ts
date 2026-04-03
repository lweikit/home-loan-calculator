/**
 * BTO Payment Schedule
 *
 * Unlike private property, HDB BTO does NOT have progressive
 * construction milestone payments. There are only 3 payment stages:
 *
 * 1. Booking: Option fee (cash only)
 * 2. Agreement for Lease (~9 months after booking): First downpayment
 * 3. Key Collection (~3-5 years after launch): Remaining downpayment + loan begins
 *
 * The split depends on loan type and staggered scheme eligibility.
 */

export interface BtoPaymentStage {
  stage: string;
  description: string;
  timing: string;
  amount: number;
  cpfUsable: number;
  cashNeeded: number;
  notes: string;
}

export interface BtoProgressiveResult {
  stages: BtoPaymentStage[];
  totalPrice: number;
  totalDownpayment: number;
  totalCpfUsed: number;
  totalCashNeeded: number;
  loanAmount: number;
  optionFee: number;
}

// Option fees by flat type
const OPTION_FEES: Record<string, number> = {
  '2-room': 500,
  '3-room': 1000,
  '4-room': 2000,
  '5-room': 2000,
  executive: 2000,
};

export function generateBtoSchedule(params: {
  propertyPrice: number;
  flatSize: string;
  totalCpfOa: number;
  grantAmount: number;
  loanType: 'hdb' | 'bank';
  useStaggered: boolean;
}): BtoProgressiveResult {
  const { propertyPrice, flatSize, totalCpfOa, grantAmount, loanType, useStaggered } = params;

  const optionFee = OPTION_FEES[flatSize] ?? 2000;

  // Downpayment and loan amounts
  let dpAtSigning: number;  // % at Agreement for Lease
  let dpAtKey: number;       // % at Key Collection
  let ltvPercent: number;
  let minCashAtSigning: number;

  if (loanType === 'hdb') {
    ltvPercent = 80; // 20% total downpayment
    if (useStaggered) {
      dpAtSigning = 5;   // Staggered: 5% at signing
      dpAtKey = 15;       // 15% at key collection (total 20%)
    } else {
      dpAtSigning = 10;  // Standard: 10% at signing
      dpAtKey = 10;       // 10% at key collection (total 20%)
    }
    minCashAtSigning = 0; // HDB loan: CPF can cover entire downpayment
  } else {
    ltvPercent = 75; // 25% total downpayment
    dpAtSigning = 10; // Bank loan: 5% cash + 5% cash/CPF at signing
    dpAtKey = 15;      // 15% at key collection (total 25%)
    minCashAtSigning = Math.round(propertyPrice * 5 / 100); // 5% must be cash
  }

  const totalDpPercent = 100 - ltvPercent;
  const loanAmount = Math.round(propertyPrice * ltvPercent / 100);

  const signingAmount = Math.round(propertyPrice * dpAtSigning / 100);
  const keyAmount = Math.round(propertyPrice * dpAtKey / 100);
  const totalDownpayment = signingAmount + keyAmount;

  // CPF + grants available
  let cpfRemaining = totalCpfOa + grantAmount;

  // Stage 1: Booking (option fee — cash only)
  const stage1: BtoPaymentStage = {
    stage: 'Booking',
    description: 'Option fee to secure flat',
    timing: 'At flat selection',
    amount: optionFee,
    cpfUsable: 0,
    cashNeeded: optionFee,
    notes: `Cash only (${flatSize} flat)`,
  };

  // Stage 2: Agreement for Lease
  let cpfAtSigning: number;
  let cashAtSigning: number;

  if (loanType === 'hdb') {
    cpfAtSigning = Math.min(cpfRemaining, signingAmount);
    cashAtSigning = signingAmount - cpfAtSigning;
  } else {
    // Bank: 5% must be cash, rest can be CPF
    const cpfEligible = Math.max(0, signingAmount - minCashAtSigning);
    cpfAtSigning = Math.min(cpfRemaining, cpfEligible);
    cashAtSigning = signingAmount - cpfAtSigning;
  }
  cpfRemaining -= cpfAtSigning;

  const stage2: BtoPaymentStage = {
    stage: 'Agreement for Lease',
    description: `${dpAtSigning}% downpayment + stamp duty + legal fees`,
    timing: '~9 months after booking',
    amount: signingAmount,
    cpfUsable: cpfAtSigning,
    cashNeeded: cashAtSigning,
    notes: useStaggered && loanType === 'hdb'
      ? 'Staggered scheme: reduced to 5%'
      : loanType === 'bank'
        ? `Min 5% (${formatSimple(minCashAtSigning)}) must be cash`
        : 'Payable by CPF OA and/or cash',
  };

  // Stage 3: Key Collection
  const cpfAtKey = Math.min(cpfRemaining, keyAmount);
  const cashAtKey = keyAmount - cpfAtKey;
  cpfRemaining -= cpfAtKey;

  const stage3: BtoPaymentStage = {
    stage: 'Key Collection',
    description: `Remaining ${dpAtKey}% downpayment. Loan begins.`,
    timing: '~3-5 years after launch',
    amount: keyAmount,
    cpfUsable: cpfAtKey,
    cashNeeded: cashAtKey,
    notes: 'Grants credited to CPF OA at this stage',
  };

  const stages = [stage1, stage2, stage3];
  const totalCpfUsed = cpfAtSigning + cpfAtKey;
  const totalCashNeeded = optionFee + cashAtSigning + cashAtKey;

  return {
    stages,
    totalPrice: propertyPrice,
    totalDownpayment,
    totalCpfUsed,
    totalCashNeeded,
    loanAmount,
    optionFee,
  };
}

function formatSimple(n: number): string {
  return '$' + n.toLocaleString();
}
