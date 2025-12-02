'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';

export default function InsurancePage() {
  const { user, loading: authLoading } = useAuth(true);
  const [insurance, setInsurance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    providerName: '',
    policyNumber: '',
    groupNumber: '',
    subscriberName: '',
    subscriberDob: '',
    relationship: '',
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchInsurance();
    }
  }, [authLoading, user]);

  const fetchInsurance = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/insurance');
      if (response.data.success) {
        setInsurance(response.data.data.insurance || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load insurance information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.post('/api/insurance', formData);
      if (response.data.success) {
        setShowForm(false);
        setFormData({
          providerName: '',
          policyNumber: '',
          groupNumber: '',
          subscriberName: '',
          subscriberDob: '',
          relationship: '',
        });
        fetchInsurance();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add insurance information');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="heading-responsive font-bold text-primary-700">
            Insurance Information
          </h1>
          <p className="text-secondary-600 mt-2">
            Manage your insurance details
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Insurance'}
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
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Provider Name *
              </label>
              <input
                type="text"
                value={formData.providerName}
                onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Policy Number
              </label>
              <input
                type="text"
                value={formData.policyNumber}
                onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Group Number
              </label>
              <input
                type="text"
                value={formData.groupNumber}
                onChange={(e) => setFormData({ ...formData, groupNumber: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Subscriber Name
              </label>
              <input
                type="text"
                value={formData.subscriberName}
                onChange={(e) => setFormData({ ...formData, subscriberName: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Subscriber Date of Birth
              </label>
              <input
                type="date"
                value={formData.subscriberDob}
                onChange={(e) => setFormData({ ...formData, subscriberDob: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Relationship
              </label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select relationship</option>
                <option value="self">Self</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Insurance'}
          </button>
        </form>
      )}

      {insurance.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-secondary-600">No insurance information on file</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insurance.map((ins) => (
            <div key={ins.id} className="bg-white rounded-lg shadow-md p-6 border border-secondary-200">
              <h3 className="text-lg font-semibold text-primary-700 mb-4">{ins.provider_name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ins.policy_number && (
                  <div>
                    <span className="text-sm text-secondary-500">Policy Number:</span>
                    <p className="font-medium">{ins.policy_number}</p>
                  </div>
                )}
                {ins.group_number && (
                  <div>
                    <span className="text-sm text-secondary-500">Group Number:</span>
                    <p className="font-medium">{ins.group_number}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-secondary-500">Verification Status:</span>
                  <p className="font-medium capitalize">{ins.verification_status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

