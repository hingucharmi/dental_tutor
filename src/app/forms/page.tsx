'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';
import Link from 'next/link';

interface FormSubmission {
  id: number;
  formType: string;
  submittedAt: string;
  status: string;
}

export default function FormsPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get('appointmentId');
  const { user, loading: authLoading } = useAuth(true);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Medical History State
  const [medicalHistory, setMedicalHistory] = useState({
    conditions: [] as string[],
    medications: [] as string[],
    medicationsOther: '',
    allergies: [] as string[],
    allergiesOther: '',
    surgeries: [] as string[],
    surgeriesOther: '',
    smoker: false,
    pregnant: false,
    heartProblems: false,
    highBloodPressure: false,
    diabetes: false,
    asthma: false,
    hepatitis: false,
    hiv: false,
    bleedingDisorders: false,
    jointReplacement: false,
    otherConditions: [] as string[],
    otherConditionsOther: '',
  });

  // Patient Registration State
  const [patientRegistration, setPatientRegistration] = useState({
    fullName: '',
    dateOfBirth: '',
    address: '',
    phoneNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceGroupNumber: '',
    subscriberName: '',
    subscriberDOB: '',
    relationship: '',
  });

  // Treatment Consent State
  const [treatmentConsent, setTreatmentConsent] = useState({
    consentToTreatment: false,
    understandRisks: false,
    understandAlternatives: false,
    consentToPhotography: false,
    consentToXrays: false,
    signature: '',
    date: new Date().toISOString().split('T')[0],
  });

  // HIPAA/Privacy Consent State
  const [hipaaConsent, setHipaaConsent] = useState({
    acknowledgeNotice: false,
    consentToUse: false,
    consentToDisclose: false,
    requestRestrictions: false,
    restrictionsDetails: '',
    signature: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Financial Consent State
  const [financialConsent, setFinancialConsent] = useState({
    understandCharges: false,
    agreeToPay: false,
    understandInsurance: false,
    acceptAssignment: false,
    paymentMethod: '',
    signature: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchSubmissions();
      // If appointmentId is provided, fetch appointment details and check if should auto-open form
      if (appointmentId) {
        fetchAppointmentDetails();
        if (!activeForm) {
          setActiveForm('medical_history');
        }
      }
    }
  }, [authLoading, user, appointmentId]);

  const fetchAppointmentDetails = async () => {
    if (!appointmentId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.get(`/api/appointments/${appointmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setAppointment(response.data.data.appointment);
      }
    } catch (error) {
      console.error('Error fetching appointment details:', error);
    }
  };

  // Calculate form completion progress
  const getFormProgress = () => {
    const requiredForms = ['medical_history', 'patient_registration', 'consent_treatment', 'consent_hipaa', 'consent_financial'];
    const completedForms = submissions
      .filter(s => requiredForms.includes(s.formType))
      .map(s => s.formType);
    
    const uniqueCompleted = [...new Set(completedForms)];
    return {
      completed: uniqueCompleted.length,
      total: requiredForms.length,
      percentage: Math.round((uniqueCompleted.length / requiredForms.length) * 100),
    };
  };

  const progress = getFormProgress();
  const requiredFormMeta = [
    {
      key: 'medical_history',
      label: t('forms.medicalHistory', 'Medical History'),
      detail: t('forms.medicalHistoryDesc', 'Update your medical conditions, medications, and allergies.'),
      pill: t('forms.required', 'Required'),
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
    },
    {
      key: 'patient_registration',
      label: t('forms.patientRegistration', 'Patient Registration'),
      detail: t('forms.patientRegistrationDesc', 'Update your personal information and emergency contacts.'),
      pill: t('forms.required', 'Required'),
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-700',
    },
    {
      key: 'consent_treatment',
      label: t('forms.consentTreatment', 'Treatment Consent'),
      detail: t('forms.consentTreatmentDesc', 'Consent to treatment, risks, and procedures.'),
      pill: t('forms.required', 'Required'),
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-700',
    },
    {
      key: 'consent_hipaa',
      label: t('forms.consentHipaa', 'HIPAA Privacy Consent'),
      detail: t('forms.consentHipaaDesc', 'Acknowledge privacy notice and consent to use/disclose information.'),
      pill: t('forms.required', 'Required'),
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-700',
    },
    {
      key: 'consent_financial',
      label: t('forms.consentFinancial', 'Financial Consent'),
      detail: t('forms.consentFinancialDesc', 'Understand charges and agree to payment terms.'),
      pill: t('forms.required', 'Required'),
      iconBg: 'bg-green-100',
      iconColor: 'text-green-700',
    },
  ];

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = appointmentId ? { appointmentId } : {};
      const response = await apiClient.get('/api/forms', { params });
      if (response.data.success) {
        setSubmissions(response.data.data.forms);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const validatePatientRegistration = () => {
    const errors: string[] = [];
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

    if (!patientRegistration.fullName.trim() || patientRegistration.fullName.trim().length < 2) {
      errors.push(t('forms.validation.fullName', 'Please enter your full name.'));
    }

    if (!patientRegistration.dateOfBirth) {
      errors.push(t('forms.validation.dob', 'Please provide your date of birth.'));
    }

    if (!patientRegistration.address.trim()) {
      errors.push(t('forms.validation.address', 'Please provide your address.'));
    }

    if (!phoneRegex.test(patientRegistration.phoneNumber.trim())) {
      errors.push(t('forms.validation.phone', 'Enter a valid phone number (7-20 digits, may include +, spaces, () or -).'));
    }

    if (!patientRegistration.emergencyContactName.trim()) {
      errors.push(t('forms.validation.emergencyName', 'Please provide an emergency contact name.'));
    }

    if (!phoneRegex.test(patientRegistration.emergencyContactPhone.trim())) {
      errors.push(t('forms.validation.emergencyPhone', 'Enter a valid emergency contact phone number.'));
    }

    if (patientRegistration.subscriberDOB && !patientRegistration.subscriberName.trim()) {
      errors.push(t('forms.validation.subscriberName', 'Add the subscriber name for the provided subscriber DOB.'));
    }

    return errors.length ? errors.join(' ') : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeForm) return;

    setError(null);
    setSuccess(null);

    if (activeForm === 'patient_registration') {
      const validationError = validatePatientRegistration();
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setSubmitting(true);

    try {
      let formData = {};
      if (activeForm === 'medical_history') {
        formData = medicalHistory;
      } else if (activeForm === 'patient_registration') {
        formData = patientRegistration;
      } else if (activeForm === 'consent_treatment') {
        formData = treatmentConsent;
      } else if (activeForm === 'consent_hipaa') {
        formData = hipaaConsent;
      } else if (activeForm === 'consent_financial') {
        formData = financialConsent;
      }

      const response = await apiClient.post('/api/forms', {
        appointmentId: appointmentId ? parseInt(appointmentId) : undefined,
        formType: activeForm,
        formData: formData
      });

      if (response.data.success) {
        setSuccess(t('forms.submitSuccess', 'Form submitted successfully'));
        setActiveForm(null);
        fetchSubmissions();
        
        // Reset form data
        if (activeForm === 'medical_history') {
          setMedicalHistory({
            conditions: [],
            medications: [],
            medicationsOther: '',
            allergies: [],
            allergiesOther: '',
            surgeries: [],
            surgeriesOther: '',
            smoker: false,
            pregnant: false,
            heartProblems: false,
            highBloodPressure: false,
            diabetes: false,
            asthma: false,
            hepatitis: false,
            hiv: false,
            bleedingDisorders: false,
            jointReplacement: false,
            otherConditions: [],
            otherConditionsOther: '',
          });
        } else if (activeForm === 'patient_registration') {
          setPatientRegistration({
            fullName: '',
            dateOfBirth: '',
            address: '',
            phoneNumber: '',
            emergencyContactName: '',
            emergencyContactPhone: '',
            insuranceProvider: '',
            insurancePolicyNumber: '',
            insuranceGroupNumber: '',
            subscriberName: '',
            subscriberDOB: '',
            relationship: '',
          });
        } else if (activeForm === 'consent_treatment') {
          setTreatmentConsent({
            consentToTreatment: false,
            understandRisks: false,
            understandAlternatives: false,
            consentToPhotography: false,
            consentToXrays: false,
            signature: '',
            date: new Date().toISOString().split('T')[0],
          });
        } else if (activeForm === 'consent_hipaa') {
          setHipaaConsent({
            acknowledgeNotice: false,
            consentToUse: false,
            consentToDisclose: false,
            requestRestrictions: false,
            restrictionsDetails: '',
            signature: '',
            date: new Date().toISOString().split('T')[0],
          });
        } else if (activeForm === 'consent_financial') {
          setFinancialConsent({
            understandCharges: false,
            agreeToPay: false,
            understandInsurance: false,
            acceptAssignment: false,
            paymentMethod: '',
            signature: '',
            date: new Date().toISOString().split('T')[0],
          });
        }

        // Don't redirect automatically - let user complete all forms first
        // Only refresh submissions to update progress
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('forms.submitError', 'Failed to submit form'));
    } finally {
      setSubmitting(false);
    }
  };

  const getFormTitle = (type: string) => {
    switch (type) {
      case 'medical_history': return t('forms.medicalHistory', 'Medical History');
      case 'patient_registration': return t('forms.patientRegistration', 'Patient Registration');
      case 'consent_treatment': return t('forms.consentTreatment', 'Treatment Consent');
      case 'consent_hipaa': return t('forms.consentHipaa', 'HIPAA Privacy Consent');
      case 'consent_financial': return t('forms.consentFinancial', 'Financial Consent');
      default: return type.replace(/_/g, ' ');
    }
  };

  const isFormCompleted = (formType: string) => {
    return submissions.some(s => s.formType === formType && s.status === 'submitted');
  };

  const getIncompleteForms = () => {
    const requiredForms = ['medical_history', 'patient_registration', 'consent_treatment', 'consent_hipaa', 'consent_financial'];
    const completedFormTypes = submissions
      .filter(s => requiredForms.includes(s.formType) && s.status === 'submitted')
      .map(s => s.formType);
    
    return requiredFormMeta.filter(form => !completedFormTypes.includes(form.key));
  };

  const allFormsCompleted = progress.completed === progress.total && appointmentId;

  const handleReschedule = () => {
    if (appointmentId) {
      router.push(`/appointments/${appointmentId}/reschedule`);
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointmentId) return;
    
    setCancelling(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.delete(`/api/appointments/${appointmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          reason: cancelReason || undefined,
        },
      });

      if (response.data.success) {
        setSuccess(t('forms.appointmentCancelled', 'Appointment cancelled successfully'));
        setShowCancelModal(false);
        setCancelReason('');
        // Redirect to appointments page after a delay
        setTimeout(() => {
          router.push('/appointments');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('forms.cancelError', 'Failed to cancel appointment'));
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">{t('common.loading')}</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="forms-page relative max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -top-10 -left-10 h-48 w-48 rounded-full bg-primary-100 blur-3xl opacity-60 -z-10" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-secondary-100 blur-3xl opacity-60 -z-10" />

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-primary-50/70 to-secondary-50/60 border border-secondary-200 shadow-2xl mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(100,116,139,0.12),transparent_40%)]" />
        <div className="relative p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              {appointmentId && (
                <button
                  onClick={() => {
                    if (allFormsCompleted) {
                      router.push('/appointments');
                    } else {
                      setError(t('forms.completeAllFormsFirst', 'Please complete all required forms before accessing appointments'));
                    }
                  }}
                  className="text-primary-700 hover:text-primary-800 inline-flex items-center gap-2 text-sm font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {t('common.back', 'Back to Appointments')}
                </button>
              )}
              <span className="px-3 py-1 rounded-full bg-white/80 text-primary-700 text-xs font-semibold border border-primary-100 shadow-sm">
                {appointmentId ? t('forms.subtitleAppointment', 'Pre-appointment forms') : t('forms.subtitle', 'Patient forms workspace')}
              </span>
              <span className="px-3 py-1 rounded-full bg-secondary-900 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3m-3 3c-1.657 0-3-1.343-3-3m3 3v4m-6 4h12a2 2 0 002-2v-5a2 2 0 00-2-2h-1a1 1 0 01-1-1V6a4 4 0 10-8 0v3a1 1 0 01-1 1H6a2 2 0 00-2 2v5a2 2 0 002 2z" />
                </svg>
                {t('forms.secure', 'HIPAA ready & secure')}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-secondary-700">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-secondary-200 shadow-sm">
                <svg className="w-4 h-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('forms.estimatedTime', '5-7 min to finish')}
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.6fr,1fr] gap-6 items-center">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-semibold text-primary-800 leading-tight">
                {t('forms.title', 'Patient Forms')}
              </h1>
              <p className="text-secondary-600 text-lg">
                {appointmentId 
                  ? t('forms.subtitleAppointment', 'Complete your pre-appointment forms')
                  : t('forms.subtitle', 'Complete and manage your pre-appointment forms')}
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 border border-secondary-200 text-secondary-700 shadow-sm">
                  <svg className="w-4 h-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('forms.sync', 'Syncs with your appointments')}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 border border-secondary-200 text-secondary-700 shadow-sm">
                  <svg className="w-4 h-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('forms.saveProgress', 'Save and resume anytime')}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 border border-secondary-200 text-secondary-700 shadow-sm">
                  <svg className="w-4 h-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 10c0 3-6 7-6 7s-6-4-6-7a6 6 0 1112 0z" />
                  </svg>
                  {t('forms.support', 'Need help? We are here')}
                </span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-2xl border border-secondary-200 shadow-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">
                    {t('forms.progressTitle', 'Pre-Appointment Forms Progress')}
                  </p>
                  <p className="text-lg font-semibold text-primary-800">
                    {progress.completed} / {progress.total} {t('forms.completed', 'Completed')}
                  </p>
                </div>
                <div className="text-3xl font-bold text-primary-700">
                  {progress.percentage}%
                </div>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-primary-50 border border-primary-100">
                  <p className="font-semibold text-primary-800">{submissions.length}</p>
                  <p className="text-secondary-600">{t('forms.submissions', 'Total submissions')}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary-50 border border-secondary-100">
                  <p className="font-semibold text-secondary-800">
                    {appointmentId ? t('forms.linked', 'Linked to appointment') : t('forms.flexible', 'Use anytime')}
                  </p>
                  <p className="text-secondary-600">
                    {appointmentId ? t('forms.autoShare', 'We share with your dentist') : t('forms.keepUpdated', 'Keep your records updated')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-8 shadow-sm">
          {success}
        </div>
      )}

      {appointmentId && (
        <>
          {allFormsCompleted ? (
            <div className="mb-8 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 via-white to-green-50/50 backdrop-blur shadow-xl overflow-hidden">
              <div className="px-6 py-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-2">
                  {t('forms.allFormsCompleted', 'All Pre-Visit Forms Completed!')}
                </h3>
                <p className="text-secondary-600 mb-6 max-w-md mx-auto">
                  {t('forms.allFormsCompletedDesc', 'You have successfully completed all required forms. Your information is ready for your appointment.')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    onClick={() => setActiveForm(null)}
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {t('forms.reviewForms', 'Review Forms')}
                  </button>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full">
                    <button
                      onClick={handleReschedule}
                      disabled={appointment?.hasBeenRescheduled || appointment?.rescheduleCount > 0}
                      className="px-6 py-3 bg-white text-primary-700 border-2 border-primary-200 rounded-xl hover:bg-primary-50 transition-colors font-semibold shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {appointment?.hasBeenRescheduled || appointment?.rescheduleCount > 0
                        ? t('forms.alreadyRescheduled', 'Already Rescheduled')
                        : t('forms.rescheduleAppointment', 'Reschedule Appointment')}
                    </button>
                    <button
                      onClick={() => setShowCancelModal(true)}
                      disabled={appointment?.hasBeenCancelled || appointment?.cancelCount > 0}
                      className="px-6 py-3 bg-red-50 text-red-700 border-2 border-red-200 rounded-xl hover:bg-red-100 transition-colors font-semibold shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {appointment?.hasBeenCancelled || appointment?.cancelCount > 0
                        ? t('forms.alreadyCancelled', 'Already Cancelled')
                        : t('forms.cancelAppointment', 'Cancel Appointment')}
                    </button>
                    <Link
                      href="/appointments"
                      className="px-6 py-3 bg-white text-primary-700 border-2 border-primary-200 rounded-xl hover:bg-primary-50 transition-colors font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {t('forms.backToAppointments', 'Back to Appointments')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8 rounded-2xl border border-primary-100 bg-white/80 backdrop-blur shadow-lg">
              <div className="px-6 py-5 border-b border-secondary-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary-800 mb-1">
                    {t('forms.progressTitle', 'Pre-Appointment Forms Progress')}
                  </h3>
                  <p className="text-sm text-secondary-600">
                    {t('forms.progressText', '{{completed}} of {{total}} required forms completed', {
                      completed: progress.completed,
                      total: progress.total,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-sm font-semibold border border-primary-200">
                    {progress.percentage}%
                  </span>
                  <button
                    onClick={() => {
                      const incomplete = getIncompleteForms();
                      if (incomplete.length > 0) {
                        setActiveForm(incomplete[0].key);
                      }
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-sm shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('forms.completePreVisitForms', 'Complete Pre-Visit Forms')}
                  </button>
                </div>
              </div>
              <div className="divide-y divide-secondary-100">
                {requiredFormMeta.map((form) => {
                  const complete = isFormCompleted(form.key);
                  return (
                    <button
                      key={form.key}
                      onClick={() => setActiveForm(form.key)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-secondary-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${form.iconBg} flex-shrink-0`}>
                          <svg className={`w-6 h-6 ${form.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-secondary-900">{form.label}</p>
                          <p className="text-sm text-secondary-600 truncate">{form.detail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full border ${
                            complete ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {complete ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {t('forms.completed', 'Completed')}
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                              </svg>
                              {form.pill}
                            </>
                          )}
                        </span>
                        <svg className="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {!activeForm ? (
        <div className="space-y-8">
          {/* Available Forms */}
          <section>
            <h2 className="text-xl font-semibold text-primary-800 mb-4">
              {t('forms.availableForms', 'Available Forms')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Medical History */}
              <button
                onClick={() => setActiveForm('medical_history')}
                className={`relative p-6 bg-white/90 backdrop-blur rounded-2xl shadow-lg border hover:-translate-y-1 hover:shadow-xl transition-all text-left group overflow-hidden ${
                  isFormCompleted('medical_history')
                    ? 'border-green-200 bg-green-50/60'
                    : 'border-secondary-200'
                }`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-br from-primary-50 via-white to-secondary-50 pointer-events-none" />
                <div className="relative">
                {isFormCompleted('medical_history') && (
                  <div className="absolute top-3 right-3">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    isFormCompleted('medical_history')
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {isFormCompleted('medical_history') ? t('forms.completed', 'Completed') : t('forms.required', 'Required')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{t('forms.medicalHistory', 'Medical History')}</h3>
                <p className="text-secondary-600 text-sm mt-1">
                  {t('forms.medicalHistoryDesc', 'Update your medical conditions, medications, and allergies.')}
                </p>
                </div>
              </button>

              {/* Patient Registration */}
              <button
                onClick={() => setActiveForm('patient_registration')}
                className={`relative p-6 bg-white/90 backdrop-blur rounded-2xl shadow-lg border hover:-translate-y-1 hover:shadow-xl transition-all text-left group overflow-hidden ${
                  isFormCompleted('patient_registration')
                    ? 'border-green-200 bg-green-50/60'
                    : 'border-secondary-200'
                }`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-br from-primary-50 via-white to-secondary-50 pointer-events-none" />
                <div className="relative">
                {isFormCompleted('patient_registration') && (
                  <div className="absolute top-3 right-3">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    isFormCompleted('patient_registration')
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {isFormCompleted('patient_registration') ? t('forms.completed', 'Completed') : t('forms.required', 'Required')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{t('forms.patientRegistration', 'Patient Registration')}</h3>
                <p className="text-secondary-600 text-sm mt-1">
                  {t('forms.patientRegistrationDesc', 'Update your personal information and emergency contacts.')}
                </p>
                </div>
              </button>

              {/* Treatment Consent */}
              <button
                onClick={() => setActiveForm('consent_treatment')}
                className={`relative p-6 bg-white/90 backdrop-blur rounded-2xl shadow-lg border hover:-translate-y-1 hover:shadow-xl transition-all text-left group overflow-hidden ${
                  isFormCompleted('consent_treatment')
                    ? 'border-green-200 bg-green-50/60'
                    : 'border-secondary-200'
                }`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-br from-primary-50 via-white to-secondary-50 pointer-events-none" />
                <div className="relative">
                {isFormCompleted('consent_treatment') && (
                  <div className="absolute top-3 right-3">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <svg className="w-6 h-6 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    isFormCompleted('consent_treatment')
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {isFormCompleted('consent_treatment') ? t('forms.completed', 'Completed') : t('forms.required', 'Required')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{t('forms.consentTreatment', 'Treatment Consent')}</h3>
                <p className="text-secondary-600 text-sm mt-1">
                  {t('forms.consentTreatmentDesc', 'Consent to treatment, risks, and procedures.')}
                </p>
                </div>
              </button>

              {/* HIPAA Consent */}
              <button
                onClick={() => setActiveForm('consent_hipaa')}
                className={`relative p-6 bg-white/90 backdrop-blur rounded-2xl shadow-lg border hover:-translate-y-1 hover:shadow-xl transition-all text-left group overflow-hidden ${
                  isFormCompleted('consent_hipaa')
                    ? 'border-green-200 bg-green-50/60'
                    : 'border-secondary-200'
                }`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-br from-primary-50 via-white to-secondary-50 pointer-events-none" />
                <div className="relative">
                {isFormCompleted('consent_hipaa') && (
                  <div className="absolute top-3 right-3">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    isFormCompleted('consent_hipaa')
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {isFormCompleted('consent_hipaa') ? t('forms.completed', 'Completed') : t('forms.required', 'Required')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{t('forms.consentHipaa', 'HIPAA Privacy Consent')}</h3>
                <p className="text-secondary-600 text-sm mt-1">
                  {t('forms.consentHipaaDesc', 'Acknowledge privacy notice and consent to use/disclose information.')}
                </p>
                </div>
              </button>

              {/* Financial Consent */}
              <button
                onClick={() => setActiveForm('consent_financial')}
                className={`relative p-6 bg-white/90 backdrop-blur rounded-2xl shadow-lg border hover:-translate-y-1 hover:shadow-xl transition-all text-left group overflow-hidden ${
                  isFormCompleted('consent_financial')
                    ? 'border-green-200 bg-green-50/60'
                    : 'border-secondary-200'
                }`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-br from-primary-50 via-white to-secondary-50 pointer-events-none" />
                <div className="relative">
                {isFormCompleted('consent_financial') && (
                  <div className="absolute top-3 right-3">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                    <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    isFormCompleted('consent_financial')
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {isFormCompleted('consent_financial') ? t('forms.completed', 'Completed') : t('forms.required', 'Required')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{t('forms.consentFinancial', 'Financial Consent')}</h3>
                <p className="text-secondary-600 text-sm mt-1">
                  {t('forms.consentFinancialDesc', 'Understand charges and agree to payment terms.')}
                </p>
                </div>
              </button>
            </div>
          </section>

          {/* Submission History */}
          {submissions.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-primary-800 mb-4">
                {t('forms.submissionHistory', 'Submission History')}
              </h2>
              <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-secondary-200/80 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-secondary-50 border-b border-secondary-200">
                    <tr>
                      <th className="px-6 py-3 text-sm font-medium text-secondary-500">{t('forms.formName', 'Form Name')}</th>
                      <th className="px-6 py-3 text-sm font-medium text-secondary-500">{t('forms.dateSubmitted', 'Date Submitted')}</th>
                      <th className="px-6 py-3 text-sm font-medium text-secondary-500">{t('common.status', 'Status')}</th>
                      <th className="px-6 py-3 text-sm font-medium text-secondary-500">{t('common.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-secondary-50">
                        <td className="px-6 py-4 font-medium capitalize">
                          {getFormTitle(submission.formType)}
                        </td>
                        <td className="px-6 py-4 text-secondary-600">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                            {t('common.view', 'View')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-secondary-200/80 overflow-hidden">
          <div className="border-b border-secondary-200 px-6 py-4 flex justify-between items-center bg-gradient-to-r from-primary-50 via-white to-secondary-50">
            <h2 className="text-xl font-bold text-primary-800 capitalize">
              {getFormTitle(activeForm)}
            </h2>
            <button
              onClick={() => setActiveForm(null)}
              className="text-secondary-500 hover:text-secondary-800"
            >
              {t('common.cancel', 'Cancel')}
            </button>
          </div>

          <div className="p-6 md:p-8">
            {activeForm === 'medical_history' && (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-5 md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide">
                        {t('forms.currentConditions', 'Current Medical Conditions')}
                      </p>
                      <p className="text-sm text-secondary-700">
                        {t('forms.medicalHistoryDesc', 'Update your medical conditions, medications, and allergies.')}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-primary-700 text-xs font-semibold border border-primary-100 shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('forms.required', 'Required')}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-secondary-200 bg-white/80 p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-secondary-900">
                        {t('forms.currentConditions', 'Current Medical Conditions')}
                      </h3>
                      <span className="text-xs text-secondary-500">
                        {t('forms.selectMultiple', 'Hold Ctrl/Cmd to select multiple options')}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { key: 'heartProblems', label: t('forms.heartProblems', 'Heart Problems') },
                        { key: 'highBloodPressure', label: t('forms.highBloodPressure', 'High Blood Pressure') },
                        { key: 'diabetes', label: t('forms.diabetes', 'Diabetes') },
                        { key: 'asthma', label: t('forms.asthma', 'Asthma') },
                        { key: 'hepatitis', label: t('forms.hepatitis', 'Hepatitis') },
                        { key: 'hiv', label: t('forms.hiv', 'HIV/AIDS') },
                        { key: 'bleedingDisorders', label: t('forms.bleedingDisorders', 'Bleeding Disorders') },
                        { key: 'jointReplacement', label: t('forms.jointReplacement', 'Joint Replacement') },
                      ].map((condition) => (
                        <label key={condition.key} className="flex items-start gap-2 rounded-lg border border-secondary-200/70 px-3 py-2 bg-secondary-50 hover:border-primary-200 transition-colors">
                          <input
                            type="checkbox"
                            checked={medicalHistory[condition.key as keyof typeof medicalHistory] as boolean}
                            onChange={(e) => {
                              setMedicalHistory({ ...medicalHistory, [condition.key]: e.target.checked });
                            }}
                            className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-secondary-800">{condition.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-secondary-200 bg-white/80 p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-secondary-900">
                        {t('forms.otherConditions', 'Other Medical Conditions')}
                      </h3>
                      <span className="px-2 py-1 rounded-full bg-secondary-100 text-secondary-700 text-xs font-semibold">
                        {t('forms.optional', 'Optional')}
                      </span>
                    </div>
                    <select
                      multiple
                      value={medicalHistory.otherConditions}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setMedicalHistory({ 
                          ...medicalHistory, 
                          otherConditions: selected,
                          otherConditionsOther: selected.includes('other') ? medicalHistory.otherConditionsOther : ''
                        });
                      }}
                      className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500 min-h-[120px] text-sm"
                      size={6}
                    >
                      <option value="anemia">{t('forms.conditionAnemia', 'Anemia')}</option>
                      <option value="thyroid">{t('forms.conditionThyroid', 'Thyroid Disease')}</option>
                      <option value="kidney_disease">{t('forms.conditionKidneyDisease', 'Kidney Disease')}</option>
                      <option value="liver_disease">{t('forms.conditionLiverDisease', 'Liver Disease')}</option>
                      <option value="epilepsy">{t('forms.conditionEpilepsy', 'Epilepsy')}</option>
                      <option value="arthritis">{t('forms.conditionArthritis', 'Arthritis')}</option>
                      <option value="osteoporosis">{t('forms.conditionOsteoporosis', 'Osteoporosis')}</option>
                      <option value="cancer">{t('forms.conditionCancer', 'Cancer')}</option>
                      <option value="autoimmune">{t('forms.conditionAutoimmune', 'Autoimmune Disease')}</option>
                      <option value="other">{t('forms.other', 'Other')}</option>
                    </select>
                    <p className="text-xs text-secondary-500">
                      {t('forms.selectMultiple', 'Hold Ctrl/Cmd to select multiple options')}
                    </p>
                    {medicalHistory.otherConditions.includes('other') && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-secondary-700">
                          {t('forms.otherConditionsSpecify', 'Please specify other conditions:')}
                        </label>
                        <textarea
                          value={medicalHistory.otherConditionsOther}
                          onChange={(e) => setMedicalHistory({ ...medicalHistory, otherConditionsOther: e.target.value })}
                          className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                          rows={2}
                          placeholder={t('forms.otherConditionsPlaceholder', 'List any other medical conditions...')}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-secondary-200 bg-white/80 p-5 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-secondary-900">
                        {t('forms.currentMedications', 'Current Medications')}
                      </h3>
                      <span className="text-xs text-secondary-500">
                        {t('forms.selectMultiple', 'Hold Ctrl/Cmd to select multiple options')}
                      </span>
                    </div>
                    <select
                      multiple
                      value={medicalHistory.medications}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setMedicalHistory({ 
                          ...medicalHistory, 
                          medications: selected,
                          medicationsOther: selected.includes('other') ? medicalHistory.medicationsOther : ''
                        });
                      }}
                      className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500 min-h-[120px] text-sm"
                      size={6}
                    >
                      <option value="aspirin">{t('forms.medAspirin', 'Aspirin')}</option>
                      <option value="blood_thinners">{t('forms.medBloodThinners', 'Blood Thinners (Warfarin, Coumadin)')}</option>
                      <option value="antibiotics">{t('forms.medAntibiotics', 'Antibiotics')}</option>
                      <option value="pain_medications">{t('forms.medPainMeds', 'Pain Medications')}</option>
                      <option value="heart_medications">{t('forms.medHeartMeds', 'Heart Medications')}</option>
                      <option value="diabetes_medications">{t('forms.medDiabetesMeds', 'Diabetes Medications')}</option>
                      <option value="blood_pressure_medications">{t('forms.medBloodPressureMeds', 'Blood Pressure Medications')}</option>
                      <option value="antidepressants">{t('forms.medAntidepressants', 'Antidepressants')}</option>
                      <option value="steroids">{t('forms.medSteroids', 'Steroids')}</option>
                      <option value="other">{t('forms.other', 'Other')}</option>
                    </select>
                    {medicalHistory.medications.includes('other') && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-secondary-700">
                          {t('forms.otherMedications', 'Please specify other medications:')}
                        </label>
                        <textarea
                          value={medicalHistory.medicationsOther}
                          onChange={(e) => setMedicalHistory({ ...medicalHistory, medicationsOther: e.target.value })}
                          className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                          rows={2}
                          placeholder={t('forms.medicationsOtherPlaceholder', 'List other medications...')}
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-secondary-200 bg-white/80 p-5 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-secondary-900">
                        {t('forms.allergies', 'Allergies')}
                      </h3>
                      <span className="text-xs text-secondary-500">
                        {t('forms.selectMultiple', 'Hold Ctrl/Cmd to select multiple options')}
                      </span>
                    </div>
                    <select
                      multiple
                      value={medicalHistory.allergies}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setMedicalHistory({ 
                          ...medicalHistory, 
                          allergies: selected,
                          allergiesOther: selected.includes('other') ? medicalHistory.allergiesOther : ''
                        });
                      }}
                      className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500 min-h-[120px] text-sm"
                      size={6}
                    >
                      <option value="penicillin">{t('forms.allergyPenicillin', 'Penicillin')}</option>
                      <option value="latex">{t('forms.allergyLatex', 'Latex')}</option>
                      <option value="local_anesthesia">{t('forms.allergyLocalAnesthesia', 'Local Anesthesia')}</option>
                      <option value="aspirin">{t('forms.allergyAspirin', 'Aspirin')}</option>
                      <option value="sulfa_drugs">{t('forms.allergySulfaDrugs', 'Sulfa Drugs')}</option>
                      <option value="iodine">{t('forms.allergyIodine', 'Iodine')}</option>
                      <option value="metals">{t('forms.allergyMetals', 'Metals (Nickel, etc.)')}</option>
                      <option value="food_allergies">{t('forms.allergyFood', 'Food Allergies')}</option>
                      <option value="other">{t('forms.other', 'Other')}</option>
                    </select>
                    {medicalHistory.allergies.includes('other') && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-secondary-700">
                          {t('forms.otherAllergies', 'Please specify other allergies:')}
                        </label>
                        <textarea
                          value={medicalHistory.allergiesOther}
                          onChange={(e) => setMedicalHistory({ ...medicalHistory, allergiesOther: e.target.value })}
                          className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                          rows={2}
                          placeholder={t('forms.allergiesOtherPlaceholder', 'List other allergies...')}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-secondary-200 bg-white/80 p-5 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-secondary-900">
                        {t('forms.pastSurgeries', 'Past Surgeries')}
                      </h3>
                      <span className="text-xs text-secondary-500">
                        {t('forms.selectMultiple', 'Hold Ctrl/Cmd to select multiple options')}
                      </span>
                    </div>
                    <select
                      multiple
                      value={medicalHistory.surgeries}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setMedicalHistory({ 
                          ...medicalHistory, 
                          surgeries: selected,
                          surgeriesOther: selected.includes('other') ? medicalHistory.surgeriesOther : ''
                        });
                      }}
                      className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500 min-h-[120px] text-sm"
                      size={6}
                    >
                      <option value="wisdom_teeth">{t('forms.surgeryWisdomTeeth', 'Wisdom Teeth Removal')}</option>
                      <option value="root_canal">{t('forms.surgeryRootCanal', 'Root Canal')}</option>
                      <option value="dental_implant">{t('forms.surgeryDentalImplant', 'Dental Implant')}</option>
                      <option value="tooth_extraction">{t('forms.surgeryToothExtraction', 'Tooth Extraction')}</option>
                      <option value="gum_surgery">{t('forms.surgeryGumSurgery', 'Gum Surgery')}</option>
                      <option value="jaw_surgery">{t('forms.surgeryJawSurgery', 'Jaw Surgery')}</option>
                      <option value="heart_surgery">{t('forms.surgeryHeartSurgery', 'Heart Surgery')}</option>
                      <option value="joint_replacement">{t('forms.surgeryJointReplacement', 'Joint Replacement')}</option>
                      <option value="other">{t('forms.other', 'Other')}</option>
                    </select>
                    {medicalHistory.surgeries.includes('other') && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-secondary-700">
                          {t('forms.otherSurgeries', 'Please specify other surgeries:')}
                        </label>
                        <textarea
                          value={medicalHistory.surgeriesOther}
                          onChange={(e) => setMedicalHistory({ ...medicalHistory, surgeriesOther: e.target.value })}
                          className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                          rows={2}
                          placeholder={t('forms.surgeriesOtherPlaceholder', 'List other surgeries...')}
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-secondary-200 bg-white/80 p-5 space-y-4 shadow-sm">
                    <h3 className="text-base font-semibold text-secondary-900">
                      {t('forms.lifestyle', 'Lifestyle & Special Notes')}
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between rounded-xl border border-secondary-200 px-3 py-2 bg-secondary-50 hover:border-primary-200 transition-colors">
                        <span className="text-sm text-secondary-800">{t('forms.smoker', 'Smoker?')}</span>
                        <input
                          type="checkbox"
                          checked={medicalHistory.smoker}
                          onChange={(e) => setMedicalHistory({ ...medicalHistory, smoker: e.target.checked })}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                      </label>
                      <label className="flex items-center justify-between rounded-xl border border-secondary-200 px-3 py-2 bg-secondary-50 hover:border-primary-200 transition-colors">
                        <span className="text-sm text-secondary-800">{t('forms.pregnant', 'Pregnant?')}</span>
                        <input
                          type="checkbox"
                          checked={medicalHistory.pregnant}
                          onChange={(e) => setMedicalHistory({ ...medicalHistory, pregnant: e.target.checked })}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {error && <div className="text-red-700 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</div>}
                
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 shadow-md"
                  >
                    {submitting ? t('common.submitting', 'Submitting...') : t('forms.submitForm', 'Submit Form')}
                  </button>
                </div>
              </form>
            )}
            
            {activeForm === 'patient_registration' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      {t('forms.fullName', 'Full Name')}
                    </label>
                    <input
                      type="text"
                      required
                      value={patientRegistration.fullName}
                      onChange={(e) => setPatientRegistration({ ...patientRegistration, fullName: e.target.value })}
                      className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      {t('forms.dateOfBirth', 'Date of Birth')}
                    </label>
                    <input
                      type="date"
                      required
                      value={patientRegistration.dateOfBirth}
                      onChange={(e) => setPatientRegistration({ ...patientRegistration, dateOfBirth: e.target.value })}
                      className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      {t('forms.address', 'Address')}
                    </label>
                    <input
                      type="text"
                      required
                      value={patientRegistration.address}
                      onChange={(e) => setPatientRegistration({ ...patientRegistration, address: e.target.value })}
                      className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      {t('forms.phoneNumber', 'Phone Number')}
                    </label>
                    <input
                      type="tel"
                      required
                      value={patientRegistration.phoneNumber}
                      onChange={(e) => setPatientRegistration({ ...patientRegistration, phoneNumber: e.target.value })}
                      className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="border-t border-secondary-200 pt-6">
                  <h3 className="text-lg font-medium text-primary-800 mb-4">
                    {t('forms.emergencyContact', 'Emergency Contact')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('forms.contactName', 'Contact Name')}
                      </label>
                      <input
                        type="text"
                        required
                        value={patientRegistration.emergencyContactName}
                        onChange={(e) => setPatientRegistration({ ...patientRegistration, emergencyContactName: e.target.value })}
                        className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('forms.contactPhone', 'Contact Phone')}
                      </label>
                      <input
                        type="tel"
                        required
                        value={patientRegistration.emergencyContactPhone}
                        onChange={(e) => setPatientRegistration({ ...patientRegistration, emergencyContactPhone: e.target.value })}
                        className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-secondary-200 pt-6">
                  <h3 className="text-lg font-medium text-primary-800 mb-4">
                    {t('forms.insuranceInfo', 'Insurance Information (Optional)')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('forms.insuranceProvider', 'Insurance Provider')}
                      </label>
                      <input
                        type="text"
                        value={patientRegistration.insuranceProvider}
                        onChange={(e) => setPatientRegistration({ ...patientRegistration, insuranceProvider: e.target.value })}
                        className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('forms.policyNumber', 'Policy Number')}
                      </label>
                      <input
                        type="text"
                        value={patientRegistration.insurancePolicyNumber}
                        onChange={(e) => setPatientRegistration({ ...patientRegistration, insurancePolicyNumber: e.target.value })}
                        className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('forms.groupNumber', 'Group Number')}
                      </label>
                      <input
                        type="text"
                        value={patientRegistration.insuranceGroupNumber}
                        onChange={(e) => setPatientRegistration({ ...patientRegistration, insuranceGroupNumber: e.target.value })}
                        className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('forms.subscriberName', 'Subscriber Name')}
                      </label>
                      <input
                        type="text"
                        value={patientRegistration.subscriberName}
                        onChange={(e) => setPatientRegistration({ ...patientRegistration, subscriberName: e.target.value })}
                        className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('forms.subscriberDOB', 'Subscriber Date of Birth')}
                      </label>
                      <input
                        type="date"
                        value={patientRegistration.subscriberDOB}
                        onChange={(e) => setPatientRegistration({ ...patientRegistration, subscriberDOB: e.target.value })}
                        className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('forms.relationship', 'Relationship to Subscriber')}
                      </label>
                      <select
                        value={patientRegistration.relationship}
                        onChange={(e) => setPatientRegistration({ ...patientRegistration, relationship: e.target.value })}
                        className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">{t('forms.selectRelationship', 'Select relationship')}</option>
                        <option value="self">{t('forms.self', 'Self')}</option>
                        <option value="spouse">{t('forms.spouse', 'Spouse')}</option>
                        <option value="child">{t('forms.child', 'Child')}</option>
                        <option value="other">{t('forms.other', 'Other')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>}
                
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {submitting ? t('common.submitting', 'Submitting...') : t('forms.submitRegistration', 'Submit Registration')}
                  </button>
                </div>
              </form>
            )}

            {/* Treatment Consent Form */}
            {activeForm === 'consent_treatment' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    {t('forms.consentNotice', 'Please read carefully and check all boxes to indicate your understanding and consent.')}
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      required
                      checked={treatmentConsent.consentToTreatment}
                      onChange={(e) => setTreatmentConsent({ ...treatmentConsent, consentToTreatment: e.target.checked })}
                      className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">
                      {t('forms.consentToTreatment', 'I consent to the proposed dental treatment and procedures as explained by my dentist.')}
                    </span>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      required
                      checked={treatmentConsent.understandRisks}
                      onChange={(e) => setTreatmentConsent({ ...treatmentConsent, understandRisks: e.target.checked })}
                      className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">
                      {t('forms.understandRisks', 'I understand the risks, benefits, and alternatives to the proposed treatment.')}
                    </span>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      required
                      checked={treatmentConsent.understandAlternatives}
                      onChange={(e) => setTreatmentConsent({ ...treatmentConsent, understandAlternatives: e.target.checked })}
                      className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">
                      {t('forms.understandAlternatives', 'I understand that I have the right to ask questions and discuss alternative treatments.')}
                    </span>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={treatmentConsent.consentToPhotography}
                      onChange={(e) => setTreatmentConsent({ ...treatmentConsent, consentToPhotography: e.target.checked })}
                      className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">
                      {t('forms.consentToPhotography', 'I consent to photography for treatment documentation and educational purposes.')}
                    </span>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={treatmentConsent.consentToXrays}
                      onChange={(e) => setTreatmentConsent({ ...treatmentConsent, consentToXrays: e.target.checked })}
                      className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">
                      {t('forms.consentToXrays', 'I consent to X-rays and other diagnostic imaging as needed for my treatment.')}
                    </span>
                  </label>
                </div>

                <div className="border-t border-secondary-200 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('forms.signature', 'Signature')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={treatmentConsent.signature}
                        onChange={(e) => setTreatmentConsent({ ...treatmentConsent, signature: e.target.value })}
                        className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                        placeholder={t('forms.signaturePlaceholder', 'Type your full name')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('forms.date', 'Date')} *
                      </label>
                      <input
                        type="date"
                        required
                        value={treatmentConsent.date}
                        onChange={(e) => setTreatmentConsent({ ...treatmentConsent, date: e.target.value })}
                        className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>}
                
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {submitting ? t('common.submitting', 'Submitting...') : t('forms.submitConsent', 'Submit Consent')}
                  </button>
                </div>
              </form>
            )}

            {/* HIPAA Consent Form */}
            {activeForm === 'consent_hipaa' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-indigo-800 font-medium mb-2">
                    {t('forms.hipaaNoticeTitle', 'HIPAA Privacy Notice Acknowledgment')}
                  </p>
                  <p className="text-sm text-indigo-700">
                    {t('forms.hipaaNoticeText', 'I acknowledge that I have received a copy of the Notice of Privacy Practices. I understand my rights regarding protected health information.')}
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      required
                      checked={hipaaConsent.acknowledgeNotice}
                      onChange={(e) => setHipaaConsent({ ...hipaaConsent, acknowledgeNotice: e.target.checked })}
                      className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">
                      {t('forms.acknowledgeNotice', 'I acknowledge that I have received and reviewed the Notice of Privacy Practices.')}
                    </span>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      required
                      checked={hipaaConsent.consentToUse}
                      onChange={(e) => setHipaaConsent({ ...hipaaConsent, consentToUse: e.target.checked })}
                      className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">
                      {t('forms.consentToUse', 'I consent to the use of my protected health information for treatment, payment, and healthcare operations.')}
                    </span>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={hipaaConsent.consentToDisclose}
                      onChange={(e) => setHipaaConsent({ ...hipaaConsent, consentToDisclose: e.target.checked })}
                      className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">
                      {t('forms.consentToDisclose', 'I consent to the disclosure of my protected health information to family members or others involved in my care.')}
                    </span>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={hipaaConsent.requestRestrictions}
                      onChange={(e) => setHipaaConsent({ ...hipaaConsent, requestRestrictions: e.target.checked })}
                      className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">
                      {t('forms.requestRestrictions', 'I would like to request restrictions on the use or disclosure of my health information.')}
                    </span>
                  </label>

                  {hipaaConsent.requestRestrictions && (
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('forms.restrictionsDetails', 'Please describe the restrictions you would like:')}
                      </label>
                      <textarea
                        value={hipaaConsent.restrictionsDetails}
                        onChange={(e) => setHipaaConsent({ ...hipaaConsent, restrictionsDetails: e.target.value })}
                        className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                        rows={3}
                        placeholder={t('forms.restrictionsPlaceholder', 'Describe your requested restrictions...')}
                      />
                    </div>
                  )}
                </div>

                <div className="border-t border-secondary-200 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('forms.signature', 'Signature')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={hipaaConsent.signature}
                        onChange={(e) => setHipaaConsent({ ...hipaaConsent, signature: e.target.value })}
                        className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                        placeholder={t('forms.signaturePlaceholder', 'Type your full name')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('forms.date', 'Date')} *
                      </label>
                      <input
                        type="date"
                        required
                        value={hipaaConsent.date}
                        onChange={(e) => setHipaaConsent({ ...hipaaConsent, date: e.target.value })}
                        className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>}
                
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {submitting ? t('common.submitting', 'Submitting...') : t('forms.submitConsent', 'Submit Consent')}
                  </button>
                </div>
              </form>
            )}

            {/* Financial Consent Form */}
            {activeForm === 'consent_financial' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-800 font-medium mb-2">
                    {t('forms.financialNoticeTitle', 'Financial Responsibility Agreement')}
                  </p>
                  <p className="text-sm text-green-700">
                    {t('forms.financialNoticeText', 'I understand that I am financially responsible for all charges incurred for services rendered, regardless of insurance coverage.')}
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      required
                      checked={financialConsent.understandCharges}
                      onChange={(e) => setFinancialConsent({ ...financialConsent, understandCharges: e.target.checked })}
                      className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">
                      {t('forms.understandCharges', 'I understand that I am responsible for all charges for services provided, including those not covered by insurance.')}
                    </span>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      required
                      checked={financialConsent.agreeToPay}
                      onChange={(e) => setFinancialConsent({ ...financialConsent, agreeToPay: e.target.checked })}
                      className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">
                      {t('forms.agreeToPay', 'I agree to pay all charges in full at the time of service, unless other arrangements have been made.')}
                    </span>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={financialConsent.understandInsurance}
                      onChange={(e) => setFinancialConsent({ ...financialConsent, understandInsurance: e.target.checked })}
                      className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">
                      {t('forms.understandInsurance', 'I understand that insurance is a contract between me and my insurance company, and I am responsible for any amounts not covered.')}
                    </span>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={financialConsent.acceptAssignment}
                      onChange={(e) => setFinancialConsent({ ...financialConsent, acceptAssignment: e.target.checked })}
                      className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">
                      {t('forms.acceptAssignment', 'I authorize direct payment to the dental office for services covered by my insurance.')}
                    </span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      {t('forms.paymentMethod', 'Preferred Payment Method')}
                    </label>
                    <select
                      value={financialConsent.paymentMethod}
                      onChange={(e) => setFinancialConsent({ ...financialConsent, paymentMethod: e.target.value })}
                      className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">{t('forms.selectPaymentMethod', 'Select payment method')}</option>
                      <option value="cash">{t('forms.cash', 'Cash')}</option>
                      <option value="credit_card">{t('forms.creditCard', 'Credit Card')}</option>
                      <option value="debit_card">{t('forms.debitCard', 'Debit Card')}</option>
                      <option value="check">{t('forms.check', 'Check')}</option>
                      <option value="insurance">{t('forms.insurance', 'Insurance')}</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-secondary-200 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('forms.signature', 'Signature')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={financialConsent.signature}
                        onChange={(e) => setFinancialConsent({ ...financialConsent, signature: e.target.value })}
                        className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                        placeholder={t('forms.signaturePlaceholder', 'Type your full name')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('forms.date', 'Date')} *
                      </label>
                      <input
                        type="date"
                        required
                        value={financialConsent.date}
                        onChange={(e) => setFinancialConsent({ ...financialConsent, date: e.target.value })}
                        className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>}
                
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {submitting ? t('common.submitting', 'Submitting...') : t('forms.submitConsent', 'Submit Consent')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-secondary-900">
                {t('forms.cancelAppointment', 'Cancel Appointment')}
              </h3>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setError(null);
                }}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-secondary-600">
              {t('forms.cancelConfirmation', 'Are you sure you want to cancel this appointment? This action cannot be undone.')}
            </p>
            {appointment && (
              <div className="bg-secondary-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-700">{t('forms.appointmentDate', 'Date')}:</span>
                  <span className="text-sm text-secondary-900">{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-700">{t('forms.appointmentTime', 'Time')}:</span>
                  <span className="text-sm text-secondary-900">{appointment.appointmentTime}</span>
                </div>
                {appointment.serviceName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-secondary-700">{t('forms.service', 'Service')}:</span>
                    <span className="text-sm text-secondary-900">{appointment.serviceName}</span>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                {t('forms.cancelReason', 'Reason for cancellation (optional)')}
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder={t('forms.cancelReasonPlaceholder', 'Please provide a reason...')}
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setError(null);
                }}
                className="flex-1 px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors font-semibold"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? t('common.cancelling', 'Cancelling...') : t('forms.confirmCancel', 'Confirm Cancellation')}
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .forms-page input[type='text'],
        .forms-page input[type='email'],
        .forms-page input[type='tel'],
        .forms-page input[type='date'],
        .forms-page input[type='number'],
        .forms-page select,
        .forms-page textarea {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem;
          outline: none;
          transition: box-shadow 150ms ease, border-color 150ms ease, background-color 150ms ease;
        }
        .forms-page textarea {
          min-height: 2.5rem;
        }
        .forms-page input::placeholder,
        .forms-page select::placeholder,
        .forms-page textarea::placeholder {
          color: #94a3b8;
        }
        .forms-page input:focus,
        .forms-page select:focus,
        .forms-page textarea:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
        }
      `}</style>
    </div>
  );
}

