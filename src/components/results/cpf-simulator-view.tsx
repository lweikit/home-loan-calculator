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
import StatRow from '@/components/common/stat-row';
import { formatCurrency } from '@/constants/ui';
import type { CpfSimulationResult } from '@/utils/cpf-simulator';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface Props {
  simulation: CpfSimulationResult;
  loanLabel: string;
}

type TabView = 'summary' | 'chart' | 'table';

export default function CpfSimulatorView({ simulation, loanLabel }: Props) {
  const [tab, setTab] = useState<TabView>('summary');

  const chartData = useMemo(() => ({
    labels: simulation.yearlyEntries.map((y) => `Y${y.year}`),
    datasets: [
      {
        label: 'Total CPF Withdrawn',
        data: simulation.yearlyEntries.map((y) => y.totalCpfWithdrawn),
        borderColor: '#0c8188',
        backgroundColor: 'rgba(12,129,136,0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Accrued Interest',
        data: simulation.yearlyEntries.map((y) => y.accruedInterest),
        borderColor: '#DB0000',
        backgroundColor: 'rgba(219,0,0,0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Total Owed to CPF',
        data: simulation.yearlyEntries.map((y) => y.totalOwedToCpf),
        borderColor: '#6B21A8',
        backgroundColor: 'rgba(107,33,168,0.05)',
        borderDash: [5, 5],
        fill: false,
        tension: 0.3,
      },
    ],
  }), [simulation]);

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

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['summary', 'chart', 'table'] as TabView[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-lg transition capitalize ${
              tab === t
                ? 'bg-primary-dark text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
          <div className="pt-1">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide pb-1">
              CPF Breakdown
            </p>
          </div>
          <StatRow
            label="CPF for Downpayment"
            value={formatCurrency(simulation.cpfUsedForDownpayment)}
          />
          {simulation.cpfUsedForLoan > 0 && (
            <StatRow
              label="CPF to Offset Loan"
              value={formatCurrency(simulation.cpfUsedForLoan)}
            />
          )}
          <StatRow
            label="CPF for Monthly Payments"
            value={formatCurrency(simulation.cpfUsedForMonthlyPayments)}
          />
          <StatRow
            label="Total CPF Withdrawn"
            value={formatCurrency(simulation.totalCpfWithdrawn)}
            highlight
          />

          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide pt-2 pb-1">
              Accrued Interest (2.5% p.a.)
            </p>
          </div>
          <StatRow
            label="Accrued Interest"
            value={formatCurrency(simulation.totalAccruedInterest)}
            subtext="Compounded on all CPF withdrawn"
          />
          <StatRow
            label="Total Owed to CPF on Sale"
            value={formatCurrency(simulation.totalOwedToCpf)}
            highlight
            subtext="Principal + accrued interest, refunded to your CPF OA"
          />

          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              When you sell, you must refund <strong>{formatCurrency(simulation.totalOwedToCpf)}</strong>{' '}to your CPF OA.
              This comes from the sale proceeds — it&apos;s not extra cash you need to find, but it reduces what you pocket.
            </p>
          </div>
        </div>
      )}

      {tab === 'chart' && (
        <div className="h-72">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {tab === 'table' && (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs text-gray-800 dark:text-gray-100">
            <thead className="sticky top-0">
              <tr className="bg-primary-dark text-white">
                <th className="p-2 text-left">Year</th>
                <th className="p-2 text-right">CPF Used</th>
                <th className="p-2 text-right">Total Withdrawn</th>
                <th className="p-2 text-right">Accrued Interest</th>
                <th className="p-2 text-right">Owed to CPF</th>
              </tr>
            </thead>
            <tbody>
              {simulation.yearlyEntries.map((y, i) => (
                <tr
                  key={y.year}
                  className={`border-b border-gray-100 dark:border-gray-700 ${
                    i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                  }`}
                >
                  <td className="p-2">{y.year}</td>
                  <td className="p-2 text-right">{formatCurrency(y.cpfUsedThisYear)}</td>
                  <td className="p-2 text-right">{formatCurrency(y.totalCpfWithdrawn)}</td>
                  <td className="p-2 text-right text-red-500 dark:text-red-400">{formatCurrency(y.accruedInterest)}</td>
                  <td className="p-2 text-right font-medium">{formatCurrency(y.totalOwedToCpf)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
