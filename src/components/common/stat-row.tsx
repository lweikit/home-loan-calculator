'use client';

interface StatRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  subtext?: string;
}

export default function StatRow({ label, value, highlight, subtext }: StatRowProps) {
  return (
    <div className={`flex justify-between items-start py-2 ${highlight ? 'font-semibold' : ''}`}>
      <div>
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
        {subtext && <p className="text-xs text-gray-400 dark:text-gray-500">{subtext}</p>}
      </div>
      <span className={`text-sm font-medium ${highlight ? 'text-primary text-base' : 'text-gray-800 dark:text-gray-200'}`}>
        {value}
      </span>
    </div>
  );
}
