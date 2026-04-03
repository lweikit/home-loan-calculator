/**
 * Progressive Payment Schedule for Private New Launches (Condo / EC)
 *
 * Under the Housing Developers (Control and Licensing) Act,
 * buyers pay progressively as construction milestones are reached.
 * This is the standard schedule prescribed by law.
 *
 * CPF OA grows monthly from contributions — so by the time later
 * milestones are due, you may have accumulated more CPF.
 */

export interface ProgressivePaymentStage {
  stage: string;
  description: string;
  percent: number;
  amount: number;
  cpfAvailableAtStage: number;
  cpfUsable: number;
  cashNeeded: number;
  cumulativePercent: number;
  cumulativeAmount: number;
  estimatedMonth: number;
}

export interface ProgressivePaymentResult {
  stages: ProgressivePaymentStage[];
  totalPrice: number;
  totalCpfUsed: number;
  totalCashNeeded: number;
  loanStartsAtStage: string;
  monthlyCpfContribution: number;
}

// Standard progressive payment schedule (prescribed by law)
// Includes estimated months from booking for each stage
const PROGRESSIVE_STAGES = [
  { stage: 'Booking', description: 'Option fee (Exercise of OTP)', percent: 5, month: 0 },
  { stage: 'Within 8 weeks', description: 'Sign Sale & Purchase Agreement', percent: 15, month: 2 },
  { stage: 'Foundation', description: 'Foundation work completed', percent: 10, month: 12 },
  { stage: 'RC Framework', description: 'Reinforced concrete framework completed', percent: 10, month: 18 },
  { stage: 'Partition Walls', description: 'Partition walls completed', percent: 5, month: 22 },
  { stage: 'Roofing', description: 'Roofing completed', percent: 5, month: 26 },
  { stage: 'Door/Window Frames', description: 'Door and window frames installed', percent: 5, month: 28 },
  { stage: 'Electrical Wiring', description: 'Electrical wiring and plumbing completed', percent: 5, month: 30 },
  { stage: 'Car Park/Roads', description: 'Car park, roads, drains completed', percent: 5, month: 32 },
  { stage: 'TOP', description: 'Temporary Occupation Permit issued', percent: 25, month: 36 },
  { stage: 'CSC', description: 'Certificate of Statutory Completion', percent: 15, month: 48 },
];

export function generateProgressiveSchedule(params: {
  propertyPrice: number;
  totalCpfOa: number;
  minCashPercent: number;
  monthlyCpfContribution: number; // Monthly CPF OA contribution (both owners combined)
}): ProgressivePaymentResult {
  const { propertyPrice, totalCpfOa, minCashPercent, monthlyCpfContribution } = params;

  let cpfBalance = totalCpfOa;
  let lastMonth = 0;
  let cumulativePercent = 0;
  let cumulativeAmount = 0;
  let totalCpfUsed = 0;
  let totalCashNeeded = 0;

  const minCash = Math.round(propertyPrice * minCashPercent / 100);

  const stages: ProgressivePaymentStage[] = PROGRESSIVE_STAGES.map((s, i) => {
    // CPF grows between stages from monthly contributions
    const monthsElapsed = s.month - lastMonth;
    if (monthsElapsed > 0 && i > 0) {
      cpfBalance += monthlyCpfContribution * monthsElapsed;
    }
    lastMonth = s.month;

    const amount = Math.round(propertyPrice * s.percent / 100);
    cumulativePercent += s.percent;
    cumulativeAmount += amount;

    let cpfUsable: number;
    let cashNeeded: number;

    if (i === 0) {
      // Booking fee: 5% must be cash
      cpfUsable = 0;
      cashNeeded = amount;
    } else if (i === 1) {
      // S&P Agreement: 5% already paid in cash at booking
      const cashAlreadyPaid = Math.round(propertyPrice * PROGRESSIVE_STAGES[0].percent / 100);
      const additionalCashNeeded = Math.max(0, minCash - cashAlreadyPaid);
      const cpfEligible = amount - additionalCashNeeded;
      cpfUsable = Math.min(cpfBalance, Math.max(0, cpfEligible));
      cashNeeded = amount - cpfUsable;
    } else {
      // Construction stages onwards: CPF or cash
      cpfUsable = Math.min(cpfBalance, amount);
      cashNeeded = amount - cpfUsable;
    }

    cpfBalance -= cpfUsable;
    totalCpfUsed += cpfUsable;
    totalCashNeeded += cashNeeded;

    return {
      stage: s.stage,
      description: s.description,
      percent: s.percent,
      amount,
      cpfAvailableAtStage: Math.round(cpfBalance + cpfUsable), // before using
      cpfUsable,
      cashNeeded,
      cumulativePercent,
      cumulativeAmount,
      estimatedMonth: s.month,
    };
  });

  return {
    stages,
    totalPrice: propertyPrice,
    totalCpfUsed,
    totalCashNeeded,
    loanStartsAtStage: 'Foundation (after 20% downpayment)',
    monthlyCpfContribution,
  };
}
