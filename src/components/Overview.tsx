import { useEffect, useState } from 'react';
import { getBusiness } from '../services/api';
import { SkeletonTable } from './Skeletons';
import { usePageTitle } from '../hooks/usePageTitle';

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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error loading {businessName}</p>
        <p className="text-sm mt-1">{error}</p>
        <button onClick={onBack} className="mt-3 text-sm text-indigo-600 hover:underline">
          &larr; Back
        </button>
      </div>
    );
  }

  const rightHeaders = headers.slice(8).filter((h) => h);

  return (
    <div>
      <button
        onClick={onBack}
        className="text-indigo-600 hover:underline text-sm mb-3 sm:mb-4 inline-block"
      >
        &larr; Back to Dashboard
      </button>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
        {businessName}
      </h2>

      {/* Investment entries */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">
          Capital Entries
        </h3>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                  Amount
                </th>
                <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                  Date
                </th>
                <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                  Investor
                </th>
                <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                  Type
                </th>
                <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                  Comment
                </th>
              </tr>
            </thead>
            <tbody>
              {data
                .filter((row) => row[2] && row[3])
                .map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-2 sm:px-3 py-2 sm:py-2.5">
                      {row[0] ? Number(row[0]).toLocaleString() : ''}
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-2.5">{row[1] || ''}</td>
                    <td className="px-2 sm:px-3 py-2 sm:py-2.5">{row[2] || ''}</td>
                    <td className="px-2 sm:px-3 py-2 sm:py-2.5">
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium ${
                          row[3] === 'Capital'
                            ? 'bg-blue-50 text-blue-700'
                            : row[3] === 'Taken Out'
                              ? 'bg-yellow-50 text-yellow-700'
                              : row[3]?.includes('Profit')
                                ? 'bg-green-50 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {row[3] || ''}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-500 max-w-[150px] truncate">
                      {row[4] || ''}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly data */}
      {rightHeaders.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">
            Monthly Performance
          </h3>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                    Date
                  </th>
                  <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                    Invested
                  </th>
                  <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                    Amount
                  </th>
                  <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                    Month
                  </th>
                  <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                    Comment
                  </th>
                  {headers[15] && headers[15].includes('Faizan') && (
                    <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                      Faizan
                    </th>
                  )}
                  {headers[16] && headers[16].includes('Atufa') && (
                    <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                      Atufa
                    </th>
                  )}
                  {headers[17] && headers[17].includes('Marjan') && (
                    <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                      Marjan
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data
                  .filter((row) => row[8] && String(row[8]).trim())
                  .map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 sm:px-3 py-2 sm:py-2.5">{row[8] || ''}</td>
                      <td className="px-2 sm:px-3 py-2 sm:py-2.5">
                        {row[9] ? Number(row[9]).toLocaleString() : ''}
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-2.5 font-medium">
                        {row[10] ? Number(row[10]).toLocaleString() : ''}
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-2.5">{row[12] || ''}</td>
                      <td className="px-2 sm:px-3 py-2 sm:py-2.5">
                        <span
                          className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium ${
                            row[13] === 'Reinvested'
                              ? 'bg-blue-50 text-blue-700'
                              : row[13] === 'Received'
                                ? 'bg-green-50 text-green-700'
                                : row[13] === 'Taken Out'
                                  ? 'bg-yellow-50 text-yellow-700'
                                  : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {row[13] || ''}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-500 max-w-[150px] truncate">
                        {row[14] || ''}
                      </td>
                      {headers[15] && headers[15].includes('Faizan') && (
                        <td className="px-2 sm:px-3 py-2 sm:py-2.5">{row[15] || ''}</td>
                      )}
                      {headers[16] && headers[16].includes('Atufa') && (
                        <td className="px-2 sm:px-3 py-2 sm:py-2.5">{row[16] || ''}</td>
                      )}
                      {headers[17] && headers[17].includes('Marjan') && (
                        <td className="px-2 sm:px-3 py-2 sm:py-2.5">{row[17] || ''}</td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
