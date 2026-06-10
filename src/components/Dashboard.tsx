import { useEffect, useState } from 'react';
import { getDashboard } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { BusinessSummary } from '../types';
import { SkeletonDashboard } from './Skeletons';
import DonutChart from './DonutChart';
import { usePageTitle } from '../hooks/usePageTitle';

function formatCurrency(value: number): string {
  if (value === 0) return '—';
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value);
}

function StatCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 transition-colors">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        {sub && (
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              positive !== undefined
                ? positive
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

function BusinessCard({
  business,
  onSelect,
}: {
  business: BusinessSummary;
  onSelect: (name: string) => void;
}) {
  const isProfit = business.totalProfit >= 0;
  const margin = business.totalInvestment > 0
    ? (business.totalProfit / business.totalInvestment) * 100
    : 0;

  return (
    <button
      onClick={() => onSelect(business.name)}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all text-left w-full cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{business.name}</h3>
        {business.entryCount > 0 && (
          <span className="text-xs text-slate-400 dark:text-slate-500">{business.entryCount} entries</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Investment</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {formatCurrency(business.totalInvestment)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Profit</p>
          <div className="flex items-baseline gap-2">
            <p
              className={`text-lg font-bold ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {formatCurrency(business.totalProfit)}
            </p>
            {business.totalInvestment > 0 && (
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  isProfit
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}
              >
                {margin.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {Object.keys(business.investorShares).length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
          <DonutChart
            segments={Object.entries(business.investorShares).map(([investor, share]) => ({
              label: investor,
              value: share,
            }))}
          />
        </div>
      )}

      {business.lastMonth && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Last entry: {business.lastMonth}</p>
      )}
    </button>
  );
}

export default function Dashboard({
  onSelectBusiness,
}: {
  onSelectBusiness: (name: string) => void;
}) {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  usePageTitle('Dashboard');

  useEffect(() => {
    getDashboard()
      .then((data) => {
        const allowed = user?.allowedBusinesses;
        const filtered = allowed ? data.businesses.filter((b) => allowed.includes(b.name)) : data.businesses;
        setBusinesses(filtered);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <SkeletonDashboard />;

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
        <p className="font-medium">Error loading dashboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const grandTotalInvestment = businesses.reduce((s, b) => s + b.totalInvestment, 0);
  const grandTotalProfit = businesses.reduce((s, b) => s + b.totalProfit, 0);
  const profitMargin = grandTotalInvestment > 0
    ? (grandTotalProfit / grandTotalInvestment) * 100
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Dashboard</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Overview of your investment portfolio
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Total Invested"
          value={formatCurrency(grandTotalInvestment)}
        />
        <StatCard
          label="Total Profit"
          value={formatCurrency(grandTotalProfit)}
          sub={profitMargin !== 0 ? `${profitMargin.toFixed(1)}% margin` : undefined}
          positive={grandTotalProfit >= 0}
        />
      </div>

      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Businesses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((b) => (
            <BusinessCard key={b.name} business={b} onSelect={onSelectBusiness} />
          ))}
        </div>
        {businesses.length === 0 && (
          <p className="text-slate-500 dark:text-slate-400 text-center py-12">
            No businesses found. Make sure your Google Sheet has data.
          </p>
        )}
      </div>
    </div>
  );
}
