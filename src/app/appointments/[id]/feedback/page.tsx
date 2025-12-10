'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';
import Link from 'next/link';

export default function AppointmentFeedbackPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(true);
  const appointmentId = parseInt(params.id as string);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    recommend: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.rating === 0) {
      setError(t('feedback.ratingRequired', 'Please select a rating'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.post('/api/reviews', {
        appointmentId,
        rating: formData.rating,
        comment: formData.comment,
        recommend: formData.recommend,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/appointments');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('feedback.submitError', 'Failed to submit feedback'));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">{t('common.loading')}</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            {t('feedback.thankYou', 'Thank You!')}
          </h2>
          <p className="text-green-700 mb-4">
            {t('feedback.submitted', 'Your feedback has been submitted successfully.')}
          </p>
          <Link
            href="/appointments"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {t('common.backToAppointments', 'Back to Appointments')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Link
          href="/appointments"
          className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('common.back', 'Back')}
        </Link>
        <h1 className="text-3xl font-bold text-primary-700 mt-4">
          {t('feedback.title', 'Appointment Feedback')}
        </h1>
        <p className="text-secondary-600 mt-2">
          {t('feedback.subtitle', 'Help us improve by sharing your experience')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-3">
            {t('feedback.rating', 'How would you rate your experience?')} *
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setFormData({ ...formData, rating })}
                className={`w-12 h-12 rounded-lg border-2 transition-all ${
                  formData.rating >= rating
                    ? 'bg-yellow-400 border-yellow-500 text-white'
                    : 'bg-white border-secondary-300 text-secondary-400 hover:border-yellow-400'
                }`}
              >
                <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            {t('feedback.comment', 'Additional Comments (Optional)')}
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            rows={5}
            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={t('feedback.commentPlaceholder', 'Tell us about your experience...')}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="recommend"
            checked={formData.recommend}
            onChange={(e) => setFormData({ ...formData, recommend: e.target.checked })}
            className="rounded text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="recommend" className="ml-2 text-sm text-secondary-700">
            {t('feedback.recommend', 'I would recommend this clinic to others')}
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
          >
            {submitting ? t('common.submitting', 'Submitting...') : t('feedback.submit', 'Submit Feedback')}
          </button>
          <Link
            href="/appointments"
            className="px-6 py-3 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors"
          >
            {t('common.cancel', 'Cancel')}
          </Link>
        </div>
      </form>
    </div>
  );
}

