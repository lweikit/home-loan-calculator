'use client';

import { useState, useEffect } from 'react';
import StatRow from '@/components/common/stat-row';
import Field from '@/components/common/field';
import CurrencyInput from '@/components/common/currency-input';
import { formatCurrency } from '@/constants/ui';
import { analyseRefinancing } from '@/utils/refinancing';

interface Props {
  loanAmount: number;
  currentRate: number;
  remainingTenure: number;
  isHdbLoan: boolean;
  propertyPrice: number;
}

export default function RefinancingView({ loanAmount, currentRate, remainingTenure, isHdbLoan, propertyPrice }: Props) {
  const [fixedRate, setFixedRate] = useState(2.28);
  const [fixedPeriod, setFixedPeriod] = useState(2);
  const [floatingRate, setFloatingRate] = useState(2.45);
  const [legalFees, setLegalFees] = useState(2500);
  const [lockInPenalty, setLockInPenalty] = useState(isHdbLoan ? 0 : 1.5);
  const [yearsIn, setYearsIn] = useState(5);
  const [currentPropertyValue, setCurrentPropertyValue] = useState(propertyPrice);

  // Sync property value when parent price changes
  useEffect(() => {
    setCurrentPropertyValue(propertyPrice);
  }, [propertyPrice]);

  // Calculate outstanding balance after yearsIn
  const monthsPaid = yearsIn * 12;
  const r = currentRate / 100 / 12;
  const totalMonths = remainingTenure * 12;
  const monthlyPayment = loanAmount > 0 && r > 0
    ? (loanAmount * r * Math.pow(1 + r, totalMonths)) / (Math.pow(1 + r, totalMonths) - 1)
    : loanAmount / totalMonths;
  const outstandingLoan = r > 0
    ? Math.round(loanAmount * Math.pow(1 + r, monthsPaid) - monthlyPayment * (Math.pow(1 + r, monthsPaid) - 1) / r)
    : Math.round(loanAmount - monthlyPayment * monthsPaid);

  const remainingAfterRefi = remainingTenure - yearsIn;

  const result = remainingAfterRefi > 0 && outstandingLoan > 0
    ? analyseRefinancing({
        outstandingLoan,
        currentRate,
        fixedRate,
        fixedPeriodYears: fixedPeriod,
        floatingRate,
        remainingTenureYears: remainingAfterRefi,
        currentPropertyValue,
        legalFees,
        lockInPenalty,
      })
    : null;

  return (
    <div>
      {isHdbLoan && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
          Once you refinance out of an HDB loan, you cannot switch back. This is a one-way decision.
        </p>
      )}

      {/* Scenario inputs */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Field label="Years into loan">
          <input type="number" value={yearsIn || ''} onChange={(e) => setYearsIn(Number(e.target.value))} className="w-full" min={1} max={remainingTenure - 1} />
        </Field>
        <Field label="Current property value ($)">
          <CurrencyInput value={currentPropertyValue} onChange={setCurrentPropertyValue} />
        </Field>
      </div>

      {/* Bank offer inputs */}
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Bank Offer</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Field label="Fixed rate (%)">
          <input type="number" step="0.01" value={fixedRate || ''} onChange={(e) => setFixedRate(Number(e.target.value))} className="w-full" />
        </Field>
        <Field label="Fixed period (yr)">
          <input type="number" value={fixedPeriod || ''} onChange={(e) => setFixedPeriod(Number(e.target.value))} className="w-full" min={1} max={5} />
        </Field>
        <Field label="Floating after (%)">
          <input type="number" step="0.01" value={floatingRate || ''} onChange={(e) => setFloatingRate(Number(e.target.value))} className="w-full" />
        </Field>
        <Field label="Legal fees ($)">
          <CurrencyInput value={legalFees} onChange={setLegalFees} />
        </Field>
      </div>

      {/* Results */}
      {result ? (
        <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
          <StatRow label="Outstanding loan" value={formatCurrency(outstandingLoan)} subtext={`After ${yearsIn} years at ${currentRate}%`} />

          {result.ltvGap > 0 && (
            <div className="py-2">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                LTV gap: {formatCurrency(result.ltvGap)} — need to top up to refinance (outstanding &gt; 75% of value).
              </p>
            </div>
          )}

          <StatRow label={`Fixed period (${fixedRate}%)`} value={`${formatCurrency(result.newMonthlyFixed)}/mo`} subtext={`Save ${formatCurrency(result.monthlySavingsFixed)}/mo for ${fixedPeriod}yr`} />
          <StatRow label={`After lock-in (${floatingRate}%)`} value={`${formatCurrency(result.newMonthlyFloating)}/mo`} subtext={result.monthlySavingsFloating > 0 ? `Save ${formatCurrency(result.monthlySavingsFloating)}/mo` : 'Savings may reverse'} />
          <StatRow label="Switching costs" value={formatCurrency(result.refinancingCosts)} />
          {result.breakEvenMonth > 0 && (
            <StatRow label="Break-even" value={`${result.breakEvenMonth} months`} />
          )}
          <StatRow label="Est. total savings" value={formatCurrency(result.totalSavingsAtEnd)} highlight subtext={`Over remaining ${remainingAfterRefi} years`} />

          <div className={`mt-3 p-3 rounded-lg ${result.worthIt ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
            <p className={`text-sm ${result.worthIt ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {result.worthIt
                ? `Worth it — save ${formatCurrency(result.totalSavingsAtEnd)}, break-even in ${result.breakEvenMonth} months.`
                : result.monthlySavingsFixed <= 0
                  ? 'Not worth it — new rate is higher than current.'
                  : 'Marginal — savings may not justify switching costs.'}
              {result.worthIt && result.monthlySavingsFloating <= 0 && (
                <span className="text-xs block mt-1">Note: savings reverse after lock-in. Consider refinancing again before it expires.</span>
              )}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">Enter years into loan to see analysis.</p>
      )}
    </div>
  );
}
