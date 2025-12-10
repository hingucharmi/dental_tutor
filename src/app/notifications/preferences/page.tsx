'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import apiClient from '@/lib/utils/apiClient';
import { useRouter } from 'next/navigation';

interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  appointmentReminders: boolean;
  appointmentReminderHours: number;
  followUpEnabled: boolean;
  marketingEnabled: boolean;
}

export default function NotificationPreferencesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    appointmentReminders: true,
    appointmentReminderHours: 24,
    followUpEnabled: true,
    marketingEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchPreferences();
    }
  }, [authLoading, user]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/notifications/preferences');
      if (response.data.success) {
        setPreferences(response.data.data.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccess(false);
      await apiClient.put('/api/notifications/preferences', preferences);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof NotificationPreferences, value: boolean | number) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading preferences...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="heading-responsive font-bold text-primary-700">
          Notification Preferences
        </h1>
        <p className="text-secondary-600 mt-2">
          Manage how you receive notifications about appointments and updates
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-800 font-medium">Preferences saved successfully!</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Communication Channels */}
        <div>
          <h2 className="text-xl font-semibold text-primary-700 mb-4">Communication Channels</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-secondary-800">Email Notifications</div>
                  <div className="text-sm text-secondary-600">Receive notifications via email</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailEnabled}
                onChange={(e) => handleChange('emailEnabled', e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-secondary-800">SMS Notifications</div>
                  <div className="text-sm text-secondary-600">Receive notifications via text message</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.smsEnabled}
                onChange={(e) => handleChange('smsEnabled', e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-secondary-800">Push Notifications</div>
                  <div className="text-sm text-secondary-600">Receive browser push notifications</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.pushEnabled}
                onChange={(e) => handleChange('pushEnabled', e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        {/* Appointment Reminders */}
        <div className="border-t border-secondary-200 pt-6">
          <h2 className="text-xl font-semibold text-primary-700 mb-4">Appointment Reminders</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer">
              <div>
                <div className="font-medium text-secondary-800">Enable Appointment Reminders</div>
                <div className="text-sm text-secondary-600">Receive reminders before your appointments</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.appointmentReminders}
                onChange={(e) => handleChange('appointmentReminders', e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </label>

            {preferences.appointmentReminders && (
              <div className="ml-4 p-4 bg-secondary-50 rounded-lg">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Remind me before appointment:
                </label>
                <select
                  value={preferences.appointmentReminderHours}
                  onChange={(e) => handleChange('appointmentReminderHours', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value={1}>1 hour before</option>
                  <option value={2}>2 hours before</option>
                  <option value={6}>6 hours before</option>
                  <option value={12}>12 hours before</option>
                  <option value={24}>24 hours before</option>
                  <option value={48}>48 hours before</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Other Notifications */}
        <div className="border-t border-secondary-200 pt-6">
          <h2 className="text-xl font-semibold text-primary-700 mb-4">Other Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer">
              <div>
                <div className="font-medium text-secondary-800">Follow-up Messages</div>
                <div className="text-sm text-secondary-600">Receive follow-up messages after appointments</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.followUpEnabled}
                onChange={(e) => handleChange('followUpEnabled', e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer">
              <div>
                <div className="font-medium text-secondary-800">Marketing & Promotions</div>
                <div className="text-sm text-secondary-600">Receive promotional offers and updates</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.marketingEnabled}
                onChange={(e) => handleChange('marketingEnabled', e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4 pt-4 border-t border-secondary-200">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}

