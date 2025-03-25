'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { CreditsTransaction } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export default function TransactionHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CreditsTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('credits_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setTransactions(data as CreditsTransaction[]);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast.error('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm w-full p-6">
      <div className="flex flex-col space-y-1.5 pb-5">
        <h3 className="font-semibold text-lg">Transaction History</h3>
        <p className="text-sm text-muted-foreground">
          Your recent credit transactions
        </p>
      </div>

      {loading ? (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>No transactions found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left font-medium">Date</th>
                <th className="px-4 py-2 text-left font-medium">Type</th>
                <th className="px-4 py-2 text-left font-medium">Amount</th>
                <th className="px-4 py-2 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b">
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(transaction.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium 
                      ${transaction.transaction_type === 'purchase' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' 
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-800/20 dark:text-amber-400'}`}>
                      {transaction.transaction_type === 'purchase' ? 'Purchase' : 'Usage'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={transaction.transaction_type === 'purchase' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                      {transaction.transaction_type === 'purchase' ? '+' : '-'}{transaction.amount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {transaction.description || (transaction.transaction_type === 'purchase' ? 'Credit purchase' : 'Call usage')}
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