'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function SymptomAssessmentPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth(false); // Allow anonymous access
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    symptoms: [] as string[],
    severity: 'mild',
    duration: '',
    location: '',
    additionalInfo: '',
  });

  const commonSymptoms = [
    'Toothache',
    'Swelling',
    'Bleeding Gums',
    'Sensitivity',
    'Broken Tooth',
    'Lost Filling',
    'Jaw Pain',
    'Bad Breath',
    'Loose Tooth',
    'Mouth Ulcer',
    'Fever',
    'Difficulty Swallowing',
    'Difficulty Breathing'
  ];

  const handleSymptomToggle = (symptom: string) => {
    setFormData(prev => {
      const exists = prev.symptoms.includes(symptom);
      if (exists) {
        return { ...prev, symptoms: prev.symptoms.filter(s => s !== symptom) };
      } else {
        return { ...prev, symptoms: [...prev.symptoms, symptom] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/api/symptom-assessment', {
        ...formData,
        userId: user?.id
      });

      if (response.data.success) {
        setResult(response.data.data.assessment);
        setStep(3); // Result step
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process assessment');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 70) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 50) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (score >= 30) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  if (authLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary-700 mb-2">
          Dental Symptom Assessment
        </h1>
        <p className="text-secondary-600">
          Answer a few questions to get immediate guidance on your dental condition.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-secondary-200 overflow-hidden">
        {step === 1 && (
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
              Select Your Symptoms
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {commonSymptoms.map((symptom) => (
                <button
                  key={symptom}
                  onClick={() => handleSymptomToggle(symptom)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    formData.symptoms.includes(symptom)
                      ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500'
                      : 'border-secondary-200 hover:border-primary-300 hover:bg-secondary-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{symptom}</span>
                    {formData.symptoms.includes(symptom) && (
                      <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={formData.symptoms.length === 0}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
             <h2 className="text-xl font-semibold mb-6 flex items-center">
              <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
              Details & Severity
            </h2>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Pain Severity
              </label>
              <div className="grid grid-cols-4 gap-3">
                {['none', 'mild', 'moderate', 'severe'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, severity: level })}
                    className={`py-3 px-2 rounded-lg border text-center capitalize transition-all ${
                      formData.severity === level
                        ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500'
                        : 'border-secondary-200 hover:border-primary-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                How long have you had these symptoms?
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select duration...</option>
                <option value="1">Less than 1 day</option>
                <option value="2">1-2 days</option>
                <option value="3">3-5 days</option>
                <option value="7">More than a week</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Location (optional)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Upper right back tooth"
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Additional Information (optional)
              </label>
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                rows={3}
                placeholder="Any other details you want to share..."
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 text-secondary-600 hover:text-secondary-900 font-medium"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  'Get Assessment'
                )}
              </button>
            </div>
          </form>
        )}

        {step === 3 && result && (
          <div className="p-6 md:p-8 text-center">
             <div className="w-20 h-20 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
             </div>

             <h2 className="text-2xl font-bold text-primary-800 mb-2">Assessment Complete</h2>
             
             <div className={`mt-6 p-6 rounded-xl border ${getUrgencyColor(result.urgencyScore)}`}>
               <div className="text-sm font-bold uppercase tracking-wide mb-1 opacity-75">Triage Result</div>
               <div className="text-xl font-bold">{result.recommendations}</div>
             </div>

             <div className="mt-8 space-y-4">
               <p className="text-secondary-600">
                 Based on your symptoms, we've analyzed the urgency of your situation. 
                 This is an automated assessment and not a substitute for professional medical advice.
               </p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                 <Link 
                   href="/appointments/book"
                   className="block w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-md hover:shadow-lg"
                 >
                   Book Appointment Now
                 </Link>
                 <Link 
                   href="/"
                   className="block w-full py-3 px-4 bg-white text-secondary-700 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors font-medium"
                 >
                   Return Home
                 </Link>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

