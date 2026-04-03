import { calculateMonthlyPayment } from './calculations';

export interface RefinanceResult {
  currentMonthly: number;
  newMonthlyFixed: number;
  newMonthlyFloating: number;
  monthlySavingsFixed: number;
  monthlySavingsFloating: number;
  refinancingCosts: number;
  ltvGap: number;
  breakEvenMonth: number;
  totalSavingsAtEnd: number;
  worthIt: boolean;
  remainingTenure: number;
  outstandingLoan: number;
}

export function analyseRefinancing(params: {
  outstandingLoan: number;
  currentRate: number;
  fixedRate: number;
  fixedPeriodYears: number;
  floatingRate: number;
  remainingTenureYears: number;
  currentPropertyValue: number;
  legalFees?: number;
  lockInPenalty?: number;
  valuationFee?: number;
}): RefinanceResult {
  const {
    outstandingLoan,
    currentRate,
    fixedRate,
    fixedPeriodYears,
    floatingRate,
    remainingTenureYears,
    currentPropertyValue,
    legalFees = 2500,
    lockInPenalty = 0,
    valuationFee = 400,
  } = params;

  // Current loan monthly payment
  const currentMonthly = calculateMonthlyPayment(outstandingLoan, currentRate, remainingTenureYears);

  // New loan: fixed period then floating for remainder
  const newMonthlyFixed = calculateMonthlyPayment(outstandingLoan, fixedRate, remainingTenureYears);
  const newMonthlyFloating = calculateMonthlyPayment(outstandingLoan, floatingRate, remainingTenureYears);

  // Blended savings estimate: fixed period savings + floating period savings
  const fixedMonths = Math.min(fixedPeriodYears * 12, remainingTenureYears * 12);
  const floatingMonths = remainingTenureYears * 12 - fixedMonths;

  const monthlySavingsFixed = currentMonthly - newMonthlyFixed;
  const monthlySavingsFloating = currentMonthly - newMonthlyFloating;

  const totalSavingsFixed = monthlySavingsFixed * fixedMonths;
  const totalSavingsFloating = monthlySavingsFloating * floatingMonths;

  // LTV check: bank lends max 75% of current value
  const maxBankLoan = Math.round(currentPropertyValue * 0.75);
  const ltvGap = Math.max(0, outstandingLoan - maxBankLoan);

  // Refinancing costs
  const penaltyAmount = Math.round(outstandingLoan * lockInPenalty / 100);
  const refinancingCosts = legalFees + penaltyAmount + valuationFee + ltvGap;

  // Break-even based on fixed-rate savings (conservative)
  const breakEvenMonth = monthlySavingsFixed >= 10
    ? Math.ceil(refinancingCosts / monthlySavingsFixed)
    : Infinity;

  const totalSavingsAtEnd = Math.round(totalSavingsFixed + totalSavingsFloating - refinancingCosts);

  const worthIt = breakEvenMonth < remainingTenureYears * 12 && monthlySavingsFixed > 0;

  return {
    currentMonthly,
    newMonthlyFixed,
    newMonthlyFloating,
    monthlySavingsFixed: Math.round(monthlySavingsFixed),
    monthlySavingsFloating: Math.round(monthlySavingsFloating),
    refinancingCosts,
    ltvGap,
    breakEvenMonth: breakEvenMonth === Infinity ? 0 : breakEvenMonth,
    totalSavingsAtEnd,
    worthIt,
    remainingTenure: remainingTenureYears,
    outstandingLoan,
  };
}
