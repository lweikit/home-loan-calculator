'use client';

import StatRow from '@/components/common/stat-row';
import { formatCurrency } from '@/constants/ui';
import type { CostBreakdown as CostBreakdownType } from '@/utils/calculations';

interface Props {
  hdbCosts: CostBreakdownType;
  bankCosts: CostBreakdownType;
  hdbEligible: boolean;
  propertyType: string;
}

function CostColumn({ costs, label }: { costs: CostBreakdownType; label: string }) {
  const dp = costs.downpayment;
  return (
    <div>
      <h4 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        {label}
      </h4>
      <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
        <div className="pt-1">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide pb-1">
            Downpayment ({dp.ltv}% LTV)
          </p>
        </div>
        <StatRow
          label="Required Downpayment"
          value={formatCurrency(dp.totalDownpayment)}
          subtext={`${100 - dp.ltv}% of property price`}
        />
        <StatRow
          label="CPF for Downpayment"
          value={formatCurrency(dp.cpfForDownpayment)}
        />
        <StatRow
          label="Cash for Downpayment"
          value={formatCurrency(dp.cashNeeded)}
          highlight={dp.cashNeeded > 0}
          subtext={dp.minCash > 0 ? `Min cash: ${formatCurrency(dp.minCash)}` : 'No minimum cash required'}
        />

        {dp.cpfForLoan > 0 && (
          <>
            <div className="pt-2">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide pt-2 pb-1">
                CPF to Reduce Loan
              </p>
            </div>
            <StatRow
              label="Excess CPF applied to loan"
              value={formatCurrency(dp.cpfForLoan)}
              subtext="Reduces loan principal"
            />
          </>
        )}

        <StatRow
          label="Total CPF Used"
          value={formatCurrency(dp.cpfUsedTotal)}
          highlight
        />
        <StatRow
          label="Loan Amount"
          value={formatCurrency(dp.effectiveLoanAmount)}
          highlight
          subtext={dp.cpfForLoan > 0 ? `Reduced from ${formatCurrency(dp.loanAmount)}` : `${dp.ltv}% LTV`}
        />

        <div className="pt-2">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide pt-2 pb-1">
            Fees & Duties
          </p>
        </div>
        <StatRow label="BSD" value={formatCurrency(costs.bsd)} />
        {costs.absd > 0 && (
          <StatRow label="ABSD" value={formatCurrency(costs.absd)} />
        )}
        <StatRow
          label="Legal Fees (est.)"
          value={`${formatCurrency(costs.legalFeeLow)} – ${formatCurrency(costs.legalFeeHigh)}`}
        />
        {costs.valuationFee > 0 && (
          <StatRow label="Valuation Fee" value={formatCurrency(costs.valuationFee)} />
        )}
        <StatRow label="Option Fee" value={formatCurrency(costs.optionFee)} />
        {costs.exerciseFee > 0 && (
          <StatRow
            label="Exercise Fee"
            value={formatCurrency(costs.exerciseFee)}
            subtext="Tops up option fee to $5,000"
          />
        )}
        {costs.resaleLevy > 0 && (
          <StatRow
            label="Resale Levy"
            value={formatCurrency(costs.resaleLevy)}
            subtext="Second-timer, previously owned subsidised flat"
          />
        )}
        {costs.cov > 0 && (
          <StatRow
            label="Cash Over Valuation"
            value={formatCurrency(costs.cov)}
            subtext="Must be paid in cash"
          />
        )}

        <div className="pt-3 mt-2 border-t-2 border-gray-200 dark:border-gray-600">
          <StatRow
            label="Est. Total Cash Outlay"
            value={`${formatCurrency(costs.totalCashOutlayLow)} – ${formatCurrency(costs.totalCashOutlayHigh)}`}
            highlight
            subtext="Cash DP + COV + fees + duties"
          />
        </div>
      </div>
    </div>
  );
}

export default function CostBreakdown({ hdbCosts, bankCosts, hdbEligible, propertyType }: Props) {
  return (
    <div>
      <StatRow label="Property Price" value={formatCurrency(hdbCosts.propertyPrice)} highlight />

      {propertyType === 'hdb-resale' && hdbCosts.cov > 0 && (
        <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <p className="text-sm text-orange-700 dark:text-orange-400">
            COV: {formatCurrency(hdbCosts.cov)} — must be paid in cash
          </p>
        </div>
      )}

      <div className={`grid gap-6 mt-4 ${hdbEligible ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {hdbEligible && (
          <CostColumn costs={hdbCosts} label="HDB Loan" />
        )}
        <CostColumn costs={bankCosts} label="Bank Loan" />
      </div>
    </div>
  );
}
