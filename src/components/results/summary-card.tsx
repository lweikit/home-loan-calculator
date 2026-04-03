'use client';

import { formatCurrency } from '@/constants/ui';
import type { GrantResult } from '@/constants/grants';

interface Props {
  hdbEligible: boolean;
  hdbMonthly: number;
  bankMonthly: number;
  totalCashNeeded: number;
  totalCpfUsed: number;
  grants: GrantResult;
  propertyPrice: number;
}

export default function SummaryCard({
  hdbEligible,
  hdbMonthly,
  bankMonthly,
  totalCashNeeded,
  totalCpfUsed,
  grants,
  propertyPrice,
}: Props) {
  if (propertyPrice <= 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Summary
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Monthly Payment</p>
          {hdbEligible ? (
            <div>
              <p className="text-lg font-bold text-primary">{formatCurrency(hdbMonthly)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">HDB Loan</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-bold text-primary">{formatCurrency(bankMonthly)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Bank Loan</p>
            </div>
          )}
          {hdbEligible && bankMonthly > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Bank: {formatCurrency(bankMonthly)}</p>
          )}
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cash Needed</p>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{formatCurrency(totalCashNeeded)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Upfront</p>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">CPF Used</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(totalCpfUsed)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">DP + Loan Offset</p>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Grants</p>
          <p className={`text-lg font-bold ${grants.total > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
            {grants.total > 0 ? formatCurrency(grants.total) : '—'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{grants.total > 0 ? 'Credited to CPF' : 'Not eligible'}</p>
        </div>
      </div>
    </div>
  );
}
