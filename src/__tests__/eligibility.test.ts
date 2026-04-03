import { describe, it, expect } from 'vitest';
import { checkEligibility } from '@/utils/eligibility';

const base = {
  propertyType: 'hdb-resale' as const,
  buyingScheme: 'couple' as const,
  citizenship: 'sc-sc' as const,
  effectiveIncome: 10000,
  youngestAge: 30,
  remainingLease: 90,
  flatSize: '4-room' as const,
  ownsPrivateProperty: false,
  within30Months: false,
};

describe('checkEligibility', () => {
  it('standard HDB resale couple passes', () => {
    const r = checkEligibility(base);
    expect(r.canProceed).toBe(true);
    expect(r.issues.filter((i) => i.type === 'blocker')).toHaveLength(0);
  });

  it('PR+PR blocked for HDB', () => {
    const r = checkEligibility({ ...base, citizenship: 'pr-pr' });
    expect(r.canProceed).toBe(false);
    expect(r.issues.some((i) => i.message.includes('Singapore Citizen'))).toBe(true);
  });

  it('owns private property blocks HDB', () => {
    const r = checkEligibility({ ...base, ownsPrivateProperty: true });
    expect(r.canProceed).toBe(false);
  });

  it('30-month rule blocks HDB resale', () => {
    const r = checkEligibility({ ...base, within30Months: true });
    expect(r.canProceed).toBe(false);
  });

  it('30-month rule blocks BTO', () => {
    const r = checkEligibility({ ...base, propertyType: 'hdb-bto', within30Months: true });
    expect(r.canProceed).toBe(false);
  });

  it('30-month rule blocks EC', () => {
    const r = checkEligibility({ ...base, propertyType: 'ec', within30Months: true });
    expect(r.canProceed).toBe(false);
  });

  it('30-month rule does NOT block condo', () => {
    const r = checkEligibility({ ...base, propertyType: 'condo', within30Months: true });
    expect(r.canProceed).toBe(true);
  });

  it('single under 35 blocked', () => {
    const r = checkEligibility({ ...base, buyingScheme: 'single', youngestAge: 30 });
    expect(r.canProceed).toBe(false);
  });

  it('single 35+ can buy resale', () => {
    const r = checkEligibility({ ...base, buyingScheme: 'single', youngestAge: 35 });
    expect(r.canProceed).toBe(true);
  });

  it('BTO single can only buy 2-room', () => {
    const r = checkEligibility({
      ...base, propertyType: 'hdb-bto', buyingScheme: 'single', youngestAge: 35, flatSize: '4-room',
    });
    expect(r.canProceed).toBe(false);
    expect(r.issues.some((i) => i.message.includes('2-Room'))).toBe(true);
  });

  it('BTO single 2-room passes', () => {
    const r = checkEligibility({
      ...base, propertyType: 'hdb-bto', buyingScheme: 'single', youngestAge: 35,
      flatSize: '2-room', effectiveIncome: 5000,
    });
    expect(r.canProceed).toBe(true);
  });

  it('BTO income ceiling blocks 4-room above $14K', () => {
    const r = checkEligibility({ ...base, propertyType: 'hdb-bto', effectiveIncome: 15000 });
    expect(r.canProceed).toBe(false);
  });

  it('EC income ceiling blocks above $16K', () => {
    const r = checkEligibility({ ...base, propertyType: 'ec', effectiveIncome: 17000 });
    expect(r.canProceed).toBe(false);
  });

  it('EC singles blocked', () => {
    const r = checkEligibility({ ...base, propertyType: 'ec', buyingScheme: 'single', youngestAge: 35 });
    expect(r.canProceed).toBe(false);
  });

  it('remaining lease under 20 years warns', () => {
    const r = checkEligibility({ ...base, remainingLease: 18 });
    expect(r.issues.some((i) => i.message.includes('CPF cannot be used'))).toBe(true);
  });

  it('condo has no income ceiling', () => {
    const r = checkEligibility({ ...base, propertyType: 'condo', effectiveIncome: 100000 });
    expect(r.canProceed).toBe(true);
  });

  it('private property ownership does NOT block condo', () => {
    const r = checkEligibility({ ...base, propertyType: 'condo', ownsPrivateProperty: true });
    expect(r.canProceed).toBe(true);
  });
});
