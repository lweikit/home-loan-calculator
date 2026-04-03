import type { PropertyType } from '@/constants/property';

// ─── Conservancy / Maintenance ─────────────────────────
// Approximate monthly S&CC (Service & Conservancy Charges) for HDB
// Condo: maintenance fees vary widely, user should input
const HDB_CONSERVANCY: Record<string, number> = {
  '2-room': 60,
  '3-room': 75,
  '4-room': 90,
  '5-room': 100,
  executive: 110,
};

// ─── Property Tax (Owner-Occupied Rates 2024) ──────────
// Based on Annual Value (AV). Progressive rates.
const PROPERTY_TAX_TIERS = [
  { limit: 8000, rate: 0 },
  { limit: 55000, rate: 0.04 },
  { limit: 70000, rate: 0.06 },
  { limit: 85000, rate: 0.08 },
  { limit: 100000, rate: 0.10 },
  { limit: 115000, rate: 0.12 },
  { limit: 130000, rate: 0.14 },
  { limit: Infinity, rate: 0.16 },
];

export function calculatePropertyTax(annualValue: number): number {
  let remaining = annualValue;
  let prevLimit = 0;
  let tax = 0;

  for (const tier of PROPERTY_TAX_TIERS) {
    const taxable = Math.min(remaining, tier.limit - prevLimit);
    if (taxable <= 0) break;
    tax += taxable * tier.rate;
    remaining -= taxable;
    prevLimit = tier.limit;
  }

  return Math.round(tax);
}

// Rough AV estimate: ~5% of property price for HDB, ~3-4% for private
export function estimateAnnualValue(propertyPrice: number, propertyType: PropertyType): number {
  const isHdb = propertyType === 'hdb-bto' || propertyType === 'hdb-resale';
  const rate = isHdb ? 0.05 : 0.035;
  return Math.round(propertyPrice * rate);
}

// ─── Total Cost of Ownership ───────────────────────────

export interface TotalCostInputs {
  propertyPrice: number;
  propertyType: PropertyType;
  flatSize: string;
  loanAmount: number;
  totalInterest: number;
  bsd: number;
  absd: number;
  legalFeeLow: number;
  legalFeeHigh: number;
  optionFee: number;
  exerciseFee: number;
  ownershipYears: number;
  monthlyMaintenance?: number; // user override for condo/landed
  renovationCost?: number;
}

export interface TotalCostResult {
  // One-time
  stampDuties: number;
  legalFees: [number, number];
  optionAndExercise: number;
  renovationCost: number;
  totalOneTimeLow: number;
  totalOneTimeHigh: number;

  // Monthly recurring
  monthlyMaintenance: number;
  monthlyPropertyTax: number;

  // Over ownership period
  totalMaintenance: number;
  totalPropertyTax: number;
  totalInterest: number;
  annualValue: number;
  annualPropertyTax: number;

  // Grand total
  grandTotalLow: number;
  grandTotalHigh: number;
}

export function calculateTotalCost(inputs: TotalCostInputs): TotalCostResult {
  const {
    propertyPrice,
    propertyType,
    flatSize,
    totalInterest,
    bsd,
    absd,
    legalFeeLow,
    legalFeeHigh,
    optionFee,
    exerciseFee,
    ownershipYears,
    monthlyMaintenance: maintenanceOverride,
    renovationCost = 0,
  } = inputs;

  // One-time costs
  const stampDuties = bsd + absd;
  const optionAndExercise = optionFee + exerciseFee;
  const totalOneTimeLow = stampDuties + legalFeeLow + optionAndExercise + renovationCost;
  const totalOneTimeHigh = stampDuties + legalFeeHigh + optionAndExercise + renovationCost;

  // Monthly maintenance
  const isHdb = propertyType === 'hdb-bto' || propertyType === 'hdb-resale';
  const monthlyMaintenance = maintenanceOverride ?? (isHdb ? (HDB_CONSERVANCY[flatSize] ?? 90) : 400);

  // Property tax
  const annualValue = estimateAnnualValue(propertyPrice, propertyType);
  const annualPropertyTax = calculatePropertyTax(annualValue);
  const monthlyPropertyTax = Math.round(annualPropertyTax / 12);

  // Over ownership period
  const totalMonths = ownershipYears * 12;
  const totalMaintenance = monthlyMaintenance * totalMonths;
  const totalPropertyTax = annualPropertyTax * ownershipYears;

  // Grand total = property price + interest + one-time costs + recurring costs
  const grandTotalLow = propertyPrice + totalInterest + totalOneTimeLow + totalMaintenance + totalPropertyTax;
  const grandTotalHigh = propertyPrice + totalInterest + totalOneTimeHigh + totalMaintenance + totalPropertyTax;

  return {
    stampDuties,
    legalFees: [legalFeeLow, legalFeeHigh],
    optionAndExercise,
    renovationCost,
    totalOneTimeLow,
    totalOneTimeHigh,
    monthlyMaintenance,
    monthlyPropertyTax,
    totalMaintenance,
    totalPropertyTax,
    totalInterest,
    annualValue,
    annualPropertyTax,
    grandTotalLow,
    grandTotalHigh,
  };
}
