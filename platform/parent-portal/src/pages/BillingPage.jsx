import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { get } from '../lib/api.js';
import { QUERY_KEYS } from '../lib/queryKeys.js';
import { Badge } from '@ra/ui';

export default function BillingPage() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.invoices(),
    queryFn: () => get('/api/v1/parent/stub/invoices'),
  });

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Billing</h1>
        <p className="text-slate-500">View your invoices and payment history.</p>
      </div>

      {isLoading && <div className="animate-pulse h-32 bg-slate-50 rounded-2xl" />}

      {!isLoading && invoices.length === 0 && (
        <div className="text-center py-24 text-slate-400">
          <Icon icon="lucide:receipt" className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium mb-1">No invoices yet</p>
          <p className="text-sm">Invoices will appear here once billing is set up.</p>
        </div>
      )}

      {invoices.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400">
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4">Invoice</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium font-mono">{inv.number}</td>
                  <td className="px-6 py-4">{inv.description}</td>
                  <td className="px-6 py-4 font-bold">${inv.amountDue.toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-400">{inv.dueDate}</td>
                  <td className="px-6 py-4"><Badge status={inv.status} /></td>
                  <td className="px-6 py-4">
                    {inv.status !== 'PAID' && (
                      <button className="px-4 py-2 bg-black text-white rounded-full text-xs font-bold hover:bg-slate-800 transition-colors">
                        Pay Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
