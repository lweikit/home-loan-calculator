'use client';

import { useState, useCallback } from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  step?: string;
  min?: number;
}

export default function CurrencyInput({ value, onChange, placeholder, className = '', step, min }: Props) {
  const [focused, setFocused] = useState(false);

  const displayValue = focused
    ? (value || '')
    : value ? value.toLocaleString('en-SG') : '';

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '');
    if (raw === '' || raw === '-') { onChange(0); return; }
    const num = Number(raw);
    if (!isNaN(num) && isFinite(num)) onChange(num);
  }, [onChange]);

  return (
    <input
      type={focused ? 'number' : 'text'}
      value={displayValue}
      onChange={handleChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`w-full ${className}`}
      placeholder={placeholder}
      step={step}
      min={min}
    />
  );
}
