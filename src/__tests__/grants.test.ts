import { describe, it, expect } from 'vitest';
import { calculateGrants } from '@/constants/grants';

describe('calculateGrants — HDB BTO', () => {
  it('first-timer family, income $3,000 → EHG $95,000', () => {
    const r = calculateGrants('hdb-bto', 'couple', 3000, {
      proximity: 'none', flatSize: '4-room', timerStatus: 'first', isStepUpEligible: false,
    }, 'sc-sc');
    expect(r.ehg).toBe(95000);
    expect(r.familyGrant).toBe(0); // Family Grant is resale only
  });

  it('first-timer family, income $9,000 → EHG $5,000', () => {
    const r = calculateGrants('hdb-bto', 'couple', 9000, {
      proximity: 'none', flatSize: '4-room', timerStatus: 'first', isStepUpEligible: false,
    }, 'sc-sc');
    expect(r.ehg).toBe(5000);
  });

  it('income above $9,000 → no EHG', () => {
    const r = calculateGrants('hdb-bto', 'couple', 10000, {
      proximity: 'none', flatSize: '4-room', timerStatus: 'first', isStepUpEligible: false,
    }, 'sc-sc');
    expect(r.ehg).toBe(0);
  });

  it('second-timer → no EHG', () => {
    const r = calculateGrants('hdb-bto', 'couple', 3000, {
      proximity: 'none', flatSize: '4-room', timerStatus: 'second', isStepUpEligible: false,
    }, 'sc-sc');
    expect(r.ehg).toBe(0);
  });

  it('first-timer with PHG (near parents)', () => {
    const r = calculateGrants('hdb-bto', 'couple', 3000, {
      proximity: 'near', flatSize: '4-room', timerStatus: 'first', isStepUpEligible: false,
    }, 'sc-sc');
    expect(r.phg).toBe(20000);
  });
});

describe('calculateGrants — HDB Resale', () => {
  it('first-timer SC+SC family, 4-room → EHG + Family Grant $80K', () => {
    const r = calculateGrants('hdb-resale', 'couple', 3000, {
      proximity: 'none', flatSize: '4-room', timerStatus: 'first', isStepUpEligible: false,
    }, 'sc-sc');
    expect(r.ehg).toBe(95000);
    expect(r.familyGrant).toBe(80000);
    expect(r.total).toBe(175000);
  });

  it('first-timer SC+PR family, 4-room → Family Grant $40K', () => {
    const r = calculateGrants('hdb-resale', 'couple', 3000, {
      proximity: 'none', flatSize: '4-room', timerStatus: 'first', isStepUpEligible: false,
    }, 'sc-pr');
    expect(r.familyGrant).toBe(40000);
  });

  it('first-timer family, 5-room → Family Grant $50K', () => {
    const r = calculateGrants('hdb-resale', 'couple', 3000, {
      proximity: 'none', flatSize: '5-room', timerStatus: 'first', isStepUpEligible: false,
    }, 'sc-sc');
    expect(r.familyGrant).toBe(50000);
  });

  it('first-timer single, 4-room → Singles Grant $40K', () => {
    const r = calculateGrants('hdb-resale', 'single', 3000, {
      proximity: 'none', flatSize: '4-room', timerStatus: 'first', isStepUpEligible: false,
    }, 'sc-sc');
    expect(r.familyGrant).toBe(40000);
  });

  it('second-timer family → Half-Housing Grant', () => {
    const r = calculateGrants('hdb-resale', 'couple', 3000, {
      proximity: 'none', flatSize: '4-room', timerStatus: 'second', isStepUpEligible: false,
    }, 'sc-sc');
    expect(r.familyGrant).toBe(40000);
    expect(r.ehg).toBe(0);
  });

  it('max grants: first-timer family, 4-room, income $1,500, living with parents', () => {
    const r = calculateGrants('hdb-resale', 'couple', 1500, {
      proximity: 'with', flatSize: '4-room', timerStatus: 'first', isStepUpEligible: false,
    }, 'sc-sc');
    // EHG $120K + Family $80K + PHG $30K = $230K
    expect(r.ehg).toBe(120000);
    expect(r.familyGrant).toBe(80000);
    expect(r.phg).toBe(30000);
    expect(r.total).toBe(230000);
  });

  it('income above grant ceiling → no Family Grant', () => {
    const r = calculateGrants('hdb-resale', 'couple', 15000, {
      proximity: 'none', flatSize: '4-room', timerStatus: 'first', isStepUpEligible: false,
    }, 'sc-sc');
    expect(r.familyGrant).toBe(0);
  });
});

describe('calculateGrants — EC', () => {
  it('first-timer SC+SC, income $10K → Family Grant $30K', () => {
    const r = calculateGrants('ec', 'couple', 10000, {
      proximity: 'none', flatSize: '4-room', timerStatus: 'first', isStepUpEligible: false,
    }, 'sc-sc');
    expect(r.familyGrant).toBe(30000);
    expect(r.ehg).toBe(0);
    expect(r.phg).toBe(0);
  });

  it('first-timer SC+PR, income $10K → Family Grant $20K', () => {
    const r = calculateGrants('ec', 'couple', 10000, {
      proximity: 'none', flatSize: '4-room', timerStatus: 'first', isStepUpEligible: false,
    }, 'sc-pr');
    expect(r.familyGrant).toBe(20000);
  });

  it('income above $12K → no grants', () => {
    const r = calculateGrants('ec', 'couple', 13000, {
      proximity: 'none', flatSize: '4-room', timerStatus: 'first', isStepUpEligible: false,
    }, 'sc-sc');
    expect(r.familyGrant).toBe(0);
    expect(r.total).toBe(0);
  });

  it('singles → no grants', () => {
    const r = calculateGrants('ec', 'single', 5000, {
      proximity: 'none', flatSize: '4-room', timerStatus: 'first', isStepUpEligible: false,
    }, 'sc-sc');
    expect(r.total).toBe(0);
  });
});

describe('calculateGrants — Private', () => {
  it('condo → no grants', () => {
    const r = calculateGrants('condo', 'couple', 5000, {
      proximity: 'none', flatSize: '4-room', timerStatus: 'first', isStepUpEligible: false,
    }, 'sc-sc');
    expect(r.total).toBe(0);
  });

  it('landed → no grants', () => {
    const r = calculateGrants('landed', 'couple', 5000, {
      proximity: 'none', flatSize: '4-room', timerStatus: 'first', isStepUpEligible: false,
    }, 'sc-sc');
    expect(r.total).toBe(0);
  });
});
