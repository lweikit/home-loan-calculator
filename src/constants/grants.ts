import type { PropertyType, BuyingScheme, CitizenshipProfile } from './property';

// ─── EHG (Revised 20 Aug 2024) ────────────────────────
// Family tiers: [income ceiling, grant amount]
export const EHG_FAMILY_TIERS: [number, number][] = [
  [1500, 120000],
  [2000, 110000],
  [2500, 105000],
  [3000, 95000],
  [3500, 90000],
  [4000, 80000],
  [4500, 70000],
  [5000, 65000],
  [5500, 55000],
  [6000, 50000],
  [6500, 40000],
  [7000, 30000],
  [7500, 25000],
  [8000, 20000],
  [8500, 10000],
  [9000, 5000],
];

// Single tiers: [income ceiling, grant amount]
export const EHG_SINGLE_TIERS: [number, number][] = [
  [750, 60000],
  [1000, 55000],
  [1250, 52500],
  [1500, 47500],
  [1750, 45000],
  [2000, 40000],
  [2250, 35000],
  [2500, 32500],
  [2750, 27500],
  [3000, 25000],
  [3250, 20000],
  [3500, 15000],
  [3750, 12500],
  [4000, 10000],
  [4250, 5000],
  [4500, 2500],
];

export const EHG_INCOME_CEILING_FAMILY = 9000;
export const EHG_INCOME_CEILING_SINGLE = 4500;

// ─── CPF Housing Grant (Resale only) ──────────────────
// Family Grant: first-timer, income ceiling $14,000 (family) / $7,000 (single)
export const RESALE_GRANT_INCOME_CEILING_FAMILY = 14000;
export const RESALE_GRANT_INCOME_CEILING_SINGLE = 7000;

export const FAMILY_GRANT = {
  small: { scSc: 80000, scPr: 40000, single: 40000, half: 40000 },  // 2-room to 4-room
  large: { scSc: 50000, scPr: 25000, single: 25000, half: 25000 },  // 5-room and above
};

// ─── EC Family Grant (new EC only) ────────────────────
// [income ceiling, SC+SC amount, SC+PR amount, half-housing amount]
export const EC_FAMILY_GRANT_TIERS: [number, number, number, number][] = [
  [10000, 30000, 20000, 15000],
  [11000, 20000, 10000, 10000],
  [12000, 10000, 0, 5000],
];

// ─── Proximity Housing Grant (HDB only) ───────────────
export const PHG = {
  with: { family: 30000, single: 15000 },
  near: { family: 20000, single: 10000 },
};

// ─── Step-Up Grant ────────────────────────────────────
export const STEP_UP_AMOUNT = 15000;
export const STEP_UP_INCOME_CEILING = 7000;

// ─── Types ────────────────────────────────────────────
export type ProximityType = 'with' | 'near' | 'none';
export type FlatSizeCategory = '2-room' | '3-room' | '4-room' | '5-room' | 'executive';
export type TimerStatus = 'first' | 'second';

export interface GrantInputs {
  proximity: ProximityType;
  flatSize: FlatSizeCategory;
  timerStatus: TimerStatus;
  isStepUpEligible: boolean;
}

export interface GrantResult {
  ehg: number;
  familyGrant: number;
  phg: number;
  stepUp: number;
  total: number;
  breakdown: { name: string; amount: number; reason?: string }[];
}

// ─── Main Calculator ──────────────────────────────────

export function calculateGrants(
  propertyType: PropertyType,
  buyingScheme: BuyingScheme,
  grossMonthlyIncome: number,
  grantInputs: GrantInputs,
  citizenship: CitizenshipProfile = 'sc-sc'
): GrantResult {
  const breakdown: { name: string; amount: number; reason?: string }[] = [];
  const isSingle = buyingScheme === 'single';
  const isFamily = !isSingle;
  const isResale = propertyType === 'hdb-resale';
  const isBto = propertyType === 'hdb-bto';
  const isHdb = isBto || isResale;
  const isEc = propertyType === 'ec';
  const isPrivate = propertyType === 'condo' || propertyType === 'landed';
  const isFirstTimer = grantInputs.timerStatus === 'first';
  const isSmallFlat = ['2-room', '3-room', '4-room'].includes(grantInputs.flatSize);
  const isScSc = citizenship === 'sc-sc';
  const isScPr = citizenship === 'sc-pr' || citizenship === 'sc-foreigner';

  let ehg = 0;
  let familyGrant = 0;
  let phg = 0;
  let stepUp = 0;

  // No grants for condo or landed
  if (isPrivate) {
    return { ehg: 0, familyGrant: 0, phg: 0, stepUp: 0, total: 0, breakdown: [] };
  }

  // ─── EC Grants (new ECs only) ────────────────────────
  if (isEc) {
    if (isFirstTimer && isFamily) {
      for (const [limit, scScAmt, scPrAmt] of EC_FAMILY_GRANT_TIERS) {
        if (grossMonthlyIncome <= limit) {
          familyGrant = isScSc ? scScAmt : scPrAmt;
          break;
        }
      }
      if (familyGrant > 0) {
        breakdown.push({ name: 'CPF Family Grant (EC)', amount: familyGrant });
      } else {
        breakdown.push({ name: 'CPF Family Grant (EC)', amount: 0, reason: 'Income exceeds $12,000 ceiling' });
      }
    } else if (!isFirstTimer && isFamily) {
      for (const [limit, , , halfAmt] of EC_FAMILY_GRANT_TIERS) {
        if (grossMonthlyIncome <= limit) {
          familyGrant = halfAmt;
          break;
        }
      }
      if (familyGrant > 0) {
        breakdown.push({ name: 'CPF Half-Housing Grant (EC)', amount: familyGrant });
      } else {
        breakdown.push({ name: 'CPF Half-Housing Grant (EC)', amount: 0, reason: 'Income exceeds $12,000 ceiling' });
      }
    } else if (isSingle) {
      breakdown.push({ name: 'EC Grants', amount: 0, reason: 'Singles not eligible for new EC purchase' });
    }

    const total = familyGrant;
    return { ehg: 0, familyGrant, phg: 0, stepUp: 0, total, breakdown };
  }

  // ─── HDB Grants ──────────────────────────────────────

  // EHG — first-timer, HDB BTO or resale (revised 20 Aug 2024)
  if (isFirstTimer && isHdb) {
    if (isSingle) {
      if (grossMonthlyIncome <= EHG_INCOME_CEILING_SINGLE) {
        for (const [limit, amt] of EHG_SINGLE_TIERS) {
          if (grossMonthlyIncome <= limit) {
            ehg = amt;
            break;
          }
        }
        // Singles: EHG only for resale (BTO singles limited to 2-room Flexi, still get EHG)
      }
      if (ehg > 0) {
        breakdown.push({ name: 'Enhanced CPF Housing Grant (EHG)', amount: ehg });
      } else if (grossMonthlyIncome > EHG_INCOME_CEILING_SINGLE) {
        breakdown.push({ name: 'EHG', amount: 0, reason: `Income exceeds $${EHG_INCOME_CEILING_SINGLE.toLocaleString()} ceiling` });
      }
    } else {
      if (grossMonthlyIncome <= EHG_INCOME_CEILING_FAMILY) {
        for (const [limit, amt] of EHG_FAMILY_TIERS) {
          if (grossMonthlyIncome <= limit) {
            ehg = amt;
            break;
          }
        }
      }
      if (ehg > 0) {
        breakdown.push({ name: 'Enhanced CPF Housing Grant (EHG)', amount: ehg });
      } else if (grossMonthlyIncome > EHG_INCOME_CEILING_FAMILY) {
        breakdown.push({ name: 'EHG', amount: 0, reason: `Income exceeds $${EHG_INCOME_CEILING_FAMILY.toLocaleString()} ceiling` });
      }
    }
  }

  // CPF Housing Grant (Family/Singles/Half) — resale only
  if (isResale) {
    if (isFirstTimer) {
      const incomeCeiling = isSingle ? RESALE_GRANT_INCOME_CEILING_SINGLE : RESALE_GRANT_INCOME_CEILING_FAMILY;
      if (grossMonthlyIncome <= incomeCeiling) {
        const tier = isSmallFlat ? FAMILY_GRANT.small : FAMILY_GRANT.large;
        if (isSingle) {
          familyGrant = tier.single;
          breakdown.push({ name: 'CPF Housing Grant (Singles)', amount: familyGrant });
        } else if (isScSc) {
          familyGrant = tier.scSc;
          breakdown.push({ name: 'CPF Housing Grant (Family)', amount: familyGrant });
        } else if (isScPr) {
          familyGrant = tier.scPr;
          breakdown.push({ name: 'CPF Housing Grant (Family, SC+PR)', amount: familyGrant });
        }
      } else {
        breakdown.push({ name: 'CPF Housing Grant', amount: 0, reason: `Income exceeds $${(isSingle ? RESALE_GRANT_INCOME_CEILING_SINGLE : RESALE_GRANT_INCOME_CEILING_FAMILY).toLocaleString()} ceiling` });
      }
    } else if (!isFirstTimer && isFamily) {
      // Half-Housing Grant — second-timer
      if (grossMonthlyIncome <= RESALE_GRANT_INCOME_CEILING_FAMILY) {
        const tier = isSmallFlat ? FAMILY_GRANT.small : FAMILY_GRANT.large;
        familyGrant = tier.half;
        breakdown.push({ name: 'CPF Housing Grant (Half)', amount: familyGrant });
      }
    }
  }

  // PHG — HDB only (BTO and resale), no income ceiling
  if (isHdb && grantInputs.proximity !== 'none') {
    const tier = PHG[grantInputs.proximity];
    phg = isFamily ? tier.family : tier.single;
    breakdown.push({
      name: `Proximity Housing Grant (${grantInputs.proximity === 'with' ? 'living with' : 'within 4km'})`,
      amount: phg,
    });
  }

  // Step-Up Grant — second-timer, resale only
  if (isResale && grantInputs.isStepUpEligible && !isFirstTimer && grossMonthlyIncome <= STEP_UP_INCOME_CEILING) {
    stepUp = STEP_UP_AMOUNT;
    breakdown.push({ name: 'Step-Up CPF Housing Grant', amount: stepUp });
  }

  const total = ehg + familyGrant + phg + stepUp;
  return { ehg, familyGrant, phg, stepUp, total, breakdown };
}
