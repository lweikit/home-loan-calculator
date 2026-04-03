import { describe, it, expect } from 'vitest';
import { simulateCpfUsage, compareCpfCashStrategies } from '@/utils/cpf-simulator';

describe('simulateCpfUsage', () => {
  it('generates correct number of entries', () => {
    const r = simulateCpfUsage({
      cpfForDownpayment: 100000,
      cpfForLoan: 0,
      monthlyPayment: 1800,
      monthlyFromCpf: 1800,
      tenureYears: 25,
    });
    expect(r.entries.length).toBe(300);
    expect(r.yearlyEntries.length).toBe(25);
  });

  it('total withdrawn = downpayment + monthly * months', () => {
    const r = simulateCpfUsage({
      cpfForDownpayment: 50000,
      cpfForLoan: 0,
      monthlyPayment: 1000,
      monthlyFromCpf: 1000,
      tenureYears: 10,
    });
    expect(r.totalCpfWithdrawn).toBe(50000 + 1000 * 120);
  });

  it('accrued interest is positive', () => {
    const r = simulateCpfUsage({
      cpfForDownpayment: 100000,
      cpfForLoan: 0,
      monthlyPayment: 1800,
      monthlyFromCpf: 1800,
      tenureYears: 25,
    });
    expect(r.totalAccruedInterest).toBeGreaterThan(0);
  });

  it('total owed > total withdrawn (because of interest)', () => {
    const r = simulateCpfUsage({
      cpfForDownpayment: 100000,
      cpfForLoan: 0,
      monthlyPayment: 1800,
      monthlyFromCpf: 1800,
      tenureYears: 25,
    });
    expect(r.totalOwedToCpf).toBeGreaterThan(r.totalCpfWithdrawn);
  });

  it('zero monthly CPF = only upfront interest', () => {
    const r = simulateCpfUsage({
      cpfForDownpayment: 100000,
      cpfForLoan: 0,
      monthlyPayment: 1800,
      monthlyFromCpf: 0,
      tenureYears: 25,
    });
    expect(r.totalCpfWithdrawn).toBe(100000);
    expect(r.totalAccruedInterest).toBeGreaterThan(0);
  });
});

describe('compareCpfCashStrategies', () => {
  it('returns 3 strategies', () => {
    const r = compareCpfCashStrategies({
      cpfForDownpayment: 100000,
      cpfForLoan: 0,
      monthlyPayment: 1800,
      tenureYears: 25,
      totalCpfOa: 100000,
      cashNeeded: 0,
      totalDownpayment: 100000,
      minCash: 0,
    });
    expect(r).toHaveLength(3);
    expect(r.map((s) => s.label)).toEqual(['Max CPF', 'Max Cash', 'Balanced']);
  });

  it('Max Cash has zero CPF withdrawn', () => {
    const r = compareCpfCashStrategies({
      cpfForDownpayment: 100000,
      cpfForLoan: 0,
      monthlyPayment: 1800,
      tenureYears: 25,
      totalCpfOa: 100000,
      cashNeeded: 0,
      totalDownpayment: 100000,
      minCash: 0,
    });
    const maxCash = r.find((s) => s.label === 'Max Cash')!;
    expect(maxCash.totalCpfWithdrawn).toBe(0);
    expect(maxCash.totalOwedToCpf).toBe(0);
  });

  it('Max CPF has highest owed to CPF', () => {
    const r = compareCpfCashStrategies({
      cpfForDownpayment: 100000,
      cpfForLoan: 0,
      monthlyPayment: 1800,
      tenureYears: 25,
      totalCpfOa: 100000,
      cashNeeded: 0,
      totalDownpayment: 100000,
      minCash: 0,
    });
    const maxCpf = r.find((s) => s.label === 'Max CPF')!;
    const balanced = r.find((s) => s.label === 'Balanced')!;
    expect(maxCpf.totalOwedToCpf).toBeGreaterThan(balanced.totalOwedToCpf);
  });
});
