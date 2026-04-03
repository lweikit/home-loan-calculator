'use client';

import { formatCurrency } from '@/constants/ui';
import { HDB_LOAN_RATE } from '@/constants/property';

interface Props {
  hdbEligible: boolean;
  hdbLoanAmount: number;
  hdbMonthly: number;
  hdbTenure: number;
  hdbTotalInterest: number;
  bankLoanAmount: number;
  bankMonthly: number;
  bankTenure: number;
  bankTotalInterest: number;
  bankRate: number;
}

export default function LoanComparison({
  hdbEligible,
  hdbLoanAmount,
  hdbMonthly,
  hdbTenure,
  hdbTotalInterest,
  bankLoanAmount,
  bankMonthly,
  bankTenure,
  bankTotalInterest,
  bankRate,
}: Props) {
  const rows = [
    { label: 'Loan Amount', hdb: formatCurrency(hdbLoanAmount), bank: formatCurrency(bankLoanAmount) },
    { label: 'Interest Rate', hdb: `${HDB_LOAN_RATE}% (fixed)`, bank: `${bankRate}% (variable)` },
    { label: 'Tenure', hdb: `${hdbTenure} years`, bank: `${bankTenure} years` },
    { label: 'Monthly Payment', hdb: formatCurrency(hdbMonthly), bank: formatCurrency(bankMonthly) },
    { label: 'Total Interest', hdb: formatCurrency(hdbTotalInterest), bank: formatCurrency(bankTotalInterest) },
    {
      label: 'Total Cost',
      hdb: formatCurrency(hdbLoanAmount + hdbTotalInterest),
      bank: formatCurrency(bankLoanAmount + bankTotalInterest),
    },
  ];

  const savings = (hdbLoanAmount + hdbTotalInterest) - (bankLoanAmount + bankTotalInterest);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-gray-800 dark:text-gray-100">
          <thead>
            <tr className="bg-primary-dark text-white">
              <th className="text-left p-3 rounded-tl-lg"></th>
              <th className="text-right p-3">HDB Loan</th>
              <th className="text-right p-3 rounded-tr-lg">Bank Loan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.label}
                className={`border-b border-gray-100 dark:border-gray-700 ${
                  i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                }`}
              >
                <td className="p-3 font-medium text-gray-700 dark:text-gray-300">{row.label}</td>
                <td className={`p-3 text-right ${!hdbEligible ? 'text-gray-400 line-through' : ''}`}>
                  {hdbEligible ? row.hdb : 'N/A'}
                </td>
                <td className="p-3 text-right">{row.bank}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hdbEligible && Math.abs(savings) > 0 && (
        <div className={`mt-4 p-3 rounded-lg ${
          savings > 0
            ? 'bg-green-50 dark:bg-green-900/20'
            : 'bg-orange-50 dark:bg-orange-900/20'
        }`}>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {savings > 0 ? (
              <>
                Bank loan saves <span className="font-bold text-green-700 dark:text-green-400">{formatCurrency(savings)}</span> in total cost
              </>
            ) : (
              <>
                HDB loan saves <span className="font-bold text-green-700 dark:text-green-400">{formatCurrency(Math.abs(savings))}</span> in total cost
              </>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
              Note: Bank rate is variable and may change. HDB rate is pegged to CPF OA rate + 0.1%.
            </span>
          </p>
        </div>
      )}

      {!hdbEligible && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          HDB loan not available — showing bank loan only.
        </p>
      )}
    </div>
  );
}
