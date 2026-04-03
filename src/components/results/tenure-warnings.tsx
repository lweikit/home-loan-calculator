'use client';

import type { PropertyType, LoanType } from '@/constants/property';

interface Props {
  youngestAge: number;
  propertyType: PropertyType;
  remainingLease: number;
  hdbTenure: number;
  bankTenure: number;
  hdbEligible: boolean;
}

interface Warning {
  type: 'error' | 'warning' | 'info';
  message: string;
}

function getWarnings(params: Props): Warning[] {
  const { youngestAge, propertyType, remainingLease, hdbTenure, bankTenure, hdbEligible } = params;
  const warnings: Warning[] = [];
  const isHdb = propertyType === 'hdb-bto' || propertyType === 'hdb-resale';
  const isEc = propertyType === 'ec';

  // Age + tenure checks
  if (hdbEligible) {
    const hdbEndAge = youngestAge + hdbTenure;
    if (hdbEndAge > 65) {
      warnings.push({
        type: 'error',
        message: `HDB loan tenure capped: age ${youngestAge} + ${hdbTenure} years = ${hdbEndAge}. Max age at loan end is 65.`,
      });
    }
    if (hdbTenure < 25 && hdbEndAge <= 65) {
      warnings.push({
        type: 'info',
        message: `HDB loan tenure: ${hdbTenure} years (max 25, capped at age 65).`,
      });
    }
  }

  const bankEndAge = youngestAge + bankTenure;
  if (bankEndAge > 65) {
    warnings.push({
      type: 'warning',
      message: `Bank loan tenure may be reduced: age ${youngestAge} + ${bankTenure} years = ${bankEndAge}. Typical cap is age 65 (up to 75 with lower LTV).`,
    });
  }

  // Remaining lease checks (HDB/EC)
  if ((isHdb || isEc) && remainingLease > 0) {
    // HDB rule: remaining lease must cover youngest buyer to age 95
    const leaseNeeded = 95 - youngestAge;
    if (remainingLease < leaseNeeded) {
      warnings.push({
        type: 'warning',
        message: `Remaining lease (${remainingLease}y) may not cover you to age 95 (need ${leaseNeeded}y). This could reduce your eligible loan amount or CPF usage.`,
      });
    }

    // Remaining lease must be at least 20 years for CPF usage
    if (remainingLease < 20) {
      warnings.push({
        type: 'error',
        message: `Remaining lease is less than 20 years — CPF cannot be used for this property.`,
      });
    }

    // For bank loans, remaining lease should cover tenure
    if (remainingLease < bankTenure + 3) {
      warnings.push({
        type: 'warning',
        message: `Remaining lease (${remainingLease}y) is tight for bank loan tenure of ${bankTenure} years.`,
      });
    }
  }

  // General warnings
  if (youngestAge >= 55) {
    warnings.push({
      type: 'info',
      message: `At age 55+, your loan tenure and LTV may be further restricted by banks.`,
    });
  }

  return warnings;
}

export default function TenureWarnings(props: Props) {
  const warnings = getWarnings(props);

  if (warnings.length === 0) return null;

  const styles = {
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
  };

  const icons = {
    error: '!!',
    warning: '!',
    info: 'i',
  };

  return (
    <div className="space-y-2">
      {warnings.map((w, i) => (
        <div key={i} className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${styles[w.type]}`}>
          <span className="shrink-0 w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-xs font-bold">
            {icons[w.type]}
          </span>
          <span>{w.message}</span>
        </div>
      ))}
    </div>
  );
}
