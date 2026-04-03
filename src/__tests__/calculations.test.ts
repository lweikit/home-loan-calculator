import { describe, it, expect } from 'vitest';
import {
  calculateBSD,
  calculateABSD,
  getMaxTenure,
  getLTV,
  isEligibleForHDBLoan,
  calculateMSR,
  calculateTDSR,
  calculateMonthlyPayment,
  maxLoanFromPayment,
  calculateDownpayment,
  generateAmortisation,
} from '@/utils/calculations';

// ─── BSD ───────────────────────────────────────────────

describe('calculateBSD', () => {
  it('calculates BSD for $500K (shortcut: 3% * 500000 - 5400 = 9600)', () => {
    expect(calculateBSD(500000)).toBe(9600);
  });

  it('calculates BSD for $360K', () => {
    // 180000 * 1% + 180000 * 2% = 1800 + 3600 = 5400
    expect(calculateBSD(360000)).toBe(5400);
  });

  it('calculates BSD for $1M', () => {
    // 1800 + 3600 + 19200 = 24600
    expect(calculateBSD(1000000)).toBe(24600);
  });

  it('calculates BSD for $1.5M', () => {
    // 1800 + 3600 + 19200 + 20000 = 44600
    expect(calculateBSD(1500000)).toBe(44600);
  });

  it('calculates BSD for $3M', () => {
    // 1800 + 3600 + 19200 + 20000 + 75000 = 119600
    expect(calculateBSD(3000000)).toBe(119600);
  });

  it('returns 0 for $0', () => {
    expect(calculateBSD(0)).toBe(0);
  });
});

// ─── ABSD ──────────────────────────────────────────────

describe('calculateABSD', () => {
  it('SC+SC 1st property = 0%', () => {
    expect(calculateABSD(500000, 'sc-sc', 1)).toBe(0);
  });

  it('SC+SC 2nd property = 20%', () => {
    expect(calculateABSD(500000, 'sc-sc', 2)).toBe(100000);
  });

  it('SC+SC 3rd property = 30%', () => {
    expect(calculateABSD(500000, 'sc-sc', 3)).toBe(150000);
  });

  it('PR+PR 1st property = 5%', () => {
    expect(calculateABSD(1000000, 'pr-pr', 1)).toBe(50000);
  });

  it('PR+PR 2nd property = 30%', () => {
    expect(calculateABSD(1000000, 'pr-pr', 2)).toBe(300000);
  });
});

// ─── Tenure ────────────────────────────────────────────

describe('getMaxTenure', () => {
  it('HDB loan: max 25 years, capped at age 65', () => {
    expect(getMaxTenure('hdb', 'hdb-resale', 30, 90)).toBe(25);
  });

  it('HDB loan: age 50 = max 15 years', () => {
    expect(getMaxTenure('hdb', 'hdb-resale', 50, 90)).toBe(15);
  });

  it('bank loan on HDB: max 30 years, capped at 65', () => {
    expect(getMaxTenure('bank', 'hdb-resale', 30, 90)).toBe(30);
  });

  it('bank loan on private: max 35 years, capped at 65', () => {
    expect(getMaxTenure('bank', 'condo', 30)).toBe(35);
  });

  it('returns 0 for age >= 65', () => {
    expect(getMaxTenure('hdb', 'hdb-resale', 65, 90)).toBe(0);
  });
});

// ─── LTV ───────────────────────────────────────────────

describe('getLTV', () => {
  it('HDB loan = 80%', () => {
    expect(getLTV('hdb', 1)).toBe(80);
  });

  it('bank 1st property = 75%', () => {
    expect(getLTV('bank', 1)).toBe(75);
  });

  it('bank 2nd property = 45%', () => {
    expect(getLTV('bank', 2)).toBe(45);
  });

  it('bank 3rd property = 35%', () => {
    expect(getLTV('bank', 3)).toBe(35);
  });
});

// ─── HDB Loan Eligibility ─────────────────────────────

describe('isEligibleForHDBLoan', () => {
  it('eligible for SC+SC couple under income ceiling', () => {
    const r = isEligibleForHDBLoan('hdb-resale', 'couple', 10000, 'sc-sc');
    expect(r.eligible).toBe(true);
  });

  it('not eligible if income exceeds ceiling', () => {
    const r = isEligibleForHDBLoan('hdb-resale', 'couple', 15000, 'sc-sc');
    expect(r.eligible).toBe(false);
  });

  it('not eligible for PR+PR', () => {
    const r = isEligibleForHDBLoan('hdb-resale', 'couple', 5000, 'pr-pr');
    expect(r.eligible).toBe(false);
  });

  it('not eligible for EC', () => {
    const r = isEligibleForHDBLoan('ec', 'couple', 5000, 'sc-sc');
    expect(r.eligible).toBe(false);
  });

  it('single income ceiling is $7,000', () => {
    expect(isEligibleForHDBLoan('hdb-resale', 'single', 7000, 'sc-sc').eligible).toBe(true);
    expect(isEligibleForHDBLoan('hdb-resale', 'single', 7001, 'sc-sc').eligible).toBe(false);
  });
});

// ─── MSR / TDSR ────────────────────────────────────────

describe('MSR and TDSR', () => {
  it('MSR = 30% of income', () => {
    expect(calculateMSR(10000)).toBe(3000);
  });

  it('TDSR = 55% of income minus debt', () => {
    expect(calculateTDSR(10000, 500)).toBe(5000);
  });

  it('TDSR floors at 0 when debt exceeds limit', () => {
    expect(calculateTDSR(1000, 10000)).toBe(0);
  });
});

// ─── Monthly Payment ───────────────────────────────────

describe('calculateMonthlyPayment', () => {
  it('returns 0 for 0 principal', () => {
    expect(calculateMonthlyPayment(0, 2.6, 25)).toBe(0);
  });

  it('returns 0 for 0 tenure', () => {
    expect(calculateMonthlyPayment(400000, 2.6, 0)).toBe(0);
  });

  it('calculates correctly for $400K at 2.6% over 25 years', () => {
    const monthly = calculateMonthlyPayment(400000, 2.6, 25);
    // Expected ~$1,812
    expect(monthly).toBeGreaterThan(1800);
    expect(monthly).toBeLessThan(1830);
  });

  it('handles 0% rate', () => {
    const monthly = calculateMonthlyPayment(120000, 0, 10);
    expect(monthly).toBe(1000);
  });
});

// ─── Downpayment ───────────────────────────────────────

describe('calculateDownpayment', () => {
  it('HDB loan: 80% LTV, no minimum cash', () => {
    const dp = calculateDownpayment(500000, 'hdb', 1, 100000);
    expect(dp.ltv).toBe(80);
    expect(dp.loanAmount).toBe(400000);
    expect(dp.totalDownpayment).toBe(100000);
    expect(dp.minCash).toBe(0);
    expect(dp.cpfForDownpayment).toBe(100000);
    expect(dp.cashNeeded).toBe(0);
  });

  it('bank loan: 75% LTV, 5% min cash', () => {
    const dp = calculateDownpayment(500000, 'bank', 1, 100000);
    expect(dp.ltv).toBe(75);
    expect(dp.loanAmount).toBe(375000);
    expect(dp.totalDownpayment).toBe(125000);
    expect(dp.minCash).toBe(25000);
  });

  it('excess CPF reduces loan amount', () => {
    const dp = calculateDownpayment(500000, 'hdb', 1, 200000);
    expect(dp.cpfForDownpayment).toBe(100000);
    expect(dp.cpfForLoan).toBe(100000);
    expect(dp.effectiveLoanAmount).toBe(300000);
  });

  it('no CPF = all cash', () => {
    const dp = calculateDownpayment(500000, 'hdb', 1, 0);
    expect(dp.cashNeeded).toBe(100000);
    expect(dp.cpfForDownpayment).toBe(0);
  });
});

// ─── Amortisation ──────────────────────────────────────

describe('generateAmortisation', () => {
  it('generates correct number of entries', () => {
    const entries = generateAmortisation(400000, 2.6, 25);
    expect(entries.length).toBe(300);
  });

  it('balance reaches 0 at end', () => {
    const entries = generateAmortisation(400000, 2.6, 25);
    expect(entries[entries.length - 1].balance).toBe(0);
  });

  it('total principal equals loan amount', () => {
    const entries = generateAmortisation(400000, 2.6, 25);
    const lastEntry = entries[entries.length - 1];
    expect(lastEntry.totalPrincipal).toBe(400000);
  });

  it('interest decreases over time', () => {
    const entries = generateAmortisation(400000, 2.6, 25);
    expect(entries[0].interest).toBeGreaterThan(entries[entries.length - 1].interest);
  });

  it('principal increases over time', () => {
    const entries = generateAmortisation(400000, 2.6, 25);
    expect(entries[0].principal).toBeLessThan(entries[entries.length - 2].principal);
  });
});
