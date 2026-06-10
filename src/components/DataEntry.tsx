import { useEffect, useState } from 'react';
import { getBusinesses, addEntry } from '../services/api';
import type { ToastVariant } from '../hooks/useToast';

const INVESTORS = ['Faizan', 'Atufa', 'Marjan'];

type EntryType = 'capital' | 'monthly' | '';

interface DataEntryProps {
  showToast?: (message: string, variant: ToastVariant) => void;
}

export default function DataEntry({ showToast }: DataEntryProps) {
  const [businesses, setBusinesses] = useState<string[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [entryType, setEntryType] = useState<EntryType>('');
  const [submitting, setSubmitting] = useState(false);

  // Capital fields
  const [capitalDate, setCapitalDate] = useState('');
  const [investor, setInvestor] = useState('');
  const [capitalAmount, setCapitalAmount] = useState('');
  const [capitalComment, setCapitalComment] = useState('');

  // Monthly fields
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

        const row: string[] = [
          String(amount),
          capitalDate,
          investor,
          'Capital',
          capitalComment || '',
          '',
          '',
        ];
        await addEntry(selectedBusiness, row);
        showToast?.('Capital entry added successfully!', 'success');
        setCapitalDate('');
        setInvestor('');
        setCapitalAmount('');
        setCapitalComment('');
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

        const row: string[] = [
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          monthlyDate,
          String(invested),
          String(profit),
          forMonth,
          status,
          monthlyComment || '',
        ];

        await addEntry(selectedBusiness, row);
        showToast?.('Monthly entry added successfully!', 'success');
        setMonthlyDate('');
        setInvestedAmount('');
        setProfitAmount('');
        setForMonth('');
        setStatus('Reinvested');
        setMonthlyComment('');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      showToast?.(`Error: ${message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Gather all validation errors
  const isValid =
    selectedBusiness &&
    entryType &&
    (entryType === 'capital'
      ? capitalDate && investor && capitalAmount && parseFloat(capitalAmount) > 0
      : monthlyDate &&
        forMonth &&
        investedAmount &&
        parseFloat(investedAmount) > 0);

  return (
    <div className="max-w-2xl px-1 sm:px-0">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Add Entry</h2>

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        {/* Business selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business</label>
          <select
            value={selectedBusiness}
            onChange={(e) => setSelectedBusiness(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Select a business...</option>
            {businesses.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Entry type selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Entry Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="entryType"
                value="capital"
                checked={entryType === 'capital'}
                onChange={() => setEntryType('capital')}
                className="text-indigo-600 w-4 h-4"
              />
              <span className="text-sm text-gray-700">Capital Injection</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="entryType"
                value="monthly"
                checked={entryType === 'monthly'}
                onChange={() => setEntryType('monthly')}
                className="text-indigo-600 w-4 h-4"
              />
              <span className="text-sm text-gray-700">Monthly Profit</span>
            </label>
          </div>
        </div>

        {/* Capital form */}
        {entryType === 'capital' && (
          <div className="space-y-4 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={capitalDate}
                  onChange={(e) => setCapitalDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investor
                </label>
                <select
                  value={investor}
                  onChange={(e) => setInvestor(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select investor...</option>
                  {INVESTORS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (PKR)
                </label>
                <input
                  type="number"
                  placeholder="500000"
                  min="1"
                  value={capitalAmount}
                  onChange={(e) => setCapitalAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment
                </label>
                <input
                  type="text"
                  placeholder="Optional note"
                  value={capitalComment}
                  onChange={(e) => setCapitalComment(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Monthly profit form */}
        {entryType === 'monthly' && (
          <div className="space-y-4 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={monthlyDate}
                  onChange={(e) => setMonthlyDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  For Month
                </label>
                <select
                  value={forMonth}
                  onChange={(e) => setForMonth(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select month...</option>
                  {[
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December',
                  ].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invested Amount (PKR)
                </label>
                <input
                  type="number"
                  placeholder="5000000"
                  min="1"
                  value={investedAmount}
                  onChange={(e) => setInvestedAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profit Amount (PKR)
                </label>
                <input
                  type="number"
                  placeholder="50000"
                  value={profitAmount}
                  onChange={(e) => setProfitAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Reinvested">Reinvested</option>
                  <option value="Received">Received</option>
                  <option value="Taken Out">Taken Out</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment
                </label>
                <input
                  type="text"
                  placeholder="Optional note"
                  value={monthlyComment}
                  onChange={(e) => setMonthlyComment(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !isValid}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium text-base hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sticky bottom-20 sm:bottom-4 z-20"
        >
          {submitting ? 'Saving...' : 'Save Entry'}
        </button>
      </form>
    </div>
  );
}
