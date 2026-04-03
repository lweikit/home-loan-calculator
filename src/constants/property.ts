export type PropertyType = 'hdb-bto' | 'hdb-resale' | 'ec' | 'condo' | 'landed';
export type BuyingScheme = 'couple' | 'single' | 'owner-occupier' | 'multi-gen';
export type CitizenshipProfile = 'sc-sc' | 'sc-pr' | 'sc-foreigner' | 'pr-pr';
export type LoanType = 'hdb' | 'bank';

export const PROPERTY_LABELS: Record<PropertyType, string> = {
  'hdb-bto': 'HDB BTO',
  'hdb-resale': 'HDB Resale',
  ec: 'Executive Condo (EC)',
  condo: 'Private Condo',
  landed: 'Landed',
};

export const BUYING_SCHEME_LABELS: Record<BuyingScheme, string> = {
  couple: 'Couple (Joint)',
  single: 'Single',
  'owner-occupier': 'Owner + Occupier',
  'multi-gen': 'Multi-Generation',
};

export const CITIZENSHIP_LABELS: Record<CitizenshipProfile, string> = {
  'sc-sc': 'SC + SC',
  'sc-pr': 'SC + PR',
  'sc-foreigner': 'SC + Foreigner',
  'pr-pr': 'PR + PR',
};

export const HDB_LOAN_RATE = 2.6; // percent
export const HDB_MAX_LTV = 80;
export const HDB_MAX_TENURE_YEARS = 25;
export const HDB_AGE_CAP = 65;

export const BANK_MAX_LTV_FIRST = 75;
export const BANK_MAX_LTV_SECOND = 45;
export const BANK_MAX_LTV_THIRD = 35;
export const BANK_MAX_TENURE_HDB = 30;
export const BANK_MAX_TENURE_PRIVATE = 35;
export const BANK_AGE_CAP = 65;
export const BANK_STRESS_TEST_RATE = 3.5;

export const MSR_LIMIT = 0.30; // 30% — applies to HDB and EC only, NOT private
export const TDSR_LIMIT = 0.55; // 55% — applies to all bank loans

// HDB loan income ceilings
export const HDB_INCOME_CEILING_FAMILY = 14000;
export const HDB_INCOME_CEILING_MULTIGEN = 21000;
export const HDB_INCOME_CEILING_SINGLE = 7000;

// BTO purchase income ceilings
export const BTO_INCOME_CEILING_SMALL = 7000;   // 2-room Flexi, 3-room (non-mature)
export const BTO_INCOME_CEILING_LARGE = 14000;  // 4-room, 5-room, 3Gen

// EC purchase income ceiling
export const EC_INCOME_CEILING = 16000;

// BSD rates (effective 15 Feb 2023)
export const BSD_TIERS = [
  { limit: 180000, rate: 0.01 },
  { limit: 360000, rate: 0.02 },
  { limit: 1000000, rate: 0.03 },
  { limit: 1500000, rate: 0.04 },
  { limit: 3000000, rate: 0.05 },
  { limit: Infinity, rate: 0.06 },
];

// ABSD rates (effective 27 Apr 2023)
// [1st property, 2nd property, 3rd+ property]
export const ABSD_RATES: Record<CitizenshipProfile, number[]> = {
  'sc-sc': [0, 20, 30],
  'sc-pr': [0, 20, 30],       // SC buyer rate applies
  'sc-foreigner': [0, 20, 30], // SC buyer rate applies
  'pr-pr': [5, 30, 35],
};
// Note: Foreigner (non-PR non-SC) buying alone = 60%. Not modelled as a profile
// since foreigners cannot buy HDB/EC. Only relevant for private, handled via ABSD_RATES + pr-pr.

// Legal fee estimates
export const LEGAL_FEE_ESTIMATES: Record<PropertyType, [number, number]> = {
  'hdb-bto': [2000, 3000],
  'hdb-resale': [2000, 3000],
  ec: [3000, 5000],
  condo: [3000, 5000],
  landed: [3500, 6000],
};

// BTO option fees by flat type
export const BTO_OPTION_FEE: Record<string, number> = {
  '2-room': 500,
  '3-room': 1000,
  '4-room': 2000,
  '5-room': 2000,
};

// Minimum cash downpayment requirements
export const MIN_CASH_PERCENT: Record<LoanType, number> = {
  hdb: 0,   // HDB loan: no minimum cash, entire DP can be CPF
  bank: 5,  // Bank loan: 5% must be cash
};

// Note: Bank loan downpayment is 25% total (5% cash + 20% cash/CPF).
// The 5% min cash is enforced in calculateDownpayment().

// Resale levy (for second-timers who previously bought subsidised flat)
export const RESALE_LEVY: Record<string, number> = {
  '2-room': 15000,
  '3-room': 25000,
  '4-room': 30000,
  '5-room': 40000,
  executive: 50000,
};

// Age/lease limits
export const HDB_LEASE_COVERAGE_AGE = 95;
export const MIN_LEASE_FOR_CPF = 20;
export const MIN_AGE_SINGLE = 35;
export const MIN_AGE_FAMILY = 21;
