import { describe, it, expect } from 'vitest';
import { calculateCosts, calculateAffordability } from '@/utils/calculations';
import { analyseRefinancing } from '@/utils/refinancing';
import { calculatePropertyTax, estimateAnnualValue } from '@/utils/total-cost';
import { generateBtoSchedule } from '@/utils/bto-progressive';

// ─── calculateCosts ────────────────────────────────────

describe('calculateCosts', () => {
  it('HDB resale includes valuation fee and exercise fee', () => {
    const c = calculateCosts({
      propertyPrice: 500000,
      valuation: 480000,
      propertyType: 'hdb-resale',
      citizenship: 'sc-sc',
      propertyCount: 1,
      loanType: 'hdb',
      optionFee: 1000,
      exerciseFee: 4000,
      totalCpfOa: 100000,
    });
    expect(c.valuationFee).toBe(120);
    expect(c.exerciseFee).toBe(4000);
    expect(c.cov).toBe(20000);
    expect(c.bsd).toBe(9600);
    expect(c.absd).toBe(0);
  });

  it('condo has no valuation fee, no COV, no exercise fee', () => {
    const c = calculateCosts({
      propertyPrice: 1000000,
      valuation: 900000,
      propertyType: 'condo',
      citizenship: 'sc-sc',
      propertyCount: 1,
      loanType: 'bank',
      optionFee: 5000,
    });
    expect(c.valuationFee).toBe(0);
    expect(c.cov).toBe(0);
    expect(c.exerciseFee).toBe(0);
  });

  it('resale levy is included in cash outlay', () => {
    const c = calculateCosts({
      propertyPrice: 500000,
      valuation: 500000,
      propertyType: 'hdb-resale',
      citizenship: 'sc-sc',
      propertyCount: 1,
      loanType: 'hdb',
      optionFee: 1000,
      exerciseFee: 4000,
      totalCpfOa: 100000,
      resaleLevy: 30000,
    });
    expect(c.resaleLevy).toBe(30000);
    expect(c.totalCashOutlayLow).toBeGreaterThan(30000);
  });
});

// ─── calculateAffordability ────────────────────────────

describe('calculateAffordability', () => {
  it('HDB loan: returns valid results with MSR < TDSR', () => {
    const r = calculateAffordability({
      grossMonthlyIncome: 10000,
      existingDebt: 0,
      propertyPrice: 500000,
      loanType: 'hdb',
      propertyType: 'hdb-resale',
      propertyCount: 1,
      annualRate: 2.6,
      tenureYears: 25,
      buyingScheme: 'couple',
    });
    expect(r.maxLoan).toBeGreaterThan(0);
    expect(r.maxLoanMSR).toBeLessThan(r.maxLoanTDSR);
    // For $500K at 80% LTV = $400K, MSR allows ~$640K — LTV is binding
    expect(r.maxLoanLTV).toBe(400000);
  });

  it('private condo: MSR does not apply (TDSR only)', () => {
    const r = calculateAffordability({
      grossMonthlyIncome: 10000,
      existingDebt: 0,
      propertyPrice: 1000000,
      loanType: 'bank',
      propertyType: 'condo',
      propertyCount: 1,
      annualRate: 3.5,
      tenureYears: 30,
      buyingScheme: 'couple',
    });
    // MSR should be Infinity for condo → not the binding constraint
    expect(r.bindingConstraint).not.toBe('MSR');
  });

  it('high debt reduces TDSR allowance', () => {
    const withoutDebt = calculateAffordability({
      grossMonthlyIncome: 10000, existingDebt: 0,
      propertyPrice: 500000, loanType: 'bank', propertyType: 'condo',
      propertyCount: 1, annualRate: 3.5, tenureYears: 25, buyingScheme: 'couple',
    });
    const withDebt = calculateAffordability({
      grossMonthlyIncome: 10000, existingDebt: 3000,
      propertyPrice: 500000, loanType: 'bank', propertyType: 'condo',
      propertyCount: 1, annualRate: 3.5, tenureYears: 25, buyingScheme: 'couple',
    });
    expect(withDebt.maxLoanTDSR).toBeLessThan(withoutDebt.maxLoanTDSR);
  });
});

// ─── analyseRefinancing ────────────────────────────────

describe('analyseRefinancing', () => {
  it('lower rate saves money', () => {
    const r = analyseRefinancing({
      outstandingLoan: 350000,
      currentRate: 2.6,
      fixedRate: 2.28,
      fixedPeriodYears: 2,
      floatingRate: 2.5,
      remainingTenureYears: 20,
      currentPropertyValue: 500000,
      legalFees: 2500,
      lockInPenalty: 0,
    });
    expect(r.monthlySavingsFixed).toBeGreaterThan(0);
    expect(r.worthIt).toBe(true);
    expect(r.breakEvenMonth).toBeGreaterThan(0);
  });

  it('higher rate is not worth it', () => {
    const r = analyseRefinancing({
      outstandingLoan: 350000,
      currentRate: 2.6,
      fixedRate: 3.5,
      fixedPeriodYears: 2,
      floatingRate: 3.5,
      remainingTenureYears: 20,
      currentPropertyValue: 500000,
    });
    expect(r.monthlySavingsFixed).toBeLessThan(0);
    expect(r.worthIt).toBe(false);
  });

  it('LTV gap calculated when loan > 75% of value', () => {
    const r = analyseRefinancing({
      outstandingLoan: 400000,
      currentRate: 2.6,
      fixedRate: 2.28,
      fixedPeriodYears: 2,
      floatingRate: 2.5,
      remainingTenureYears: 20,
      currentPropertyValue: 500000, // 75% = 375K, gap = 25K
    });
    expect(r.ltvGap).toBe(25000);
  });

  it('no LTV gap when loan < 75% of value', () => {
    const r = analyseRefinancing({
      outstandingLoan: 300000,
      currentRate: 2.6,
      fixedRate: 2.28,
      fixedPeriodYears: 2,
      floatingRate: 2.5,
      remainingTenureYears: 20,
      currentPropertyValue: 500000,
    });
    expect(r.ltvGap).toBe(0);
  });
});

// ─── Property Tax ──────────────────────────────────────

describe('calculatePropertyTax', () => {
  it('first $8,000 AV is tax-free', () => {
    expect(calculatePropertyTax(8000)).toBe(0);
  });

  it('$20,000 AV = 4% on $12,000 = $480', () => {
    expect(calculatePropertyTax(20000)).toBe(480);
  });

  it('$0 AV = $0 tax', () => {
    expect(calculatePropertyTax(0)).toBe(0);
  });
});

describe('estimateAnnualValue', () => {
  it('HDB uses 5% rate', () => {
    expect(estimateAnnualValue(500000, 'hdb-resale')).toBe(25000);
  });

  it('condo uses 3.5% rate', () => {
    expect(estimateAnnualValue(1000000, 'condo')).toBe(35000);
  });
});

// ─── BTO Schedule ──────────────────────────────────────

describe('generateBtoSchedule', () => {
  it('standard HDB loan: 3 stages totalling 20%', () => {
    const s = generateBtoSchedule({
      propertyPrice: 400000,
      flatSize: '4-room',
      totalCpfOa: 50000,
      grantAmount: 0,
      loanType: 'hdb',
      useStaggered: false,
    });
    expect(s.stages).toHaveLength(3);
    expect(s.totalDownpayment).toBe(80000); // 20% of 400K
    expect(s.loanAmount).toBe(320000);
  });

  it('staggered: 5% at signing + 15% at key = 20% total', () => {
    const s = generateBtoSchedule({
      propertyPrice: 400000,
      flatSize: '4-room',
      totalCpfOa: 50000,
      grantAmount: 0,
      loanType: 'hdb',
      useStaggered: true,
    });
    // Signing = 5% = $20K, Key = 15% = $60K
    expect(s.stages[1].amount).toBe(20000);
    expect(s.stages[2].amount).toBe(60000);
    expect(s.totalDownpayment).toBe(80000);
  });

  it('bank loan: 25% total DP', () => {
    const s = generateBtoSchedule({
      propertyPrice: 400000,
      flatSize: '4-room',
      totalCpfOa: 50000,
      grantAmount: 0,
      loanType: 'bank',
      useStaggered: false,
    });
    expect(s.totalDownpayment).toBe(100000); // 25% of 400K
    expect(s.loanAmount).toBe(300000);
  });

  it('option fee is always cash', () => {
    const s = generateBtoSchedule({
      propertyPrice: 400000,
      flatSize: '4-room',
      totalCpfOa: 200000,
      grantAmount: 0,
      loanType: 'hdb',
      useStaggered: false,
    });
    expect(s.stages[0].cpfUsable).toBe(0);
    expect(s.stages[0].cashNeeded).toBe(2000);
  });
});
