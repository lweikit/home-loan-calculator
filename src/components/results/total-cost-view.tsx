'use client';

import { useState } from 'react';
import StatRow from '@/components/common/stat-row';
import Field from '@/components/common/field';
import { formatCurrency } from '@/constants/ui';
import { calculateTotalCost, type TotalCostInputs } from '@/utils/total-cost';
import type { PropertyType } from '@/constants/property';

interface Props {
  propertyPrice: number;
  propertyType: PropertyType;
  flatSize: string;
  loanAmount: number;
  totalInterest: number;
  bsd: number;
  absd: number;
  legalFeeLow: number;
  legalFeeHigh: number;
  optionFee: number;
  exerciseFee: number;
}

export default function TotalCostView(props: Props) {
  const [ownershipYears, setOwnershipYears] = useState(10);
  const [renovationCost, setRenovationCost] = useState(30000);
  const [maintenanceOverride, setMaintenanceOverride] = useState<number | undefined>(undefined);

  const isPrivate = props.propertyType === 'condo' || props.propertyType === 'landed' || props.propertyType === 'ec';

  const result = calculateTotalCost({
    ...props,
    ownershipYears,
    renovationCost,
    monthlyMaintenance: maintenanceOverride,
  });

  return (
    <div>
      <div className={`grid grid-cols-1 gap-4 mb-4 ${isPrivate ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <Field label="Ownership Period (years)">
          <input
            type="number"
            value={ownershipYears || ''}
            onChange={(e) => setOwnershipYears(Number(e.target.value))}
            className="w-full"
            min={1}
            max={99}
          />
        </Field>
        <Field label="Renovation Cost ($)">
          <input
            type="number"
            value={renovationCost || ''}
            onChange={(e) => setRenovationCost(Number(e.target.value))}
            className="w-full"
          />
        </Field>
        {isPrivate && (
          <Field label="Monthly Maintenance ($)" hint="Condo/EC maintenance fee">
            <input
              type="number"
              value={maintenanceOverride ?? ''}
              onChange={(e) => setMaintenanceOverride(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full"
              placeholder="400"
            />
          </Field>
        )}
      </div>

      <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
        <div className="pt-1">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide pb-1">
            One-Time Costs
          </p>
        </div>
        <StatRow label="Stamp Duties (BSD + ABSD)" value={formatCurrency(result.stampDuties)} />
        <StatRow label="Legal Fees" value={`${formatCurrency(result.legalFees[0])} – ${formatCurrency(result.legalFees[1])}`} />
        <StatRow label="Option + Exercise Fees" value={formatCurrency(result.optionAndExercise)} />
        {result.renovationCost > 0 && (
          <StatRow label="Renovation" value={formatCurrency(result.renovationCost)} />
        )}
        <StatRow label="Total One-Time" value={`${formatCurrency(result.totalOneTimeLow)} – ${formatCurrency(result.totalOneTimeHigh)}`} highlight />

        <div className="pt-2">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide pt-2 pb-1">
            Monthly Recurring
          </p>
        </div>
        <StatRow label="Maintenance / S&CC" value={`${formatCurrency(result.monthlyMaintenance)}/mo`} />
        <StatRow
          label="Property Tax (est.)"
          value={`${formatCurrency(result.monthlyPropertyTax)}/mo`}
          subtext={`Rough est. AV ${formatCurrency(result.annualValue)}, annual ${formatCurrency(result.annualPropertyTax)}. Actual AV varies by location/flat.`}
        />

        <div className="pt-2">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide pt-2 pb-1">
            Over {ownershipYears} Years
          </p>
        </div>
        <StatRow label="Property Price" value={formatCurrency(props.propertyPrice)} />
        <StatRow label="Total Loan Interest" value={formatCurrency(result.totalInterest)} />
        <StatRow label="Total Maintenance" value={formatCurrency(result.totalMaintenance)} />
        <StatRow label="Total Property Tax" value={formatCurrency(result.totalPropertyTax)} />
        <StatRow label="One-Time Costs" value={`${formatCurrency(result.totalOneTimeLow)} – ${formatCurrency(result.totalOneTimeHigh)}`} />

        <div className="pt-3 mt-2 border-t-2 border-gray-200 dark:border-gray-600">
          <StatRow
            label="Grand Total Cost of Ownership"
            value={`${formatCurrency(result.grandTotalLow)} – ${formatCurrency(result.grandTotalHigh)}`}
            highlight
            subtext={`Over ${ownershipYears} years`}
          />
        </div>
      </div>
    </div>
  );
}
