'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';

export default function PaymentsPage() {
  const { user, loading: authLoading } = useAuth(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'stripe',
    appointmentId: '',
  });
  const [activeTab, setActiveTab] = useState<'history' | 'transactions' | 'process'>('history');

  useEffect(() => {
    if (!authLoading && user) {
      fetchPayments();
      fetchTransactions();
    }
  }, [authLoading, user]);

  const fetchPayments = async () => {
    try {
      const response = await apiClient.get('/api/payments/history');
      if (response.data.success) {
        setPayments(response.data.data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await apiClient.get('/api/payments/transactions');
      if (response.data.success) {
        setTransactions(response.data.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload: any = {
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
      };
      if (formData.appointmentId) payload.appointmentId = parseInt(formData.appointmentId);

      const response = await apiClient.post('/api/payments/process', payload);
      if (response.data.success) {
        setShowPaymentForm(false);
        setFormData({
          amount: '',
          paymentMethod: 'stripe',
          appointmentId: '',
        });
        fetchTransactions();
        setActiveTab('transactions');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to process payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading payment history...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-responsive font-bold text-primary-700">
            Payments
          </h1>
          <p className="text-secondary-600 mt-2">
            Process payments and view transaction history
          </p>
        </div>
        <button
          onClick={() => {
            setShowPaymentForm(true);
            setActiveTab('process');
          }}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Process Payment
        </button>
      </div>

      <div className="border-b border-secondary-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            Payment History
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('process')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'process'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            Process Payment
          </button>
        </nav>
      </div>

      {activeTab === 'process' && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-secondary-200">
          <h2 className="text-xl font-semibold text-primary-700 mb-4">
            Process Payment
          </h2>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Payment Method *
              </label>
              <select
                required
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="stripe">Stripe (Credit/Debit Card)</option>
                <option value="paypal">PayPal</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="insurance">Insurance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Appointment ID (Optional)
              </label>
              <input
                type="number"
                value={formData.appointmentId}
                onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Process Payment'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'history' && (
        <>
          {payments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-secondary-600">No payment history found</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-secondary-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-secondary-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                          {payment.appointmentDate && new Date(payment.appointmentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary-600">
                          {payment.serviceName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700">
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                          {payment.invoiceNumber || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'transactions' && (
        <>
          {transactions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-secondary-600">No transactions found</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-secondary-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">Transaction ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-secondary-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700">
                          ${parseFloat(transaction.amount).toFixed(2)} {transaction.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600 capitalize">
                          {transaction.payment_method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600 font-mono">
                          {transaction.transaction_id || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


