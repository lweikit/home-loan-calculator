import type { PropertyType, BuyingScheme, CitizenshipProfile } from '@/constants/property';
import {
  BTO_INCOME_CEILING_SMALL,
  BTO_INCOME_CEILING_LARGE,
  EC_INCOME_CEILING,
  MIN_AGE_SINGLE,
  MIN_AGE_FAMILY,
  MIN_LEASE_FOR_CPF,
  HDB_LEASE_COVERAGE_AGE,
} from '@/constants/property';
import type { FlatSizeCategory } from '@/constants/grants';

export interface EligibilityIssue {
  type: 'blocker' | 'warning';
  message: string;
}

export interface EligibilityResult {
  canProceed: boolean;
  issues: EligibilityIssue[];
}

export function checkEligibility(params: {
  propertyType: PropertyType;
  buyingScheme: BuyingScheme;
  citizenship: CitizenshipProfile;
  effectiveIncome: number;
  youngestAge: number;
  remainingLease: number;
  flatSize: FlatSizeCategory;
  ownsPrivateProperty: boolean;
  within30Months: boolean;
}): EligibilityResult {
  const {
    propertyType,
    buyingScheme,
    citizenship,
    effectiveIncome,
    youngestAge,
    remainingLease,
    flatSize,
    ownsPrivateProperty,
    within30Months,
  } = params;

  const issues: EligibilityIssue[] = [];
  const isSingle = buyingScheme === 'single';
  const isHdb = propertyType === 'hdb-bto' || propertyType === 'hdb-resale';
  const isBto = propertyType === 'hdb-bto';
  const isEc = propertyType === 'ec';
  const isPrivate = propertyType === 'condo' || propertyType === 'landed';

  // ─── Age checks ──────────────────────────────────────
  const minAge = isSingle ? MIN_AGE_SINGLE : MIN_AGE_FAMILY;
  if (youngestAge < minAge) {
    issues.push({
      type: 'blocker',
      message: isSingle
        ? `Singles must be at least ${MIN_AGE_SINGLE} years old to purchase.`
        : `Must be at least ${MIN_AGE_FAMILY} years old to purchase.`,
    });
  }

  // ─── Citizenship checks ──────────────────────────────
  if (isHdb || isEc) {
    if (citizenship === 'pr-pr') {
      issues.push({
        type: 'blocker',
        message: 'At least one applicant must be a Singapore Citizen for HDB/EC purchase.',
      });
    }
  }

  if (isEc && isSingle) {
    issues.push({
      type: 'blocker',
      message: 'Singles cannot purchase new ECs (only Joint Singles Scheme under family nucleus).',
    });
  }

  if (propertyType === 'landed' && (citizenship === 'pr-pr' || citizenship === 'sc-foreigner')) {
    issues.push({
      type: 'warning',
      message: 'PRs and foreigners generally need SLA approval to buy landed property.',
    });
  }

  // ─── Income ceilings ─────────────────────────────────
  if (isBto) {
    const isSmall = ['2-room', '3-room'].includes(flatSize);
    const ceiling = isSmall ? BTO_INCOME_CEILING_SMALL : BTO_INCOME_CEILING_LARGE;
    if (effectiveIncome > ceiling) {
      issues.push({
        type: 'blocker',
        message: `Income $${effectiveIncome.toLocaleString()}/mo exceeds BTO ceiling of $${ceiling.toLocaleString()}/mo for ${flatSize} flat.`,
      });
    }
  }

  if (isEc && effectiveIncome > EC_INCOME_CEILING) {
    issues.push({
      type: 'blocker',
      message: `Income $${effectiveIncome.toLocaleString()}/mo exceeds EC ceiling of $${EC_INCOME_CEILING.toLocaleString()}/mo.`,
    });
  }

  // ─── BTO singles restrictions ────────────────────────
  if (isBto && isSingle && flatSize !== '2-room') {
    issues.push({
      type: 'blocker',
      message: 'BTO singles can only purchase 2-Room Flexi flats.',
    });
  }

  // ─── Private property ownership ──────────────────────
  if ((isHdb || isEc) && ownsPrivateProperty) {
    issues.push({
      type: 'blocker',
      message: 'You cannot own private property when purchasing HDB/EC. Must dispose first.',
    });
  }

  // ─── 30-month rule ───────────────────────────────────
  if ((isBto || isEc) && within30Months) {
    issues.push({
      type: 'blocker',
      message: 'Must wait 30 months after disposing of private property before buying BTO/EC.',
    });
  }

  if (propertyType === 'hdb-resale' && within30Months) {
    issues.push({
      type: 'blocker',
      message: 'Must wait 30 months after disposing of private property before buying HDB resale.',
    });
  }

  // ─── Remaining lease checks (resale HDB) ─────────────
  if (propertyType === 'hdb-resale' && remainingLease > 0) {
    if (remainingLease < MIN_LEASE_FOR_CPF) {
      issues.push({
        type: 'warning',
        message: `Remaining lease (${remainingLease}y) is under ${MIN_LEASE_FOR_CPF} years — CPF cannot be used.`,
      });
    }
    const leaseNeeded = HDB_LEASE_COVERAGE_AGE - youngestAge;
    if (remainingLease < leaseNeeded) {
      issues.push({
        type: 'warning',
        message: `Remaining lease (${remainingLease}y) doesn't cover you to age 95 (need ${leaseNeeded}y). CPF usage and loan amount may be reduced.`,
      });
    }
  }

  const hasBlocker = issues.some((i) => i.type === 'blocker');

  return {
    canProceed: !hasBlocker,
    issues,
  };
}
