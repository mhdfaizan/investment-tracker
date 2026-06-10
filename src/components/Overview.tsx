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

function Card({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-colors">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${positive !== undefined ? positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  );
}

function Badge({ label, variant }: { label: string; variant: 'blue' | 'emerald' | 'amber' | 'red' | 'slate' }) {
  const styles = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    slate: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[variant]}`}>
      {label}
    </span>
  );
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
      <div className="space-y-6">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 animate-pulse" />
        <SkeletonTable />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
        <p className="font-medium">Error loading {businessName}</p>
        <p className="text-sm mt-1">{error}</p>
        <button onClick={onBack} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">
          &larr; Back
        </button>
      </div>
    );
  }

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
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{businessName}</h2>
        </div>
      </div>

      {/* Capital Entries */}
      {capitalRows.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Capital Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card label="Total Capital" value={totalCapital.toLocaleString()} />
            <Card label="Profit Reinvested" value={profitReinvested.toLocaleString()} positive />
            <Card label="Taken Out" value={totalTakenOut.toLocaleString()} positive={false} />
            <Card label="Net Invested" value={netInvested.toLocaleString()} />
            <Card label="Entries" value={String(capitalRows.length)} />
          </div>

          {Object.keys(byInvestor).length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 transition-colors">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">By Investor</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(byInvestor).map(([name, vals]) => (
                  <div key={name} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-3 transition-colors">
                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">{name}</p>
                    <div className="space-y-1 text-xs">
                      <p className="text-slate-600 dark:text-slate-400">Capital: <span className="font-medium text-slate-900 dark:text-white">{vals.capital.toLocaleString()}</span></p>
                      {vals.taken > 0 && <p className="text-amber-600 dark:text-amber-400">Taken: {vals.taken.toLocaleString()}</p>}
                      {vals.profit > 0 && <p className="text-emerald-600 dark:text-emerald-400">Profit: {vals.profit.toLocaleString()}</p>}
                      <p className="text-slate-400 dark:text-slate-500">Net: <span className="font-medium">{(vals.capital - vals.taken).toLocaleString()}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">All Entries</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-5 py-3 font-medium text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-5 py-3 font-medium text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3 font-medium text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Investor</th>
                    <th className="text-left px-5 py-3 font-medium text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="text-left px-5 py-3 font-medium text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {capitalRows.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 text-slate-900 dark:text-white font-medium tabular-nums">
                        {parseAmount(row[0]) ? parseAmount(row[0]).toLocaleString() : ''}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{row[1] || ''}</td>
                      <td className="px-5 py-3 text-slate-900 dark:text-white">{row[2] || ''}</td>
                      <td className="px-5 py-3">
                        {row[3] === 'Capital' ? <Badge label="Capital" variant="blue" /> :
                         row[3] === 'Taken Out' ? <Badge label="Taken Out" variant="amber" /> :
                         row[3]?.includes('Profit') ? <Badge label="Profit" variant="emerald" /> :
                         <Badge label={row[3] || ''} variant="slate" />}
                      </td>
                      <td className="px-5 py-3 text-slate-400 dark:text-slate-500 max-w-[150px] truncate">
                        {row[4] || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Monthly Profits */}
      {profitRows.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Monthly Profits</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card label="Total Profit" value={totalProfit.toLocaleString()} positive={totalProfit >= 0} />
            <Card label="Avg Monthly" value={Math.round(totalProfit / profitRows.length).toLocaleString()} />
            <Card label="Best Month" value={Math.max(...profitRows.map((r) => {
              const col = profitCols.find((c) => c.key === 'profit');
              return col ? parseAmount(r[col.idx]) : 0;
            })).toLocaleString()} positive />
            <Card label="Months Tracked" value={String(profitRows.length)} />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Monthly Breakdown</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-5 py-3 font-medium text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {headers[9] || 'Date'}
                    </th>
                    {profitCols.map((c) => (
                      <th key={c.key} className="text-left px-5 py-3 font-medium text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profitRows.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap text-slate-900 dark:text-white">{row[9] || ''}</td>
                      {profitCols.map((c) => {
                        const val = row[c.idx] || '';
                        if (c.fmt === 'amount') {
                          const num = parseAmount(val);
                          return (
                            <td key={c.key} className="px-5 py-3 text-right font-medium tabular-nums text-slate-900 dark:text-white">
                              {num ? num.toLocaleString() : ''}
                            </td>
                          );
                        }
                        if (c.key === 'status') {
                          return (
                            <td key={c.key} className="px-5 py-3">
                              {val === 'Reinvested' ? <Badge label="Reinvested" variant="blue" /> :
                               val === 'Received' ? <Badge label="Received" variant="emerald" /> :
                               val === 'Taken Out' ? <Badge label="Taken Out" variant="amber" /> :
                               val === 'Skipped' ? <Badge label="Skipped" variant="slate" /> :
                               <Badge label={val} variant="slate" />}
                            </td>
                          );
                        }
                        if (c.key === 'pl') {
                          return (
                            <td key={c.key} className="px-5 py-3">
                              {val === 'Profit' ? <Badge label="Profit" variant="emerald" /> :
                               val === 'Loss' ? <Badge label="Loss" variant="red" /> :
                               <Badge label={val} variant="slate" />}
                            </td>
                          );
                        }
                        return (
                          <td key={c.key} className="px-5 py-3 text-slate-500 dark:text-slate-400 max-w-[120px] truncate">
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

          {shareNames.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 transition-colors">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Profit Share Distribution</h4>
              <div className="flex flex-wrap items-start gap-6">
                <DonutChart
                  segments={shareNames.map((name) => ({
                    label: name,
                    value: shareTotals[name],
                  }))}
                />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 min-w-0 flex-1">
                  {shareNames.map((name) => (
                    <div key={name} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-3 transition-colors">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{name}</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {shareTotals[name].toLocaleString()}
                      </p>
                      {sharePctAverages[name] > 0 && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          Avg share: {sharePctAverages[name].toFixed(1)}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
