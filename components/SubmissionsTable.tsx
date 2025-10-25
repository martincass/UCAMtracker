
import React, { useState, useMemo } from 'react';
import { Submission } from '../types';
import { SearchIcon } from './Icons';

interface SubmissionsTableProps {
  submissions: Submission[];
  isLoading: boolean;
  error: string | null;
  isAdminView: boolean;
}

const SubmissionsTable: React.FC<SubmissionsTableProps> = ({ submissions, isLoading, error, isAdminView }) => {
  const [dateFilter, setDateFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      const dateMatch = !dateFilter || submission.date.includes(dateFilter);
      const productMatch = !productFilter || submission.product.toLowerCase().includes(productFilter.toLowerCase());
      return dateMatch && productMatch;
    });
  }, [submissions, dateFilter, productFilter]);

  const TableRow: React.FC<{ submission: Submission }> = ({ submission }) => (
    <tr className="even:bg-white odd:bg-slate-50">
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{new Date(submission.date).toLocaleDateString()}</td>
        {isAdminView && <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{submission.client_id}</td>}
        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{submission.plant}</td>
        <td className="px-4 py-3 text-sm text-gray-500">{submission.shift}</td>
        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{submission.product}</td>
        <td className="px-4 py-3 text-sm text-green-700 text-center">{submission.produced_qty}</td>
        <td className="px-4 py-3 text-sm text-red-700 text-center">{submission.scrap_qty}</td>
        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{submission.notes}</td>
        <td className="px-4 py-3 text-sm text-gray-500 font-mono whitespace-nowrap">{submission.part_id}</td>
        <td className="px-4 py-3 text-sm text-gray-500">
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                {submission.status}
            </span>
        </td>
    </tr>
  );


  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-slate-800">Submission History</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
            <label htmlFor="date-search" className="sr-only">Search by date</label>
            <input 
                type="date"
                id="date-search"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
            />
        </div>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <label htmlFor="product-search" className="sr-only">Search by product</label>
            <input 
                type="text"
                id="product-search"
                className="mt-1 block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Search by product..."
                value={productFilter}
                onChange={e => setProductFilter(e.target.value)}
            />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="align-middle inline-block min-w-full">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            {isAdminView && <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>}
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plant</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Produced</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Scrap</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part ID</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={isAdminView ? 10 : 9} className="text-center p-6 text-gray-500">Loading history...</td></tr>
                        ) : error ? (
                            <tr><td colSpan={isAdminView ? 10 : 9} className="text-center p-6 text-red-500">{error}</td></tr>
                        ) : filteredSubmissions.length > 0 ? (
                           filteredSubmissions.map(sub => <TableRow key={sub.id} submission={sub} />)
                        ) : (
                            <tr><td colSpan={isAdminView ? 10 : 9} className="text-center p-6 text-gray-500">No submissions found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionsTable;
