'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    allergies: [] as string[],
    allergyInput: '',
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile();
    }
  }, [authLoading, user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/users/profile');
      
      if (response.data.success) {
        const profile = response.data.data.user;
        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          phone: profile.phone || '',
          dateOfBirth: profile.dateOfBirth || '',
          emergencyContactName: profile.emergencyContactName || '',
          emergencyContactPhone: profile.emergencyContactPhone || '',
          allergies: profile.allergies || [],
          allergyInput: '',
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('profile.loadError', 'Failed to load profile'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
      };

      if (formData.dateOfBirth) {
        updateData.dateOfBirth = formData.dateOfBirth;
      }

      if (formData.allergies.length > 0) {
        updateData.allergies = formData.allergies;
      }

      const response = await apiClient.put('/api/users/profile', updateData);

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('profile.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = () => {
    if (formData.allergyInput.trim()) {
      setFormData({
        ...formData,
        allergies: [...formData.allergies, formData.allergyInput.trim()],
        allergyInput: '',
      });
    }
  };

  const removeAllergy = (index: number) => {
    setFormData({
      ...formData,
      allergies: formData.allergies.filter((_, i) => i !== index),
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">{t('common.loading')}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="heading-responsive font-bold text-primary-700">
          {t('profile.title')}
        </h1>
        <p className="text-secondary-600 mt-2">
          {t('profile.subtitle', 'Manage your personal information and preferences')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {t('profile.updateSuccess')}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-secondary-700 mb-2">
              {t('auth.firstName')} *
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-secondary-700 mb-2">
              {t('auth.lastName')} *
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
              {t('auth.email')}
            </label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg bg-secondary-50 text-secondary-500"
            />
            <p className="text-xs text-secondary-500 mt-1">{t('profile.emailCannotChange', 'Email cannot be changed')}</p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 mb-2">
              {t('auth.phone')}
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-secondary-700 mb-2">
              {t('profile.dateOfBirth', 'Date of Birth')}
            </label>
            <input
              type="date"
              id="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="border-t border-secondary-200 pt-6">
          <h3 className="text-lg font-semibold text-primary-700 mb-4">{t('profile.emergencyContact', 'Emergency Contact')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="emergencyContactName" className="block text-sm font-medium text-secondary-700 mb-2">
                {t('profile.contactName', 'Contact Name')}
              </label>
              <input
                type="text"
                id="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-secondary-700 mb-2">
                {t('profile.contactPhone', 'Contact Phone')}
              </label>
              <input
                type="tel"
                id="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-200 pt-6">
          <h3 className="text-lg font-semibold text-primary-700 mb-4">{t('profile.allergies', 'Allergies')}</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={formData.allergyInput}
              onChange={(e) => setFormData({ ...formData, allergyInput: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
              placeholder={t('profile.addAllergy', 'Add an allergy')}
              className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addAllergy}
              className="px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors"
            >
              {t('common.add', 'Add')}
            </button>
          </div>
          {formData.allergies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.allergies.map((allergy, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                >
                  {allergy}
                  <button
                    type="button"
                    onClick={() => removeAllergy(index)}
                    className="hover:text-primary-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('profile.saving', 'Saving...') : t('profile.saveChanges', 'Save Changes')}
          </button>
        </div>
      </form>
    </div>
  );
}


