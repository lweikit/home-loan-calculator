'use client';

import { useEffect, useCallback } from 'react';
import type { CalculatorInputs } from './use-calculator';

// Keys to persist in URL (only the important ones, skip booleans with defaults)
const URL_KEYS: (keyof CalculatorInputs)[] = [
  'propertyType', 'buyingScheme', 'citizenship', 'propertyCount',
  'propertyPrice', 'valuation', 'grossMonthlyIncome', 'coApplicantIncome',
  'existingDebt', 'coApplicantDebt', 'cpfOaBalance', 'cpfOaRetain',
  'coApplicantCpfOa', 'coApplicantCpfRetain', 'youngestAge', 'remainingLease',
  'bankRate', 'optionFee', 'flatSize', 'timerStatus', 'proximity',
];

export function useUrlState(
  inputs: CalculatorInputs,
  updateInput: <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => void,
) {
  // Load from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.size === 0) return;

    for (const key of URL_KEYS) {
      const value = params.get(key);
      if (value === null) continue;

      // Parse based on type
      const current = inputs[key];
      if (typeof current === 'number') {
        const num = Number(value);
        if (!isNaN(num)) updateInput(key, num as never);
      } else if (typeof current === 'boolean') {
        updateInput(key, (value === 'true') as never);
      } else {
        updateInput(key, value as never);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Save to URL on change (debounced)
  const syncToUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    for (const key of URL_KEYS) {
      const value = inputs[key];
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', url);
  }, [inputs]);

  useEffect(() => {
    const timer = setTimeout(syncToUrl, 500); // debounce 500ms
    return () => clearTimeout(timer);
  }, [syncToUrl]);
}
