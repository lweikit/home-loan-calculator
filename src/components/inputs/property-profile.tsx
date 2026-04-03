'use client';

import Card from '@/components/common/card';
import Field from '@/components/common/field';
import {
  PROPERTY_LABELS,
  BUYING_SCHEME_LABELS,
  CITIZENSHIP_LABELS,
  type PropertyType,
  type BuyingScheme,
  type CitizenshipProfile,
} from '@/constants/property';
import type { CalculatorInputs } from '@/components/hooks/use-calculator';

interface Props {
  inputs: CalculatorInputs;
  updateInput: <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => void;
}

export default function PropertyProfile({ inputs, updateInput }: Props) {
  return (
    <Card title="Property Profile">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Property Type">
          <select
            value={inputs.propertyType}
            onChange={(e) => updateInput('propertyType', e.target.value as PropertyType)}
            className="w-full"
          >
            {Object.entries(PROPERTY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>

        <Field label="Buying Scheme">
          <select
            value={inputs.buyingScheme}
            onChange={(e) => updateInput('buyingScheme', e.target.value as BuyingScheme)}
            className="w-full"
          >
            {Object.entries(BUYING_SCHEME_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>

        <Field label="Citizenship">
          <select
            value={inputs.citizenship}
            onChange={(e) => updateInput('citizenship', e.target.value as CitizenshipProfile)}
            className="w-full"
          >
            {Object.entries(CITIZENSHIP_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>

        <Field label="Property Count" hint="How many properties will you own (including this one)">
          <select
            value={inputs.propertyCount}
            onChange={(e) => updateInput('propertyCount', Number(e.target.value))}
            className="w-full"
          >
            <option value={1}>1st Property</option>
            <option value={2}>2nd Property</option>
            <option value={3}>3rd+ Property</option>
          </select>
        </Field>

        {(inputs.propertyType !== 'condo' && inputs.propertyType !== 'landed') && (
          <>
            <Field label="Own private property?" hint="Local or overseas">
              <select
                value={inputs.ownsPrivateProperty ? 'yes' : 'no'}
                onChange={(e) => updateInput('ownsPrivateProperty', e.target.value === 'yes')}
                className="w-full"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </Field>

            <Field label="Sold private property in last 30 months?">
              <select
                value={inputs.within30Months ? 'yes' : 'no'}
                onChange={(e) => updateInput('within30Months', e.target.value === 'yes')}
                className="w-full"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </Field>
          </>
        )}
      </div>
    </Card>
  );
}
