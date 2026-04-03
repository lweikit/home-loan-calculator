'use client';

import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { formatCurrency } from '@/constants/ui';
import type { AmortisationEntry } from '@/utils/calculations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  hdbAmortisation: AmortisationEntry[];
  bankAmortisation: AmortisationEntry[];
  hdbEligible: boolean;
}

type TabView = 'chart' | 'table';
type LoanView = 'hdb' | 'bank';

export default function AmortisationView({ hdbAmortisation, bankAmortisation, hdbEligible }: Props) {
  const [tab, setTab] = useState<TabView>('chart');
  const [loanView, setLoanView] = useState<LoanView>(hdbEligible ? 'hdb' : 'bank');

  const amortisation = loanView === 'hdb' ? hdbAmortisation : bankAmortisation;

  // Aggregate to yearly for charts
  const yearly = useMemo(() => {
    const years: { year: number; principal: number; interest: number; balance: number }[] = [];
    let currentYear = 0;
    let yearPrincipal = 0;
    let yearInterest = 0;

    for (const entry of amortisation) {
      if (entry.year !== currentYear) {
        if (currentYear > 0) {
          const lastOfYear = amortisation.filter((e) => e.year === currentYear);
          years.push({
            year: currentYear,
            principal: Math.round(yearPrincipal),
            interest: Math.round(yearInterest),
            balance: lastOfYear[lastOfYear.length - 1]?.balance ?? 0,
          });
        }
        currentYear = entry.year;
        yearPrincipal = 0;
        yearInterest = 0;
      }
      yearPrincipal += entry.principal;
      yearInterest += entry.interest;
    }
    // Last year
    if (currentYear > 0) {
      const lastOfYear = amortisation.filter((e) => e.year === currentYear);
      years.push({
        year: currentYear,
        principal: Math.round(yearPrincipal),
        interest: Math.round(yearInterest),
        balance: lastOfYear[lastOfYear.length - 1]?.balance ?? 0,
      });
    }
    return years;
  }, [amortisation]);

  const balanceChartData = {
    labels: yearly.map((y) => `Y${y.year}`),
    datasets: [
      {
        label: 'Outstanding Balance',
        data: yearly.map((y) => y.balance),
        borderColor: '#0c8188',
        backgroundColor: 'rgba(12,129,136,0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const paymentChartData = {
    labels: yearly.map((y) => `Y${y.year}`),
    datasets: [
      {
        label: 'Principal',
        data: yearly.map((y) => y.principal),
        backgroundColor: '#0c8188',
      },
      {
        label: 'Interest',
        data: yearly.map((y) => y.interest),
        backgroundColor: '#DB0000',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value: string | number) => formatCurrency(Number(value)),
        },
      },
    },
  };

  if (amortisation.length === 0) {
    return (
      <div>
        <p className="text-sm text-gray-500">No loan data to display.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Loan toggle */}
      <div className="flex gap-2 mb-4">
        {hdbEligible && (
          <button
            onClick={() => setLoanView('hdb')}
            className={`px-4 py-2 text-sm rounded-lg transition ${
              loanView === 'hdb'
                ? 'bg-primary-dark text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            HDB Loan
          </button>
        )}
        <button
          onClick={() => setLoanView('bank')}
          className={`px-4 py-2 text-sm rounded-lg transition ${
            loanView === 'bank'
              ? 'bg-primary-dark text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Bank Loan
        </button>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('chart')}
          className={`px-4 py-2 text-sm rounded-lg transition ${
            tab === 'chart'
              ? 'bg-accent text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Charts
        </button>
        <button
          onClick={() => setTab('table')}
          className={`px-4 py-2 text-sm rounded-lg transition ${
            tab === 'table'
              ? 'bg-accent text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Table
        </button>
      </div>

      {tab === 'chart' ? (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Outstanding Balance Over Time
            </h4>
            <div className="h-64">
              <Line data={balanceChartData} options={chartOptions} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Annual Principal vs Interest
            </h4>
            <div className="h-64">
              <Bar data={paymentChartData} options={{ ...chartOptions, scales: { ...chartOptions.scales, x: { stacked: true }, y: { ...chartOptions.scales.y, stacked: true } } }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Payment</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(amortisation[0]?.payment ?? 0)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Interest</p>
              <p className="text-lg font-bold text-red-500 dark:text-red-400">
                {formatCurrency(amortisation[amortisation.length - 1]?.totalInterest ?? 0)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Paid</p>
              <p className="text-lg font-bold text-gray-700 dark:text-gray-200">
                {formatCurrency(
                  (amortisation[amortisation.length - 1]?.totalPrincipal ?? 0) +
                    (amortisation[amortisation.length - 1]?.totalInterest ?? 0)
                )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs text-gray-800 dark:text-gray-100">
            <thead className="sticky top-0">
              <tr className="bg-primary-dark text-white">
                <th className="p-2 text-left">Year</th>
                <th className="p-2 text-right">Principal</th>
                <th className="p-2 text-right">Interest</th>
                <th className="p-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {yearly.map((y, i) => (
                <tr
                  key={y.year}
                  className={`border-b border-gray-100 dark:border-gray-700 ${
                    i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                  }`}
                >
                  <td className="p-2">{y.year}</td>
                  <td className="p-2 text-right">{formatCurrency(y.principal)}</td>
                  <td className="p-2 text-right text-red-500 dark:text-red-400">{formatCurrency(y.interest)}</td>
                  <td className="p-2 text-right font-medium">{formatCurrency(y.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
