import { useEffect, useState } from 'react';
import { getBusinesses, addEntry } from '../services/api';
import type { ToastVariant } from '../hooks/useToast';

const INVESTORS = ['Faizan', 'Atufa', 'Marjan'];

type EntryType = 'capital' | 'monthly' | '';

interface DataEntryProps {
  showToast?: (message: string, variant: ToastVariant) => void;
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function inputClass() {
  return 'w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-slate-400';
}

export default function DataEntry({ showToast }: DataEntryProps) {
  const [businesses, setBusinesses] = useState<string[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [entryType, setEntryType] = useState<EntryType>('');
  const [submitting, setSubmitting] = useState(false);

  const [capitalDate, setCapitalDate] = useState('');
  const [investor, setInvestor] = useState('');
  const [capitalAmount, setCapitalAmount] = useState('');
  const [capitalComment, setCapitalComment] = useState('');

  const [monthlyDate, setMonthlyDate] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [profitAmount, setProfitAmount] = useState('');
  const [forMonth, setForMonth] = useState('');
  const [status, setStatus] = useState('Reinvested');
  const [monthlyComment, setMonthlyComment] = useState('');

  useEffect(() => {
    getBusinesses().then(setBusinesses).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;
    setSubmitting(true);

    try {
      if (entryType === 'capital') {
        const amount = parseFloat(capitalAmount);
        if (isNaN(amount) || amount <= 0) {
          showToast?.('Amount must be a positive number', 'error');
          setSubmitting(false);
          return;
        }
        const row: string[] = [String(amount), capitalDate, investor, 'Capital', capitalComment || '', '', ''];
        await addEntry(selectedBusiness, row);
        showToast?.('Capital entry added successfully!', 'success');
        setCapitalDate(''); setInvestor(''); setCapitalAmount(''); setCapitalComment('');
      } else if (entryType === 'monthly') {
        const invested = parseFloat(investedAmount);
        const profit = parseFloat(profitAmount);
        if (isNaN(invested) || invested <= 0) {
          showToast?.('Invested amount must be a positive number', 'error');
          setSubmitting(false);
          return;
        }
        if (isNaN(profit)) {
          showToast?.('Profit amount must be a valid number', 'error');
          setSubmitting(false);
          return;
        }
        const row: string[] = ['', '', '', '', '', '', '', '', monthlyDate, String(invested), String(profit), forMonth, status, monthlyComment || ''];
        await addEntry(selectedBusiness, row);
        showToast?.('Monthly entry added successfully!', 'success');
        setMonthlyDate(''); setInvestedAmount(''); setProfitAmount(''); setForMonth(''); setStatus('Reinvested'); setMonthlyComment('');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      showToast?.(`Error: ${message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isValid =
    selectedBusiness && entryType &&
    (entryType === 'capital'
      ? capitalDate && investor && capitalAmount && parseFloat(capitalAmount) > 0
      : monthlyDate && forMonth && investedAmount && parseFloat(investedAmount) > 0);

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Entry</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Record a capital injection or monthly profit</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-5 transition-colors">
          <Field label="Business" required>
            <select value={selectedBusiness} onChange={(e) => setSelectedBusiness(e.target.value)} className={inputClass()} required>
              <option value="">Select a business...</option>
              {businesses.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>

          <Field label="Entry Type" required>
            <div className="flex gap-4">
              {(['capital', 'monthly'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio" name="entryType" value={t}
                    checked={entryType === t}
                    onChange={() => setEntryType(t)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {t === 'capital' ? 'Capital Injection' : 'Monthly Profit'}
                  </span>
                </label>
              ))}
            </div>
          </Field>
        </div>

        {entryType === 'capital' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 transition-colors">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Capital Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date" required><input type="date" value={capitalDate} onChange={(e) => setCapitalDate(e.target.value)} className={inputClass()} required /></Field>
              <Field label="Investor" required>
                <select value={investor} onChange={(e) => setInvestor(e.target.value)} className={inputClass()} required>
                  <option value="">Select investor...</option>
                  {INVESTORS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Amount (PKR)" required><input type="number" placeholder="500000" min="1" value={capitalAmount} onChange={(e) => setCapitalAmount(e.target.value)} className={inputClass()} required /></Field>
              <Field label="Comment"><input type="text" placeholder="Optional note" value={capitalComment} onChange={(e) => setCapitalComment(e.target.value)} className={inputClass()} /></Field>
            </div>
          </div>
        )}

        {entryType === 'monthly' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 transition-colors">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Monthly Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date" required><input type="date" value={monthlyDate} onChange={(e) => setMonthlyDate(e.target.value)} className={inputClass()} required /></Field>
              <Field label="For Month" required>
                <select value={forMonth} onChange={(e) => setForMonth(e.target.value)} className={inputClass()} required>
                  <option value="">Select month...</option>
                  {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Invested (PKR)" required><input type="number" placeholder="5000000" min="1" value={investedAmount} onChange={(e) => setInvestedAmount(e.target.value)} className={inputClass()} required /></Field>
              <Field label="Profit (PKR)" required><input type="number" placeholder="50000" value={profitAmount} onChange={(e) => setProfitAmount(e.target.value)} className={inputClass()} required /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass()}>
                  <option value="Reinvested">Reinvested</option>
                  <option value="Received">Received</option>
                  <option value="Taken Out">Taken Out</option>
                </select>
              </Field>
              <Field label="Comment"><input type="text" placeholder="Optional note" value={monthlyComment} onChange={(e) => setMonthlyComment(e.target.value)} className={inputClass()} /></Field>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !isValid}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {submitting ? 'Saving...' : 'Save Entry'}
        </button>
      </form>
    </div>
  );
}
