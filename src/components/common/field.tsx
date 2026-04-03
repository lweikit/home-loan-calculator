'use client';

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Field({ label, hint, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
