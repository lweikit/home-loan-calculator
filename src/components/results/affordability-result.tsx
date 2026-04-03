'use client';

import StatRow from '@/components/common/stat-row';
import { formatCurrency } from '@/constants/ui';
import type { AffordabilityResult } from '@/utils/calculations';
import type { PropertyType } from '@/constants/property';

interface Props {
  hdbAffordability: AffordabilityResult | null;
  bankAffordability: AffordabilityResult;
  hdbEligibility: { eligible: boolean; reason?: string };
  effectiveIncome: number;
  propertyType: PropertyType;
}

export default function AffordabilityResult({
  hdbAffordability,
  bankAffordability,
  hdbEligibility,
  propertyType,
}: Props) {
  const isHdbOrEc = propertyType === 'hdb-bto' || propertyType === 'hdb-resale' || propertyType === 'ec';

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HDB Loan */}
        <div>
          <h4 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            HDB Loan
          </h4>
          {hdbEligibility.eligible && hdbAffordability ? (
            <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
              {isHdbOrEc && (
                <StatRow label="Max loan (MSR)" value={formatCurrency(hdbAffordability.maxLoanMSR)} />
              )}
              <StatRow label="Max loan (TDSR)" value={formatCurrency(hdbAffordability.maxLoanTDSR)} />
              <StatRow label="Max loan (LTV)" value={formatCurrency(hdbAffordability.maxLoanLTV)} />
              <StatRow
                label="Eligible loan amount"
                value={formatCurrency(hdbAffordability.maxLoan)}
                highlight
                subtext={`Binding: ${hdbAffordability.bindingConstraint}`}
              />
              <StatRow
                label="Max property price"
                value={formatCurrency(hdbAffordability.maxPropertyPrice)}
              />
              {isHdbOrEc && (
                <StatRow
                  label="Max monthly (MSR 30%)"
                  value={`${formatCurrency(hdbAffordability.maxMonthlyMSR)}/mo`}
                />
              )}
            </div>
          ) : (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                Not eligible: {hdbEligibility.reason}
              </p>
            </div>
          )}
        </div>

        {/* Bank Loan */}
        <div>
          <h4 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Bank Loan
          </h4>
          <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
            {isHdbOrEc && (
              <StatRow label="Max loan (MSR)" value={formatCurrency(bankAffordability.maxLoanMSR)} />
            )}
            <StatRow label="Max loan (TDSR)" value={formatCurrency(bankAffordability.maxLoanTDSR)} />
            <StatRow label="Max loan (LTV)" value={formatCurrency(bankAffordability.maxLoanLTV)} />
            <StatRow
              label="Eligible loan amount"
              value={formatCurrency(bankAffordability.maxLoan)}
              highlight
              subtext={`Binding: ${bankAffordability.bindingConstraint}`}
            />
            <StatRow
              label="Max property price"
              value={formatCurrency(bankAffordability.maxPropertyPrice)}
            />
            {isHdbOrEc && (
              <StatRow
                label="Max monthly (MSR 30%)"
                value={`${formatCurrency(bankAffordability.maxMonthlyMSR)}/mo`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
