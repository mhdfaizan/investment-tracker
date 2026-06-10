import { useEffect, useState } from 'react';
import { getBusiness } from '../services/api';
import { SkeletonTable } from './Skeletons';
import DonutChart from './DonutChart';
import { usePageTitle } from '../hooks/usePageTitle';

function parseAmount(val: string | undefined | null): number {
  if (!val) return 0;
  return Number(String(val).replace(/,/g, '').trim()) || 0;
}

interface OverviewProps {
  businessName: string;
  onBack: () => void;
}

export default function Overview({ businessName, onBack }: OverviewProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  usePageTitle(businessName);

  useEffect(() => {
    setLoading(true);
    getBusiness(businessName)
      .then((res) => {
        setHeaders(res.headers);
        setData(res.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [businessName]);

  if (loading) {
    return (
      <div>
        <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
        <SkeletonTable />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
        <p className="font-medium">Error loading {businessName}</p>
        <p className="text-sm mt-1">{error}</p>
        <button onClick={onBack} className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          &larr; Back
        </button>
      </div>
    );
  }

  // --- Monthly Profits ---
  interface ProfitCol { key: string; label: string; idx: number; fmt: 'text' | 'amount' | 'pct' }
  const profitCols: ProfitCol[] = [];
  const shareNames: string[] = [];

  for (let i = 10; i < headers.length; i++) {
    const h = (headers[i] || '').trim();
    if (!h) continue;
    const lower = h.toLowerCase();
    if (lower.includes('invested')) {
      profitCols.push({ key: 'invested', label: 'Invested', idx: i, fmt: 'amount' });
    } else if (lower === 'amount' || lower === 'total profit') {
      profitCols.push({ key: 'profit', label: 'Profit', idx: i, fmt: 'amount' });
    } else if (lower.includes('for month')) {
      profitCols.push({ key: 'month', label: 'Month', idx: i, fmt: 'text' });
    } else if (lower.includes('profit/loss')) {
      profitCols.push({ key: 'pl', label: 'Type', idx: i, fmt: 'text' });
    } else if (lower.includes('status')) {
      profitCols.push({ key: 'status', label: 'Status', idx: i, fmt: 'text' });
    } else if (lower.includes('comment')) {
      profitCols.push({ key: 'comment', label: 'Comment', idx: i, fmt: 'text' });
    } else if (lower.includes('profit share')) {
      const name = h.replace(/profit share/i, '').replace(/[()]/g, '').trim();
      shareNames.push(name);
      profitCols.push({ key: `share_${name}`, label: `${name}`, idx: i, fmt: 'amount' });
    } else if (lower.includes('% share')) {
      const name = h.replace(/[%]|share/gi, '').replace(/[()]/g, '').trim();
      profitCols.push({ key: `pct_${name}`, label: `${name} %`, idx: i, fmt: 'pct' });
    }
  }
  const profitRows = data.filter((row) => row[9] && String(row[9]).trim());
  const totalProfit = profitRows.reduce((sum, r) => {
    const profitCol = profitCols.find((c) => c.key === 'profit');
    return sum + (profitCol ? parseAmount(r[profitCol.idx]) : 0);
  }, 0);

  // Per-shareholder totals
  const shareTotals: Record<string, number> = {};
  const sharePctAverages: Record<string, number> = {};
  for (const name of shareNames) {
    const vals = profitRows.map((r) => {
      const col = profitCols.find((c) => c.key === `share_${name}`);
      return col ? parseAmount(r[col.idx]) : 0;
    });
    shareTotals[name] = vals.reduce((a, b) => a + b, 0);
    const pctCol = profitCols.find((c) => c.key === `pct_${name}`);
    if (pctCol) {
      const pcts = profitRows.map((r) => parseAmount(r[pctCol.idx])).filter((p) => p > 0);
      sharePctAverages[name] = pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : 0;
    }
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mb-3 sm:mb-4 inline-block"
      >
        &larr; Back to Dashboard
      </button>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
        {businessName}
      </h2>

      {/* --- Capital Entries --- */}
      {(() => {
        const capitalRows = data.filter((row) => row[2] && row[3]);
        const totalCapital = capitalRows
          .filter((r) => r[3] === 'Capital')
          .reduce((s, r) => s + parseAmount(r[0]), 0);
        const totalTakenOut = capitalRows
          .filter((r) => r[3] === 'Taken Out')
          .reduce((s, r) => s + parseAmount(r[0]), 0);
        const profitReinvested = capitalRows
          .filter((r) => r[3]?.includes('Profit'))
          .reduce((s, r) => s + parseAmount(r[0]), 0);
        const netInvested = totalCapital - totalTakenOut;

        const byInvestor: Record<string, { capital: number; taken: number; profit: number }> = {};
        for (const r of capitalRows) {
          const inv = r[2] || 'Unknown';
          if (!byInvestor[inv]) byInvestor[inv] = { capital: 0, taken: 0, profit: 0 };
          const amt = parseAmount(r[0]);
          if (r[3] === 'Capital') byInvestor[inv].capital += amt;
          else if (r[3] === 'Taken Out') byInvestor[inv].taken += amt;
          else if (r[3]?.includes('Profit')) byInvestor[inv].profit += amt;
        }

        return (
          <div className="mb-6 sm:mb-8 space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 transition-colors">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Total Capital</p>
                <p className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{totalCapital.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 transition-colors">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Profit Reinvested</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-400">{profitReinvested.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 transition-colors">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Taken Out</p>
                <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{totalTakenOut.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 transition-colors">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Net Invested</p>
                <p className="text-lg font-bold text-gray-800 dark:text-white">{netInvested.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 transition-colors">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Entries</p>
                <p className="text-lg font-bold text-gray-800 dark:text-white">{capitalRows.length}</p>
              </div>
            </div>

            {/* By-investor breakdown */}
            {Object.keys(byInvestor).length > 0 && (
              <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg p-4 transition-colors">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">By Investor</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(byInvestor).map(([name, vals]) => (
                    <div key={name} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 transition-colors">
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{name}</p>
                      <p className="text-sm font-bold text-gray-800 dark:text-white">
                        Capital: {vals.capital.toLocaleString()}
                      </p>
                      {vals.taken > 0 && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">Taken: {vals.taken.toLocaleString()}</p>
                      )}
                      {vals.profit > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400">Profit: {vals.profit.toLocaleString()}</p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        Net: {(vals.capital - vals.taken).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Entries table */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3">
                All Entries
              </h3>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600 dark:text-slate-300">Amount</th>
                      <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600 dark:text-slate-300">Date</th>
                      <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600 dark:text-slate-300">Investor</th>
                      <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600 dark:text-slate-300">Type</th>
                      <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600 dark:text-slate-300">Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capitalRows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-900 dark:text-white">{parseAmount(row[0]) ? parseAmount(row[0]).toLocaleString() : ''}</td>
                        <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-900 dark:text-white">{row[1] || ''}</td>
                        <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-900 dark:text-white">{row[2] || ''}</td>
                        <td className="px-2 sm:px-3 py-2 sm:py-2.5">
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium ${
                            row[3] === 'Capital' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                            row[3] === 'Taken Out' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                            row[3]?.includes('Profit') ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                            'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                          }`}>{row[3] || ''}</span>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-500 dark:text-slate-400 max-w-[150px] truncate">
                          {row[4] || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Monthly Profits */}
      {profitRows.length > 0 && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 transition-colors">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Total Profit</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">{totalProfit.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 transition-colors">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Avg Monthly</p>
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {Math.round(totalProfit / profitRows.length).toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 transition-colors">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Best Month</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                {Math.max(...profitRows.map((r) => {
                  const col = profitCols.find((c) => c.key === 'profit');
                  return col ? parseAmount(r[col.idx]) : 0;
                })).toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 transition-colors">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Months Tracked</p>
              <p className="text-lg font-bold text-gray-800 dark:text-white">{profitRows.length}</p>
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3">
              Monthly Profits
            </h3>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                    <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600 dark:text-slate-300 whitespace-nowrap">
                      {headers[9] || 'Date'}
                    </th>
                    {profitCols.map((c) => (
                      <th key={c.key} className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600 dark:text-slate-300 whitespace-nowrap">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profitRows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-2 sm:px-3 py-2 sm:py-2.5 whitespace-nowrap text-gray-900 dark:text-white">{row[9] || ''}</td>
                      {profitCols.map((c) => {
                        const val = row[c.idx] || '';
                        if (c.fmt === 'amount') {
                          const num = parseAmount(val);
                          return (
                            <td key={c.key} className="px-2 sm:px-3 py-2 sm:py-2.5 text-right font-medium tabular-nums text-gray-900 dark:text-white">
                              {num ? num.toLocaleString() : ''}
                            </td>
                          );
                        }
                        if (c.key === 'status') {
                          return (
                            <td key={c.key} className="px-2 sm:px-3 py-2 sm:py-2.5">
                              <span className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium ${
                                val === 'Reinvested' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                val === 'Received' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                val === 'Taken Out' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                val === 'Skipped' ? 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400' :
                                'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                              }`}>{val}</span>
                            </td>
                          );
                        }
                        if (c.key === 'pl') {
                          return (
                            <td key={c.key} className="px-2 sm:px-3 py-2 sm:py-2.5">
                              <span className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium ${
                                val === 'Profit' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                val === 'Loss' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                              }`}>{val}</span>
                            </td>
                          );
                        }
                        return (
                          <td key={c.key} className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-500 dark:text-slate-400 max-w-[120px] truncate">
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shareholder Summary */}
          {shareNames.length > 0 && (
            <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg p-4 transition-colors">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Profit Share Distribution</h4>
              <div className="flex flex-wrap items-start gap-6">
                <DonutChart
                  segments={shareNames.map((name) => ({
                    label: name,
                    value: shareTotals[name],
                  }))}
                />
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 min-w-0 flex-1">
                  {shareNames.map((name) => (
                    <div key={name} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 transition-colors">
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{name}</p>
                      <p className="text-lg font-bold text-gray-800 dark:text-white">
                        {shareTotals[name].toLocaleString()}
                      </p>
                      {sharePctAverages[name] > 0 && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                          Avg share: {sharePctAverages[name].toFixed(1)}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
