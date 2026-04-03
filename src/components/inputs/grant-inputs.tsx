'use client';

import Card from '@/components/common/card';
import Field from '@/components/common/field';
import type { CalculatorInputs } from '@/components/hooks/use-calculator';
import type { ProximityType, FlatSizeCategory, TimerStatus } from '@/constants/grants';

interface Props {
  inputs: CalculatorInputs;
  updateInput: <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => void;
}

const FLAT_SIZE_LABELS: Record<FlatSizeCategory, string> = {
  '2-room': '2-Room',
  '3-room': '3-Room',
  '4-room': '4-Room',
  '5-room': '5-Room',
  executive: 'Executive',
};

export default function GrantInputs({ inputs, updateInput }: Props) {
  const isHdb = inputs.propertyType === 'hdb-bto' || inputs.propertyType === 'hdb-resale';
  const isEc = inputs.propertyType === 'ec';

  // Grants for HDB and new EC only
  if (!isHdb && !isEc) return null;

  return (
    <Card title="Grant Eligibility">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Buyer Status">
          <select
            value={inputs.timerStatus}
            onChange={(e) => updateInput('timerStatus', e.target.value as TimerStatus)}
            className="w-full"
          >
            <option value="first">First-Timer</option>
            <option value="second">Second-Timer</option>
          </select>
        </Field>

        {isHdb && (
          <Field label="Flat Size">
            <select
              value={inputs.flatSize}
              onChange={(e) => updateInput('flatSize', e.target.value as FlatSizeCategory)}
              className="w-full"
            >
              {Object.entries(FLAT_SIZE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
        )}

        {isHdb && (
          <Field label="Proximity to Parents/Child" hint="For Proximity Housing Grant">
            <select
              value={inputs.proximity}
              onChange={(e) => updateInput('proximity', e.target.value as ProximityType)}
              className="w-full"
            >
              <option value="none">Not applicable</option>
              <option value="with">Living with parents/child</option>
              <option value="near">Living near (within 4km)</option>
            </select>
          </Field>
        )}

        {inputs.propertyType === 'hdb-resale' && inputs.timerStatus === 'second' && (
          <Field label="Step-Up Grant Eligible?" hint="Upgrading from 2-room to 3-room resale (non-mature)">
            <select
              value={inputs.isStepUpEligible ? 'yes' : 'no'}
              onChange={(e) => updateInput('isStepUpEligible', e.target.value === 'yes')}
              className="w-full"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </Field>
        )}
      </div>

      {isEc && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          EC grants: Family Grant up to $30,000 (income ≤ $12,000). No EHG or PHG for ECs.
        </p>
      )}
    </Card>
  );
}
