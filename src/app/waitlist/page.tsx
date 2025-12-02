'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';
import Link from 'next/link';

interface WaitlistEntry {
  id: number;
  preferredDate: string;
  preferredTime?: string;
  serviceId?: number;
  serviceName?: string;
  status: string;
  autoBook: boolean;
  createdAt: string;
}

export default function WaitlistPage() {
  const { user, loading: authLoading } = useAuth(true);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    preferredDate: '',
    preferredTime: '',
    serviceId: '',
    autoBook: false,
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchWaitlist();
      fetchServices();
    }
  }, [authLoading, user]);

  const fetchWaitlist = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/waitlist?status=active');
      if (response.data.success) {
        setWaitlist(response.data.data.waitlist || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await apiClient.get('/api/services');
      if (response.data.success) {
        setServices(response.data.data.services || []);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        preferredDate: formData.preferredDate,
        autoBook: formData.autoBook,
      };

      if (formData.preferredTime) {
        payload.preferredTime = formData.preferredTime;
      }

      if (formData.serviceId) {
        payload.serviceId = parseInt(formData.serviceId);
      }

      const response = await apiClient.post('/api/waitlist', payload);

      if (response.data.success) {
        setShowForm(false);
        setFormData({
          preferredDate: '',
          preferredTime: '',
          serviceId: '',
          autoBook: false,
        });
        fetchWaitlist();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add to waitlist');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm('Remove from waitlist?')) return;

    try {
      await apiClient.delete(`/api/waitlist/${id}`);
      fetchWaitlist();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove from waitlist');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="heading-responsive font-bold text-primary-700">
            Waitlist
          </h1>
          <p className="text-secondary-600 mt-2">
            Get notified when your preferred appointment time becomes available
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add to Waitlist'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="preferredDate" className="block text-sm font-medium text-secondary-700 mb-2">
                Preferred Date *
              </label>
              <input
                type="date"
                id="preferredDate"
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                min={today}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="preferredTime" className="block text-sm font-medium text-secondary-700 mb-2">
                Preferred Time (Optional)
              </label>
              <input
                type="time"
                id="preferredTime"
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="serviceId" className="block text-sm font-medium text-secondary-700 mb-2">
                Service (Optional)
              </label>
              <select
                id="serviceId"
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Any service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoBook"
                checked={formData.autoBook}
                onChange={(e) => setFormData({ ...formData, autoBook: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="autoBook" className="text-sm text-secondary-700">
                Auto-book when slot becomes available
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add to Waitlist'}
          </button>
        </form>
      )}

      {waitlist.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-secondary-600 mb-4">No active waitlist entries</p>
          <p className="text-sm text-secondary-500">
            Add yourself to the waitlist to be notified when appointments become available
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {waitlist.map((entry) => (
            <div
              key={entry.id}
              className="bg-white rounded-lg shadow-md p-6 border border-secondary-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-primary-700 mb-2">
                    {entry.serviceName || 'Any Service'}
                  </h3>
                  <p className="text-secondary-600">
                    Preferred Date: {new Date(entry.preferredDate).toLocaleDateString()}
                  </p>
                  {entry.preferredTime && (
                    <p className="text-secondary-600">
                      Preferred Time: {entry.preferredTime}
                    </p>
                  )}
                  {entry.autoBook && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      Auto-book enabled
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(entry.id)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


