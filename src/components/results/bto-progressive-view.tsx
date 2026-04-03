'use client';

import StatRow from '@/components/common/stat-row';
import { formatCurrency } from '@/constants/ui';
import type { BtoProgressiveResult } from '@/utils/bto-progressive';

interface Props {
  schedule: BtoProgressiveResult;
}

export default function BtoProgressiveView({ schedule }: Props) {
  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        HDB BTO payments are made at 3 milestones — not progressively during construction like private property.
      </p>

      <div className="space-y-4">
        {schedule.stages.map((s, i) => (
          <div key={s.stage} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary-dark text-white text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">{s.stage}</h4>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-8">{s.description}</p>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">{s.timing}</span>
            </div>

            <div className="ml-8 grid grid-cols-3 gap-3 mt-3">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-xs text-gray-500 dark:text-gray-400">Amount</p>
                <p className="font-semibold">{formatCurrency(s.amount)}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-xs text-gray-500 dark:text-gray-400">CPF</p>
                <p className="font-semibold text-primary">{formatCurrency(s.cpfUsable)}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-xs text-gray-500 dark:text-gray-400">Cash</p>
                <p className="font-semibold">{s.cashNeeded > 0 ? formatCurrency(s.cashNeeded) : '—'}</p>
              </div>
            </div>

            {s.notes && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 ml-8">{s.notes}</p>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
        <StatRow label="Total Downpayment" value={formatCurrency(schedule.totalDownpayment)} subtext={`Loan: ${formatCurrency(schedule.loanAmount)}`} />
        <StatRow label="Total CPF Used" value={formatCurrency(schedule.totalCpfUsed)} highlight />
        <StatRow label="Total Cash Needed" value={formatCurrency(schedule.totalCashNeeded)} highlight subtext="Option fee + cash portion of DP" />
      </div>
    </div>
  );
}
