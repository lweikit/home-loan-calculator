'use client';

import { useState } from 'react';

interface Props {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function Collapsible({ title, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
      >
        <h3 className="text-base sm:text-lg font-semibold text-primary">{title}</h3>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && <div className="px-4 sm:px-5 pb-4 sm:pb-5">{children}</div>}
    </div>
  );
}
