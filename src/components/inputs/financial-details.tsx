'use client';

import Card from '@/components/common/card';
import Field from '@/components/common/field';
import CurrencyInput from '@/components/common/currency-input';
import type { CalculatorInputs } from '@/components/hooks/use-calculator';

interface Props {
  inputs: CalculatorInputs;
  updateInput: <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => void;
  effectiveIncome: number;
}

export default function FinancialDetails({ inputs, updateInput, effectiveIncome }: Props) {
  const showCoApplicant = inputs.buyingScheme === 'couple' || inputs.buyingScheme === 'multi-gen';

  return (
    <Card title="Financial Details">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Property Price ($)">
          <CurrencyInput
            value={inputs.propertyPrice}
            onChange={(v) => updateInput('propertyPrice', v)}
            placeholder="500,000"
          />
        </Field>

        {inputs.propertyType === 'hdb-resale' && (
          <Field label="Valuation ($)" hint="From HDB Request for Value ($120)">
            <CurrencyInput
              value={inputs.valuation}
              onChange={(v) => updateInput('valuation', v)}
              placeholder="500,000"
            />
          </Field>
        )}

        {/* Income Section */}
        <div className="sm:col-span-2 mt-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Income
          </p>
        </div>

        <Field label="Your Gross Monthly Income ($)">
          <CurrencyInput
            value={inputs.grossMonthlyIncome}
            onChange={(v) => updateInput('grossMonthlyIncome', v)}
            placeholder="6,000"
          />
        </Field>

        {showCoApplicant && (
          <Field label="Co-Applicant Gross Monthly Income ($)">
            <CurrencyInput
              value={inputs.coApplicantIncome}
              onChange={(v) => updateInput('coApplicantIncome', v)}
              placeholder="4,000"
            />
          </Field>
        )}

        {/* Debt Section */}
        <div className="sm:col-span-2 mt-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Existing Monthly Debt
          </p>
        </div>

        <Field label="Your Monthly Debt ($)" hint="Car loan, credit cards, etc.">
          <CurrencyInput
            value={inputs.existingDebt}
            onChange={(v) => updateInput('existingDebt', v)}
            placeholder="0"
          />
        </Field>

        {showCoApplicant && (
          <Field label="Co-Applicant Monthly Debt ($)" hint="Car loan, credit cards, etc.">
            <CurrencyInput
              value={inputs.coApplicantDebt}
              onChange={(v) => updateInput('coApplicantDebt', v)}
              placeholder="0"
            />
          </Field>
        )}

        {/* CPF Section */}
        <div className="sm:col-span-2 mt-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            CPF Ordinary Account (OA) Balance
          </p>
        </div>

        <Field label="Your CPF OA Balance ($)">
          <CurrencyInput
            value={inputs.cpfOaBalance}
            onChange={(v) => updateInput('cpfOaBalance', v)}
            placeholder="50,000"
          />
        </Field>

        <Field label="Keep in OA ($)" hint="Amount to retain (e.g. $20,000)">
          <div className="flex gap-2 items-center">
            <CurrencyInput
              value={inputs.cpfOaRetain}
              onChange={(v) => updateInput('cpfOaRetain', v)}
              placeholder="0"
            />
            <button
              type="button"
              onClick={() => updateInput('cpfOaRetain', 20000)}
              className="shrink-0 text-xs px-2 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              $20K
            </button>
          </div>
        </Field>

        {showCoApplicant && (
          <>
            <Field label="Co-Applicant CPF OA ($)">
              <CurrencyInput
                value={inputs.coApplicantCpfOa}
                onChange={(v) => updateInput('coApplicantCpfOa', v)}
                placeholder="30,000"
              />
            </Field>

            <Field label="Co-Applicant Keep in OA ($)" hint="Amount to retain (e.g. $20,000)">
              <div className="flex gap-2 items-center">
                <CurrencyInput
                  value={inputs.coApplicantCpfRetain}
                  onChange={(v) => updateInput('coApplicantCpfRetain', v)}
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => updateInput('coApplicantCpfRetain', 20000)}
                  className="shrink-0 text-xs px-2 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  $20K
                </button>
              </div>
            </Field>
          </>
        )}

        {/* Other Details */}
        <div className="sm:col-span-2 mt-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Other Details
          </p>
        </div>

        <Field label="Age of Youngest Borrower">
          <input
            type="number"
            value={inputs.youngestAge || ''}
            onChange={(e) => updateInput('youngestAge', Number(e.target.value))}
            className="w-full"
            placeholder="30"
          />
        </Field>

        {inputs.propertyType === 'hdb-resale' && (
          <Field label="Remaining Lease (years)" hint="Check on HDB Map Services">
            <input
              type="number"
              value={inputs.remainingLease || ''}
              onChange={(e) => updateInput('remainingLease', Number(e.target.value))}
              className="w-full"
              placeholder="90"
            />
          </Field>
        )}

        {inputs.propertyType === 'hdb-bto' && (
          <Field label="Staggered Downpayment" hint="Pay less upfront at Agreement for Lease">
            <select
              value={inputs.useStaggeredDp ? 'yes' : 'no'}
              onChange={(e) => updateInput('useStaggeredDp', e.target.value === 'yes')}
              className="w-full"
            >
              <option value="no">Standard (10% at signing, 15% at key)</option>
              <option value="yes">Staggered (5% at signing, 20% at key)</option>
            </select>
          </Field>
        )}

        <Field label="Bank Interest Rate (%)" hint="Current SORA + spread">
          <input
            type="number"
            step="0.1"
            value={inputs.bankRate || ''}
            onChange={(e) => updateInput('bankRate', Number(e.target.value))}
            className="w-full"
            placeholder="3.5"
          />
        </Field>

        <Field label="Option Fee ($)" hint={inputs.propertyType === 'hdb-resale' ? 'Exercise fee tops up to $5,000' : ''}>
          <CurrencyInput
            value={inputs.optionFee}
            onChange={(v) => updateInput('optionFee', v)}
            placeholder="1,000"
          />
        </Field>
      </div>

      <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg space-y-1">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Effective income:{' '}
          <span className="font-semibold text-primary">
            ${effectiveIncome.toLocaleString()}/mo
          </span>
          {inputs.buyingScheme === 'owner-occupier' && (
            <span className="text-xs ml-2">(Owner&apos;s income only)</span>
          )}
        </p>
        {(() => {
          const myUsable = Math.max(0, inputs.cpfOaBalance - inputs.cpfOaRetain);
          const coUsable = showCoApplicant ? Math.max(0, inputs.coApplicantCpfOa - inputs.coApplicantCpfRetain) : 0;
          const totalUsable = myUsable + coUsable;
          const totalRetained = inputs.cpfOaRetain + (showCoApplicant ? inputs.coApplicantCpfRetain : 0);
          return (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              CPF OA for housing:{' '}
              <span className="font-semibold text-primary">
                ${totalUsable.toLocaleString()}
              </span>
              {totalRetained > 0 && (
                <span className="text-xs ml-2">(retaining ${totalRetained.toLocaleString()} in OA)</span>
              )}
            </p>
          );
        })()}
      </div>
    </Card>
  );
}
