'use client';
import { useState, useMemo } from 'react';
import type { PropertyType, BuyingScheme, CitizenshipProfile } from '@/constants/property';
import { HDB_LOAN_RATE, RESALE_LEVY } from '@/constants/property';
import type { GrantInputs } from '@/constants/grants';
import { calculateGrants } from '@/constants/grants';
import {
  calculateAffordability,
  calculateCosts,
  calculateMonthlyPayment,
  calculateDownpayment,
  generateAmortisation,
  isEligibleForHDBLoan,
  getMaxTenure,
} from '@/utils/calculations';
import { simulateCpfUsage, compareCpfCashStrategies } from '@/utils/cpf-simulator';
import { generateBtoSchedule } from '@/utils/bto-progressive';
import { generateProgressiveSchedule } from '@/utils/progressive-payment';
import { checkEligibility, type EligibilityResult } from '@/utils/eligibility';

// CPF OA allocation rates by age band (effective 1 Jan 2026)
// Source: cpf.gov.sg, endowus.com
// [maxAge, oaRate as % of gross]
const CPF_OA_RATES: [number, number][] = [
  [35, 0.23],   // 35 and below: 23%
  [45, 0.21],   // above 35 to 45: 21%
  [50, 0.19],   // above 45 to 50: 19%
  [55, 0.15],   // above 50 to 55: 15%
  [60, 0.12],   // above 55 to 60: 12%
  [65, 0.035],  // above 60 to 65: 3.5%
  [70, 0.01],   // above 65 to 70: 1%
  [Infinity, 0.01], // above 70: 1%
];

// Ordinary wage ceiling: $8,000/mo (from 2026)
const CPF_OW_CEILING = 8000;

function estimateMonthlyCpfOa(grossMonthly: number, age: number): number {
  const cappedWage = Math.min(grossMonthly, CPF_OW_CEILING);
  let oaRate = 0.23;
  for (const [maxAge, rate] of CPF_OA_RATES) {
    if (age <= maxAge) {
      oaRate = rate;
      break;
    }
  }
  return Math.round(cappedWage * oaRate);
}

export interface CalculatorInputs {
  propertyType: PropertyType;
  buyingScheme: BuyingScheme;
  citizenship: CitizenshipProfile;
  propertyCount: number;
  propertyPrice: number;
  valuation: number;
  grossMonthlyIncome: number;
  coApplicantIncome: number;
  existingDebt: number;
  coApplicantDebt: number;
  cpfOaBalance: number;
  cpfOaRetain: number;
  coApplicantCpfOa: number;
  coApplicantCpfRetain: number;
  useStaggeredDp: boolean;
  youngestAge: number;
  remainingLease: number;
  bankRate: number;
  optionFee: number;
  // Grant inputs
  proximity: GrantInputs['proximity'];
  flatSize: GrantInputs['flatSize'];
  timerStatus: GrantInputs['timerStatus'];
  isStepUpEligible: boolean;
  // Eligibility checks
  ownsPrivateProperty: boolean;
  within30Months: boolean;
}

const defaultInputs: CalculatorInputs = {
  propertyType: 'hdb-resale',
  buyingScheme: 'couple',
  citizenship: 'sc-sc',
  propertyCount: 1,
  propertyPrice: 500000,
  valuation: 500000,
  grossMonthlyIncome: 6000,
  coApplicantIncome: 4000,
  existingDebt: 0,
  coApplicantDebt: 0,
  cpfOaBalance: 50000,
  cpfOaRetain: 0,
  coApplicantCpfOa: 30000,
  coApplicantCpfRetain: 0,
  useStaggeredDp: false,
  youngestAge: 30,
  remainingLease: 99,
  bankRate: 3.5,
  optionFee: 1000,
  proximity: 'none',
  flatSize: '4-room',
  timerStatus: 'first',
  isStepUpEligible: false,
  ownsPrivateProperty: false,
  within30Months: false,
};

export function useCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>(defaultInputs);

  const updateInput = <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => {
    setInputs((prev) => {
      const next = { ...prev, [key]: value };

      // Smart defaults when property type changes
      if (key === 'propertyType') {
        const pt = value as PropertyType;
        switch (pt) {
          case 'hdb-bto':
            next.remainingLease = 99;
            next.optionFee = 2000;
            next.valuation = next.propertyPrice;
            next.ownsPrivateProperty = false;
            break;
          case 'hdb-resale':
            next.remainingLease = 90;
            next.optionFee = 1000;
            break;
          case 'ec':
            next.remainingLease = 99;
            next.optionFee = 5000;
            break;
          case 'condo':
          case 'landed':
            next.remainingLease = 99;
            next.optionFee = 5000;
            next.ownsPrivateProperty = false;
            next.within30Months = false;
            break;
        }
      }

      return next;
    });
  };

  const effectiveIncome = useMemo(() => {
    if (inputs.buyingScheme === 'owner-occupier' || inputs.buyingScheme === 'single') {
      return inputs.grossMonthlyIncome;
    }
    return inputs.grossMonthlyIncome + inputs.coApplicantIncome;
  }, [inputs.grossMonthlyIncome, inputs.coApplicantIncome, inputs.buyingScheme]);

  const effectiveDebt = useMemo(() => {
    if (inputs.buyingScheme === 'owner-occupier' || inputs.buyingScheme === 'single') {
      return inputs.existingDebt;
    }
    return inputs.existingDebt + inputs.coApplicantDebt;
  }, [inputs.existingDebt, inputs.coApplicantDebt, inputs.buyingScheme]);

  const totalCpfOa = useMemo(() => {
    const myUsable = Math.max(0, inputs.cpfOaBalance - inputs.cpfOaRetain);
    if (inputs.buyingScheme === 'owner-occupier' || inputs.buyingScheme === 'single') {
      return myUsable;
    }
    const coUsable = Math.max(0, inputs.coApplicantCpfOa - inputs.coApplicantCpfRetain);
    return myUsable + coUsable;
  }, [inputs.cpfOaBalance, inputs.cpfOaRetain, inputs.coApplicantCpfOa, inputs.coApplicantCpfRetain, inputs.buyingScheme]);

  const results = useMemo(() => {
    // Input sanitisation — clamp to reasonable bounds
    const safePrice = Math.max(0, inputs.propertyPrice);
    const safeAge = Math.max(21, Math.min(80, inputs.youngestAge));
    const safeLease = Math.max(0, Math.min(99, inputs.remainingLease));
    const safeBankRate = Math.max(0.1, Math.min(20, inputs.bankRate));

    if (safePrice <= 0 || effectiveIncome <= 0) return null;

    const hdbEligibility = isEligibleForHDBLoan(
      inputs.propertyType,
      inputs.buyingScheme,
      effectiveIncome,
      inputs.citizenship
    );

    // Grants
    const grants = calculateGrants(
      inputs.propertyType,
      inputs.buyingScheme,
      effectiveIncome,
      {
        proximity: inputs.proximity,
        flatSize: inputs.flatSize,
        timerStatus: inputs.timerStatus,
        isStepUpEligible: inputs.isStepUpEligible,
      },
      inputs.citizenship
    );

    // Grants go into CPF OA, so add to available CPF for housing
    const totalCpfWithGrants = totalCpfOa + grants.total;

    // Exercise fee (HDB resale only — tops up option fee to $5,000)
    const exerciseFee = inputs.propertyType === 'hdb-resale'
      ? Math.max(0, 5000 - inputs.optionFee)
      : 0;

    // Resale levy — second-timers who previously owned subsidised HDB
    const isSecondTimer = inputs.timerStatus === 'second';
    const isHdbPurchase = inputs.propertyType === 'hdb-bto' || inputs.propertyType === 'hdb-resale';
    const resaleLevy = (isSecondTimer && isHdbPurchase)
      ? (RESALE_LEVY[inputs.flatSize] ?? 0)
      : 0;

    // HDB Loan
    const hdbTenure = getMaxTenure('hdb', inputs.propertyType, safeAge, safeLease);
    const hdbAffordability = hdbEligibility.eligible
      ? calculateAffordability({
          grossMonthlyIncome: effectiveIncome,
          existingDebt: effectiveDebt,
          propertyPrice: safePrice,
          loanType: 'hdb',
          propertyType: inputs.propertyType,
          propertyCount: inputs.propertyCount,
          annualRate: HDB_LOAN_RATE,
          tenureYears: hdbTenure,
          buyingScheme: inputs.buyingScheme,
        })
      : null;

    const hdbDownpayment = calculateDownpayment(safePrice, 'hdb', inputs.propertyCount, totalCpfWithGrants);
    const hdbLoanAmount = hdbAffordability
      ? Math.min(hdbAffordability.maxLoan, hdbDownpayment.effectiveLoanAmount)
      : 0;
    const hdbMonthly = calculateMonthlyPayment(hdbLoanAmount, HDB_LOAN_RATE, hdbTenure);
    const hdbAmortisation = hdbLoanAmount > 0
      ? generateAmortisation(hdbLoanAmount, HDB_LOAN_RATE, hdbTenure)
      : [];

    // Bank Loan
    const bankTenure = getMaxTenure('bank', inputs.propertyType, safeAge, safeLease);
    const bankAffordability = calculateAffordability({
      grossMonthlyIncome: effectiveIncome,
      existingDebt: effectiveDebt,
      propertyPrice: safePrice,
      loanType: 'bank',
      propertyType: inputs.propertyType,
      propertyCount: inputs.propertyCount,
      annualRate: safeBankRate,
      tenureYears: bankTenure,
      buyingScheme: inputs.buyingScheme,
    });

    const bankDownpayment = calculateDownpayment(safePrice, 'bank', inputs.propertyCount, totalCpfWithGrants);
    const bankLoanAmount = Math.min(bankAffordability.maxLoan, bankDownpayment.effectiveLoanAmount);
    const bankMonthly = calculateMonthlyPayment(bankLoanAmount, safeBankRate, bankTenure);
    const bankAmortisation = bankLoanAmount > 0
      ? generateAmortisation(bankLoanAmount, safeBankRate, bankTenure)
      : [];

    // Costs — separate for each loan type
    const hdbCosts = calculateCosts({
      propertyPrice: safePrice,
      valuation: inputs.valuation,
      propertyType: inputs.propertyType,
      citizenship: inputs.citizenship,
      propertyCount: inputs.propertyCount,
      loanType: 'hdb',
      optionFee: inputs.optionFee,
      exerciseFee,
      totalCpfOa: totalCpfWithGrants,
      resaleLevy,
    });

    const bankCosts = calculateCosts({
      propertyPrice: safePrice,
      valuation: inputs.valuation,
      propertyType: inputs.propertyType,
      citizenship: inputs.citizenship,
      propertyCount: inputs.propertyCount,
      loanType: 'bank',
      optionFee: inputs.optionFee,
      exerciseFee,
      totalCpfOa: totalCpfWithGrants,
      resaleLevy,
    });

    // CPF Simulations — use the preferred loan (HDB if eligible, else bank)
    const primaryMonthly = hdbEligibility.eligible ? hdbMonthly : bankMonthly;
    const primaryTenure = hdbEligibility.eligible ? hdbTenure : bankTenure;
    const primaryDp = hdbEligibility.eligible ? hdbDownpayment : bankDownpayment;

    const cpfSimulation = simulateCpfUsage({
      cpfForDownpayment: primaryDp.cpfForDownpayment,
      cpfForLoan: primaryDp.cpfForLoan,
      monthlyPayment: primaryMonthly,
      monthlyFromCpf: primaryMonthly, // Default: pay monthly from CPF
      tenureYears: primaryTenure,
    });

    const cpfCashStrategies = compareCpfCashStrategies({
      cpfForDownpayment: primaryDp.cpfForDownpayment,
      cpfForLoan: primaryDp.cpfForLoan,
      monthlyPayment: primaryMonthly,
      tenureYears: primaryTenure,
      totalCpfOa: totalCpfWithGrants,
      cashNeeded: primaryDp.cashNeeded,
      totalDownpayment: primaryDp.totalDownpayment,
      minCash: primaryDp.minCash,
    });

    // BTO Payment Schedule
    const btoSchedule = inputs.propertyType === 'hdb-bto'
      ? generateBtoSchedule({
          propertyPrice: safePrice,
          flatSize: inputs.flatSize,
          totalCpfOa: totalCpfOa,
          grantAmount: grants.total,
          loanType: hdbEligibility.eligible ? 'hdb' : 'bank',
          useStaggered: inputs.useStaggeredDp,
        })
      : null;

    return {
      effectiveIncome,
      effectiveDebt,
      totalCpfOa,
      totalCpfWithGrants,
      grants,
      exerciseFee,
      hdbEligibility,
      hdbAffordability,
      hdbTenure,
      hdbDownpayment,
      hdbLoanAmount,
      hdbMonthly,
      hdbAmortisation,
      hdbTotalInterest: hdbAmortisation.length > 0 ? hdbAmortisation[hdbAmortisation.length - 1].totalInterest : 0,
      hdbCosts,
      bankAffordability,
      bankTenure,
      bankDownpayment,
      bankLoanAmount,
      bankMonthly,
      bankAmortisation,
      bankTotalInterest: bankAmortisation.length > 0 ? bankAmortisation[bankAmortisation.length - 1].totalInterest : 0,
      bankCosts,
      cpfSimulation,
      cpfCashStrategies,
      btoSchedule,
      progressiveSchedule: (inputs.propertyType === 'ec' || inputs.propertyType === 'condo')
        ? generateProgressiveSchedule({
            propertyPrice: safePrice,
            totalCpfOa: totalCpfWithGrants,
            minCashPercent: 5,
            monthlyCpfContribution:
              estimateMonthlyCpfOa(inputs.grossMonthlyIncome, inputs.youngestAge) +
              (inputs.buyingScheme !== 'single' && inputs.buyingScheme !== 'owner-occupier'
                ? estimateMonthlyCpfOa(inputs.coApplicantIncome, inputs.youngestAge)
                : 0),
          })
        : null,
    };
  }, [inputs, effectiveIncome, effectiveDebt, totalCpfOa]);

  const eligibility = useMemo<EligibilityResult>(() => {
    return checkEligibility({
      propertyType: inputs.propertyType,
      buyingScheme: inputs.buyingScheme,
      citizenship: inputs.citizenship,
      effectiveIncome,
      youngestAge: inputs.youngestAge,
      remainingLease: inputs.remainingLease,
      flatSize: inputs.flatSize,
      ownsPrivateProperty: inputs.ownsPrivateProperty,
      within30Months: inputs.within30Months,
    });
  }, [inputs.propertyType, inputs.buyingScheme, inputs.citizenship, effectiveIncome,
      inputs.youngestAge, inputs.remainingLease, inputs.flatSize,
      inputs.ownsPrivateProperty, inputs.within30Months]);

  const reset = () => setInputs(defaultInputs);

  return { inputs, updateInput, effectiveIncome, results, reset, eligibility };
}
