'use client';

import Card from '@/components/common/card';
import StatRow from '@/components/common/stat-row';
import { formatCurrency } from '@/constants/ui';
import type { GrantResult } from '@/constants/grants';

interface Props {
  grants: GrantResult;
}

export default function GrantResultView({ grants }: Props) {
  if (grants.breakdown.length === 0) return null;

  return (
    <Card title="Government Grants">
      <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
        {grants.breakdown.map((item) => (
          <StatRow
            key={item.name}
            label={item.name}
            value={item.amount > 0 ? formatCurrency(item.amount) : '—'}
            subtext={item.reason}
          />
        ))}

        {grants.total > 0 && (
          <div className="pt-2 mt-1 border-t-2 border-gray-200 dark:border-gray-600">
            <StatRow
              label="Total Grants"
              value={formatCurrency(grants.total)}
              highlight
              subtext="Credited to CPF OA, offsets purchase"
            />
          </div>
        )}
      </div>

      {grants.total > 0 && (
        <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">
            Grants added to your CPF OA — reduces your loan amount and/or cash outlay.
          </p>
        </div>
      )}
    </Card>
  );
}
