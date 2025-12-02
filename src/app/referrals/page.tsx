'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';

export default function ReferralsPage() {
  const { user, loading: authLoading } = useAuth(true);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    specialistName: '',
    specialistType: '',
    reason: '',
    urgency: 'normal',
    notes: '',
    appointmentId: '',
    referringDentistId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchReferrals();
    }
  }, [authLoading, user]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/referrals');
      if (response.data.success) {
        setReferrals(response.data.data.referrals || []);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload: any = {
        specialistName: formData.specialistName,
        specialistType: formData.specialistType,
        reason: formData.reason,
        urgency: formData.urgency,
      };
      if (formData.notes) payload.notes = formData.notes;
      if (formData.appointmentId) payload.appointmentId = parseInt(formData.appointmentId);
      if (formData.referringDentistId) payload.referringDentistId = parseInt(formData.referringDentistId);

      const response = await apiClient.post('/api/referrals', payload);
      if (response.data.success) {
        setShowForm(false);
        setFormData({
          specialistName: '',
          specialistType: '',
          reason: '',
          urgency: 'normal',
          notes: '',
          appointmentId: '',
          referringDentistId: '',
        });
        fetchReferrals();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create referral');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading referrals...</div>
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
      case 'accepted':
        return 'bg-blue-100 text-blue-700';
      case 'sent':
        return 'bg-yellow-100 text-yellow-700';
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return 'bg-red-100 text-red-700';
      case 'urgent':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-responsive font-bold text-primary-700">
            Referrals
          </h1>
          <p className="text-secondary-600 mt-2">
            Manage your specialist referrals
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'New Referral'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-secondary-200">
          <h2 className="text-xl font-semibold text-primary-700 mb-4">
            Request Referral
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Specialist Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.specialistName}
                  onChange={(e) => setFormData({ ...formData, specialistName: e.target.value })}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Specialist Type *
                </label>
                <input
                  type="text"
                  required
                  value={formData.specialistType}
                  onChange={(e) => setFormData({ ...formData, specialistType: e.target.value })}
                  placeholder="e.g., Orthodontist, Oral Surgeon"
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Reason for Referral *
              </label>
              <textarea
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Urgency
              </label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Referral'}
            </button>
          </form>
        </div>
      )}

      {referrals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-secondary-600">No referrals found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {referrals.map((referral) => (
            <div
              key={referral.id}
              className="bg-white rounded-lg shadow-md p-6 border border-secondary-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-primary-700">
                      {referral.specialist_name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        referral.status
                      )}`}
                    >
                      {referral.status}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(
                        referral.urgency
                      )}`}
                    >
                      {referral.urgency}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-600 mb-1">
                    <strong>Type:</strong> {referral.specialist_type}
                  </p>
                  <p className="text-sm text-secondary-600 mb-2">
                    <strong>Reason:</strong> {referral.reason}
                  </p>
                  {referral.notes && (
                    <p className="text-sm text-secondary-600 mb-2">
                      <strong>Notes:</strong> {referral.notes}
                    </p>
                  )}
                  <p className="text-xs text-secondary-500">
                    Created: {new Date(referral.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

