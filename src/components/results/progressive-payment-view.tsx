'use client';

import StatRow from '@/components/common/stat-row';
import { formatCurrency } from '@/constants/ui';
import type { ProgressivePaymentResult } from '@/utils/progressive-payment';

interface Props {
  schedule: ProgressivePaymentResult;
  propertyType: string;
}

export default function ProgressivePaymentView({ schedule, propertyType }: Props) {
  const label = propertyType === 'ec' ? 'EC' : 'Condo';

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        New {label.toLowerCase()} purchases follow a prescribed progressive payment schedule.
        CPF OA grows from monthly contributions ({formatCurrency(schedule.monthlyCpfContribution)}/mo) between stages.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-gray-800 dark:text-gray-100">
          <thead>
            <tr className="bg-primary-dark text-white">
              <th className="text-left p-3 rounded-tl-lg">Stage</th>
              <th className="text-right p-3">%</th>
              <th className="text-right p-3">Amount</th>
              <th className="text-right p-3 hidden sm:table-cell">CPF Avail.</th>
              <th className="text-right p-3">CPF Used</th>
              <th className="text-right p-3">Cash</th>
              <th className="text-right p-3 rounded-tr-lg hidden sm:table-cell">~Month</th>
            </tr>
          </thead>
          <tbody>
            {schedule.stages.map((s, i) => (
              <tr
                key={s.stage}
                className={`border-b border-gray-100 dark:border-gray-700 ${
                  i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                }`}
              >
                <td className="p-3">
                  <div className="font-medium text-gray-700 dark:text-gray-300">{s.stage}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{s.description}</div>
                </td>
                <td className="p-3 text-right">{s.percent}%</td>
                <td className="p-3 text-right">{formatCurrency(s.amount)}</td>
                <td className="p-3 text-right text-gray-500 hidden sm:table-cell">{formatCurrency(s.cpfAvailableAtStage)}</td>
                <td className="p-3 text-right text-primary">{formatCurrency(s.cpfUsable)}</td>
                <td className="p-3 text-right">{s.cashNeeded > 0 ? formatCurrency(s.cashNeeded) : '—'}</td>
                <td className="p-3 text-right text-gray-500 hidden sm:table-cell">{s.estimatedMonth}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold border-t-2 border-gray-300 dark:border-gray-600">
              <td className="p-3" colSpan={2}>Total</td>
              <td className="p-3 text-right">{formatCurrency(schedule.totalPrice)}</td>
              <td className="p-3 text-right hidden sm:table-cell"></td>
              <td className="p-3 text-right text-primary">{formatCurrency(schedule.totalCpfUsed)}</td>
              <td className="p-3 text-right">{formatCurrency(schedule.totalCashNeeded)}</td>
              <td className="p-3 text-right hidden sm:table-cell"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
        <StatRow label="Total CPF Used" value={formatCurrency(schedule.totalCpfUsed)} highlight />
        <StatRow label="Total Cash Needed" value={formatCurrency(schedule.totalCashNeeded)} highlight />
        <StatRow label="Loan Disbursal Starts" value={schedule.loanStartsAtStage} subtext="Bank progressively disburses loan from this stage" />
      </div>

      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          The first 20% (Booking 5% + S&amp;P 15%) is your downpayment. From Foundation onwards,
          the bank disburses the loan progressively — you only pay interest on the disbursed amount until TOP.
          CPF OA accumulates between stages, reducing cash needed at later milestones.
        </p>
      </div>
    </div>
  );
}
