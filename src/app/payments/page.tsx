'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';

interface Appointment {
  id: number;
  serviceId: number;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
}

interface Service {
  id: number;
  name: string;
  basePrice: number;
}

const TAX_RATE = 0.08; // 8% tax rate

export default function PaymentsPage() {
  const { user, loading: authLoading } = useAuth(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    appointmentId: '',
    serviceId: '',
    paymentMethod: 'stripe',
  });
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'transactions' | 'process'>('process');

  useEffect(() => {
    if (!authLoading && user) {
      fetchPayments();
      fetchTransactions();
      fetchAppointments();
      fetchServices();
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

  const fetchAppointments = async () => {
    try {
      const appointmentsResponse = await apiClient.get('/api/appointments/upcoming');
      const paymentsResponse = await apiClient.get('/api/payments/transactions');
      
      if (appointmentsResponse.data.success) {
        // Filter only confirmed or scheduled appointments
        let confirmedAppointments = appointmentsResponse.data.data.appointments.filter(
          (apt: Appointment) => apt.status === 'confirmed' || apt.status === 'scheduled'
        );

        // Get appointment IDs that already have payments
        const paidAppointmentIds = new Set<number>();
        if (paymentsResponse.data.success) {
          paymentsResponse.data.data.transactions.forEach((txn: any) => {
            if (txn.appointmentId && ['completed', 'pending', 'processing'].includes(txn.status)) {
              paidAppointmentIds.add(txn.appointmentId);
            }
          });
        }

        // Filter out appointments that already have payments
        confirmedAppointments = confirmedAppointments.filter(
          (apt: Appointment) => !paidAppointmentIds.has(apt.id)
        );

        setAppointments(confirmedAppointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await apiClient.get('/api/services');
      if (response.data.success) {
        setServices(response.data.data.services || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Calculate amounts
  const subtotal = selectedService?.basePrice || 0;
  const taxAmount = subtotal * TAX_RATE;
  const totalAmount = subtotal + taxAmount;

  // Handle appointment selection
  const handleAppointmentChange = (appointmentId: string) => {
    setFormData({ ...formData, appointmentId });
    const appointment = appointments.find((apt) => apt.id === parseInt(appointmentId));
    if (appointment) {
      setSelectedAppointment(appointment);
      // Find service for this appointment
      const service = services.find((s) => s.id === appointment.serviceId);
      if (service) {
        setSelectedService(service);
        setFormData({ ...formData, appointmentId, serviceId: service.id.toString() });
      }
    }
  };

  // Handle service selection (if no appointment)
  const handleServiceChange = (serviceId: string) => {
    setFormData({ ...formData, serviceId, appointmentId: '' });
    const service = services.find((s) => s.id === parseInt(serviceId));
    setSelectedService(service || null);
    setSelectedAppointment(null);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService || totalAmount <= 0) {
      alert('Please select a service or appointment');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        amount: totalAmount,
        paymentMethod: formData.paymentMethod,
        metadata: {
          subtotal: subtotal,
          taxRate: TAX_RATE,
          taxAmount: taxAmount,
          totalAmount: totalAmount,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
        },
      };
      
      if (formData.appointmentId) {
        payload.appointmentId = parseInt(formData.appointmentId);
      }

      const response = await apiClient.post('/api/payments/process', payload);
      if (response.data.success) {
        alert('Payment processed successfully!');
        setShowPaymentForm(false);
        setFormData({
          appointmentId: '',
          serviceId: '',
          paymentMethod: 'stripe',
        });
        setSelectedService(null);
        setSelectedAppointment(null);
        // Refresh all data
        await Promise.all([
          fetchTransactions(),
          fetchPayments(),
          fetchAppointments(),
        ]);
        setActiveTab('transactions');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to process payment';
      alert(errorMessage);
      
      // If payment already exists, refresh appointments to update the list
      if (errorMessage.includes('Payment already exists')) {
        fetchAppointments();
        setFormData({
          appointmentId: '',
          serviceId: '',
          paymentMethod: 'stripe',
        });
        setSelectedService(null);
        setSelectedAppointment(null);
      }
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
            onClick={() => setActiveTab('process')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'process'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            Process Payment
          </button>
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
        </nav>
      </div>

      {activeTab === 'process' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 border border-secondary-200">
            <h2 className="text-xl font-semibold text-primary-700 mb-6">
              Process Payment
            </h2>
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              {/* Appointment Selection */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Select Appointment (Optional)
                </label>
                {appointments.length === 0 ? (
                  <div className="w-full px-4 py-3 border border-secondary-200 rounded-lg bg-secondary-50">
                    <p className="text-sm text-secondary-600">
                      No appointments available for payment. All appointments may already have payments.
                    </p>
                  </div>
                ) : (
                  <>
                    <select
                      value={formData.appointmentId}
                      onChange={(e) => handleAppointmentChange(e.target.value)}
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select an appointment...</option>
                      {appointments.map((apt) => (
                        <option key={apt.id} value={apt.id}>
                          {apt.serviceName} - {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.appointmentTime}
                        </option>
                      ))}
                    </select>
                    {selectedAppointment && (
                      <p className="mt-2 text-sm text-secondary-600">
                        Appointment: {selectedAppointment.serviceName} on {new Date(selectedAppointment.appointmentDate).toLocaleDateString()} at {selectedAppointment.appointmentTime}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Service Selection (if no appointment) */}
              {!formData.appointmentId && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Select Service *
                  </label>
                  <select
                    required={!formData.appointmentId}
                    value={formData.serviceId}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a service...</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} {service.basePrice ? `- $${service.basePrice}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
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

              <button
                type="submit"
                disabled={submitting || !selectedService || totalAmount <= 0}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'Processing...' : 'Confirm & Process Payment'}
              </button>
            </form>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-secondary-200 sticky top-4">
            <h3 className="text-lg font-semibold text-primary-700 mb-4">
              Payment Summary
            </h3>
            
            {selectedService ? (
              <div className="space-y-4">
                <div className="border-b border-secondary-200 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-secondary-600">Service:</span>
                    <span className="text-right font-medium text-primary-700">
                      {selectedService.name}
                    </span>
                  </div>
                  {selectedAppointment && (
                    <div className="text-xs text-secondary-500 mt-2">
                      <div>Date: {new Date(selectedAppointment.appointmentDate).toLocaleDateString()}</div>
                      <div>Time: {selectedAppointment.appointmentTime}</div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-600">Subtotal:</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-600">Tax ({(TAX_RATE * 100).toFixed(0)}%):</span>
                    <span className="font-medium">${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-secondary-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-primary-700">Total:</span>
                      <span className="text-xl font-bold text-primary-600">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-secondary-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-600">Payment Method:</span>
                    <span className="font-medium capitalize">{formData.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-secondary-600">Payment Date:</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-secondary-500">
                <svg className="mx-auto h-12 w-12 text-secondary-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">Select a service or appointment to see payment details</p>
              </div>
            )}
          </div>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">Invoice #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">Transaction ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-secondary-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                          {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700 font-mono">
                          {payment.invoiceNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary-600">
                          {payment.serviceName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700">
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600 capitalize">
                          {payment.paymentMethod || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600 font-mono">
                          {payment.transactionId || 'N/A'}
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
                    {transactions.map((transaction: any) => (
                      <tr key={transaction.id} className="hover:bg-secondary-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                          {transaction.createdAt 
                            ? new Date(transaction.createdAt).toLocaleDateString()
                            : transaction.created_at 
                            ? new Date(transaction.created_at).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700">
                          ${parseFloat(transaction.amount || 0).toFixed(2)} {transaction.currency || 'USD'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600 capitalize">
                          {transaction.paymentMethod || transaction.payment_method || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600 font-mono">
                          {transaction.transactionId || transaction.transaction_id || transaction.gatewayTransactionId || transaction.gateway_transaction_id || 'N/A'}
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
