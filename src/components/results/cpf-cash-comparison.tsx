'use client';

import { formatCurrency } from '@/constants/ui';
import type { CpfCashComparison } from '@/utils/cpf-simulator';

interface Props {
  strategies: CpfCashComparison[];
}

export default function CpfCashComparisonView({ strategies }: Props) {
  if (strategies.length === 0) return null;

  // Find the best strategy (lowest total owed to CPF while keeping cash manageable)
  const minOwed = Math.min(...strategies.map((s) => s.totalOwedToCpf));

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Compare using more CPF (lower cash outlay, but higher accrued interest owed to CPF on sale)
        vs more cash (higher upfront cost, but less tied up in CPF).
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[500px] text-gray-800 dark:text-gray-100">
          <thead>
            <tr className="bg-primary-dark text-white">
              <th className="text-left p-3 rounded-tl-lg"></th>
              {strategies.map((s) => (
                <th key={s.label} className="text-right p-3 last:rounded-tr-lg">{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <td className="p-3 font-medium text-gray-700 dark:text-gray-300">CPF for Downpayment</td>
              {strategies.map((s) => (
                <td key={s.label} className="p-3 text-right">{formatCurrency(s.cpfForDownpayment)}</td>
              ))}
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <td className="p-3 font-medium text-gray-700 dark:text-gray-300">CPF to Offset Loan</td>
              {strategies.map((s) => (
                <td key={s.label} className="p-3 text-right">{formatCurrency(s.cpfForLoan)}</td>
              ))}
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <td className="p-3 font-medium text-gray-700 dark:text-gray-300">Monthly from CPF</td>
              {strategies.map((s) => (
                <td key={s.label} className="p-3 text-right">{formatCurrency(s.monthlyFromCpf)}/mo</td>
              ))}
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <td className="p-3 font-medium text-gray-700 dark:text-gray-300">Monthly from Cash</td>
              {strategies.map((s) => (
                <td key={s.label} className="p-3 text-right">{formatCurrency(s.monthlyFromCash)}/mo</td>
              ))}
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <td className="p-3 font-medium text-gray-700 dark:text-gray-300">Total CPF Withdrawn</td>
              {strategies.map((s) => (
                <td key={s.label} className="p-3 text-right font-semibold">{formatCurrency(s.totalCpfWithdrawn)}</td>
              ))}
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <td className="p-3 font-medium text-gray-700 dark:text-gray-300">Accrued Interest (2.5%)</td>
              {strategies.map((s) => (
                <td key={s.label} className="p-3 text-right text-red-500 dark:text-red-400">{formatCurrency(s.totalAccruedInterest)}</td>
              ))}
            </tr>
            <tr className="border-b-2 border-gray-200 dark:border-gray-600">
              <td className="p-3 font-bold text-gray-800 dark:text-gray-200">Owed to CPF on Sale</td>
              {strategies.map((s) => (
                <td
                  key={s.label}
                  className={`p-3 text-right font-bold ${
                    s.totalOwedToCpf === minOwed
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {formatCurrency(s.totalOwedToCpf)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-3 font-bold text-gray-800 dark:text-gray-200">Total Cash Spent</td>
              {strategies.map((s) => (
                <td key={s.label} className="p-3 text-right font-bold">{formatCurrency(s.totalCashSpent)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>Max CPF</strong> minimises cash spent now, but you owe more to CPF when you sell.{' '}
          <strong>Max Cash</strong> costs more upfront but your CPF keeps growing at 2.5%.{' '}
          <strong>Balanced</strong> uses CPF for the lump sum, cash for monthly — a common approach.
        </p>
      </div>
    </div>
  );
}
