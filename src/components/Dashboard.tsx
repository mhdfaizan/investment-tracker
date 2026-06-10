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

function BusinessCard({
  business,
  onSelect,
}: {
  business: BusinessSummary;
  onSelect: (name: string) => void;
}) {
  const isProfit = business.totalProfit >= 0;

  return (
    <button
      onClick={() => onSelect(business.name)}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-5 sm:p-6 hover:shadow-md dark:hover:shadow-slate-700/30 transition-all text-left w-full cursor-pointer"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{business.name}</h3>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">Total Investment</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(business.totalInvestment)}
          </p>
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">Total Profit</p>
          <p
            className={`text-lg sm:text-xl font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {formatCurrency(business.totalProfit)}
          </p>
        </div>
      </div>

      {Object.keys(business.investorShares).length > 0 && (
        <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mb-2">Investor Shares</p>
          <DonutChart
            segments={Object.entries(business.investorShares).map(([investor, share]) => ({
              label: investor,
              value: share,
            }))}
          />
        </div>
      )}

      {business.lastMonth && (
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">Last entry: {business.lastMonth}</p>
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
      </div>

      {/* Grand totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-4 sm:p-5 text-white shadow-sm">
          <p className="text-indigo-200 text-xs sm:text-sm">Total Invested (All Businesses)</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">
            {formatCurrency(grandTotalInvestment)}
          </p>
        </div>
        <div
          className={`rounded-xl p-4 sm:p-5 text-white shadow-sm ${
            grandTotalProfit >= 0
              ? 'bg-gradient-to-br from-green-600 to-green-700'
              : 'bg-gradient-to-br from-red-600 to-red-700'
          }`}
        >
          <p
            className={`text-xs sm:text-sm ${grandTotalProfit >= 0 ? 'text-green-200' : 'text-red-200'}`}
          >
            Total Profit (All Businesses)
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-1">
            {formatCurrency(grandTotalProfit)}
          </p>
        </div>
      </div>

      {/* Business cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {businesses.map((b) => (
          <BusinessCard key={b.name} business={b} onSelect={onSelectBusiness} />
        ))}
      </div>

      {businesses.length === 0 && (
        <p className="text-gray-500 dark:text-slate-400 text-center py-12">
          No businesses found. Make sure your Google Sheet has data.
        </p>
      )}
    </div>
  );
}
