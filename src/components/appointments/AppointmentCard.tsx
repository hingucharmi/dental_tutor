'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import axios from 'axios';

interface Appointment {
  id: number;
  userId?: number;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: string;
  serviceId?: number;
  serviceName?: string;
  dentistId?: number;
  notes?: string;
  hasBeenRescheduled?: boolean;
  hasBeenCancelled?: boolean;
  rescheduleCount?: number;
  cancelCount?: number;
  formCompleted?: boolean;
  formPartiallyCompleted?: boolean;
  formCompletedCount?: number;
  formTotalCount?: number;
  preCheckCompleted?: boolean;
  hasPrescription?: boolean;
  hasCareInstructions?: boolean;
  patientFirstName?: string;
  patientLastName?: string;
  patientEmail?: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onUpdate?: () => void;
  isHistory?: boolean;
  canComplete?: boolean;
  showPatientDetails?: boolean;
}

type AppointmentState = 'booked' | 'pre_check_done' | 'completed' | 'cancelled';

export function AppointmentCard({ appointment, onUpdate, isHistory = false, canComplete = false, showPatientDetails = false }: AppointmentCardProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReasonKey, setCancelReasonKey] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getAppointmentState = (): AppointmentState => {
    if (appointment.status === 'cancelled') return 'cancelled';
    if (appointment.status === 'completed') return 'completed';
    if (appointment.preCheckCompleted || appointment.formCompleted) return 'pre_check_done';
    return 'booked';
  };

  const state = getAppointmentState();
  const isPreCheckComplete = appointment.preCheckCompleted || appointment.formCompleted;
  const canMarkComplete = canComplete && isPreCheckComplete && state !== 'completed' && state !== 'cancelled';
  const patientName = [appointment.patientFirstName, appointment.patientLastName].filter(Boolean).join(' ');

  const cancelReasons = [
    { key: 'schedule', label: t('appointments.cancelReasons.schedule', 'Scheduling conflict') },
    { key: 'feelingBetter', label: t('appointments.cancelReasons.feelingBetter', 'I am feeling better') },
    { key: 'cost', label: t('appointments.cancelReasons.cost', 'Cost or insurance concerns') },
    { key: 'transport', label: t('appointments.cancelReasons.transport', 'Transportation issues') },
    { key: 'other', label: t('appointments.cancelReasons.other', 'Other') },
  ];

  const selectedReasonLabel = cancelReasons.find((r) => r.key === cancelReasonKey)?.label || '';
  const isOtherReason = cancelReasonKey === 'other';

  const handleCancel = () => {
    setCancelError(null);
    setCancelReasonKey('');
    setCustomReason('');
    setShowCancelDialog(true);
  };

  const submitCancellation = async () => {
    if (!cancelReasonKey) {
      setCancelError(t('appointments.cancelReasons.required', 'Please select a reason.'));
      return;
    }

    const finalReason = isOtherReason ? customReason.trim() : selectedReasonLabel;

    if (isOtherReason && !finalReason) {
      setCancelError(t('appointments.cancelReasons.otherRequired', 'Please provide your reason.'));
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`/api/appointments/${appointment.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          reason: finalReason,
        },
      });
      onUpdate?.();
      setShowCancelDialog(false);
    } catch (err: any) {
      alert(err.response?.data?.error || t('appointments.cancelError'));
    } finally {
      setLoading(false);
    }
  };
  const canCancel = !(appointment.hasBeenCancelled || (appointment.cancelCount !== undefined && appointment.cancelCount > 0));

  const handleComplete = async () => {
    try {
      setCompleteLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/appointments/${appointment.id}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      onUpdate?.();
    } catch (err: any) {
      alert(err.response?.data?.error || t('appointments.completeError', 'Could not mark appointment as completed.'));
    } finally {
      setCompleteLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (state) {
      case 'booked':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
            {t('appointments.status.confirmed', 'Confirmed')}
          </span>
        );
      case 'pre_check_done':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
            {t('appointments.status.ready', 'Ready for Visit')}
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            {t('appointments.status.completed', 'Completed')}
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
            {t('appointments.status.cancelled', 'Cancelled')}
          </span>
        );
    }
  };

  const getTimelineSteps = () => {
    const steps = [
      {
        id: 'booked',
        label: t('appointments.timeline.booked', 'Appointment Booked'),
        completed: true,
        current: state === 'booked',
      },
      {
        id: 'pre_check',
        label: t('appointments.timeline.preCheck', 'Complete Pre-Visit Forms'),
        completed: state !== 'booked',
        current: state === 'pre_check_done',
      },
      {
        id: 'visit',
        label: t('appointments.timeline.visit', 'Visit Completed'),
        completed: state === 'completed',
        current: false,
      },
    ];
    return steps;
  };

  const timelineSteps = getTimelineSteps();

  if (state === 'cancelled') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-secondary-200 opacity-60">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-primary-700 mb-1">
              {appointment.serviceName || t('appointments.generalAppointment', 'General Appointment')}
            </h3>
            <p className="text-sm text-secondary-500">
              {formatDate(appointment.appointmentDate)} at {formatTime(appointment.appointmentTime)}
            </p>
          </div>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-secondary-600 italic">
          {t('appointments.cancelled', 'This appointment has been cancelled')}
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all ${
      state === 'pre_check_done' 
        ? 'border-blue-300 bg-blue-50/30' 
        : state === 'completed'
        ? 'border-gray-200 bg-gray-50/30'
        : 'border-green-200 bg-green-50/30'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-primary-700 mb-1">
            {appointment.serviceName || t('appointments.generalAppointment', 'General Appointment')}
          </h3>
          <p className="text-sm text-secondary-600 font-medium">
            {formatDate(appointment.appointmentDate)}
          </p>
          <p className="text-sm text-secondary-500">
            {formatTime(appointment.appointmentTime)} • {appointment.duration} {t('common.minutes', 'min')}
          </p>
          {showPatientDetails && (
            <p className="text-xs text-secondary-600 mt-1">
              <span className="font-semibold">{t('appointments.patient', 'Client')}:</span>{' '}
              {patientName || (appointment.userId ? `ID #${appointment.userId}` : t('appointments.unknownPatient', 'Unknown'))}
              {appointment.patientEmail ? ` • ${appointment.patientEmail}` : ''}
            </p>
          )}
        </div>
        {getStatusBadge()}
      </div>

      {/* Timeline/Stepper */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {timelineSteps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  step.completed
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : step.current
                    ? 'bg-primary-100 border-primary-600 text-primary-700'
                    : 'bg-white border-secondary-300 text-secondary-400'
                }`}>
                  {step.completed ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <span className={`text-xs mt-2 text-center px-2 ${
                  step.completed || step.current
                    ? 'text-primary-700 font-medium'
                    : 'text-secondary-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < timelineSteps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 ${
                  step.completed ? 'bg-primary-600' : 'bg-secondary-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* State-specific Actions */}
      {state === 'booked' && !isHistory && (
        <div className="space-y-2">
          {appointment.formPartiallyCompleted && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2">
              <p className="text-xs text-amber-800 font-medium flex items-center">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {t('appointments.partialFormComplete', '{{completed}} of {{total}} forms completed. Please complete all required forms.', {
                  completed: appointment.formCompletedCount || 0,
                  total: appointment.formTotalCount || 5
                })}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/forms?appointmentId=${appointment.id}`}
              className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center text-xs font-medium whitespace-nowrap"
            >
              {appointment.formPartiallyCompleted 
                ? t('appointments.actions.completeRemainingForms', 'Complete Remaining Forms')
                : t('appointments.actions.completeForm', 'Complete Pre-Visit Form')}
            </Link>
          <Link
            href="/symptom-assessment"
            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-center text-xs whitespace-nowrap"
          >
            {t('appointments.actions.symptomAssessment', 'Symptom Assessment')}
          </Link>
          <Link
            href={`/preparation-instructions${appointment.serviceId ? `?serviceId=${appointment.serviceId}` : ''}`}
            className="px-3 py-1.5 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors text-center text-xs whitespace-nowrap"
          >
            {t('appointments.actions.viewInstructions', 'View Instructions')}
          </Link>
          <Link
            href={`/appointments/${appointment.id}/reschedule`}
            className={`px-3 py-1.5 rounded-lg transition-colors text-center text-xs whitespace-nowrap ${
              appointment.hasBeenRescheduled || (appointment.rescheduleCount !== undefined && appointment.rescheduleCount > 0)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            {t('appointments.reschedule', 'Reschedule')}
          </Link>
          <button
            onClick={handleCancel}
            disabled={loading || !canCancel}
            className={`px-3 py-1.5 rounded-lg transition-colors text-xs whitespace-nowrap ${
              canCancel
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? t('common.loading', 'Loading...') : t('appointments.cancel', 'Cancel')}
          </button>
          {canComplete && (
            <button
              onClick={handleComplete}
              disabled={!canMarkComplete || completeLoading}
              className={`px-3 py-1.5 rounded-lg transition-colors text-center text-xs whitespace-nowrap disabled:opacity-60 ${
                canMarkComplete
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {completeLoading ? t('common.loading', 'Loading...') : t('appointments.actions.markCompleted', 'Mark as Completed')}
            </button>
          )}
          </div>
          {canComplete && !isPreCheckComplete && (
            <p className="text-xs text-secondary-500 mt-1">
              {t('appointments.completeRequiresForms', 'Complete pre-visit forms before marking completed.')}
            </p>
          )}
        </div>
      )}

      {state === 'pre_check_done' && !isHistory && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
            <p className="text-xs text-blue-800 font-medium flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('appointments.preCheckComplete', 'Pre-visit forms completed! You\'re all set for your appointment.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/preparation-instructions${appointment.serviceId ? `?serviceId=${appointment.serviceId}` : ''}`}
              className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center text-xs font-medium whitespace-nowrap"
            >
              {t('appointments.actions.getDirections', 'Get Directions')}
            </Link>
            <Link
              href={`/preparation-instructions${appointment.serviceId ? `?serviceId=${appointment.serviceId}` : ''}`}
              className="px-3 py-1.5 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors text-center text-xs whitespace-nowrap"
            >
              {t('appointments.actions.viewInstructions', 'View Instructions')}
            </Link>
            <Link
              href="/documents"
              className="px-3 py-1.5 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors text-center text-xs whitespace-nowrap"
            >
              {t('appointments.actions.uploadXrays', 'Upload X-Rays')}
            </Link>
            <Link
              href="/symptom-assessment"
              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-center text-xs whitespace-nowrap"
            >
              {t('appointments.actions.symptomAssessment', 'Symptom Assessment')}
            </Link>
            <Link
              href={`/appointments/${appointment.id}/reschedule`}
              className={`px-3 py-1.5 rounded-lg transition-colors text-center text-xs whitespace-nowrap ${
                appointment.hasBeenRescheduled || (appointment.rescheduleCount !== undefined && appointment.rescheduleCount > 0)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              {t('appointments.reschedule', 'Reschedule')}
            </Link>
            <button
              onClick={handleCancel}
              disabled={loading || !canCancel}
              className={`px-3 py-1.5 rounded-lg transition-colors text-xs whitespace-nowrap ${
                canCancel
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? t('common.loading', 'Loading...') : t('appointments.cancel', 'Cancel')}
            </button>
            {canComplete && (
              <button
                onClick={handleComplete}
                disabled={!canMarkComplete || completeLoading}
                className={`px-3 py-1.5 rounded-lg transition-colors text-center text-xs whitespace-nowrap disabled:opacity-60 ${
                  canMarkComplete
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {completeLoading ? t('common.loading', 'Loading...') : t('appointments.actions.markCompleted', 'Mark as Completed')}
              </button>
            )}
          </div>
          {canComplete && !isPreCheckComplete && (
            <p className="text-xs text-secondary-500 mt-1">
              {t('appointments.completeRequiresForms', 'Complete pre-visit forms before marking completed.')}
            </p>
          )}
        </div>
      )}

      {state === 'completed' && (
        <div className="space-y-3">
          {appointment.hasPrescription && (
            <Link
              href="/prescriptions"
              className="block w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center font-medium shadow-md hover:shadow-lg"
            >
              {t('appointments.actions.downloadPrescription', 'Download Prescription')}
            </Link>
          )}
          {appointment.hasCareInstructions && (
            <Link
              href="/care-instructions"
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
            >
              {t('appointments.actions.viewCareInstructions', 'View Care Instructions')}
            </Link>
          )}
          <div className="flex gap-2">
            <Link
              href={`/appointments/${appointment.id}/feedback`}
              className="flex-1 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-center text-sm"
            >
              {t('appointments.actions.leaveFeedback', 'Leave Feedback')}
            </Link>
            {(
              <Link
                href="/prescriptions"
                className="flex-1 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-center text-sm"
              >
                {t('appointments.actions.requestRefill', 'Request Refill')}
              </Link>
            )}
          </div>
        </div>
      )}

      {isHistory && canComplete && state !== 'completed' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={handleComplete}
            disabled={!canMarkComplete || completeLoading}
            className={`px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-60 ${
              canMarkComplete
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {completeLoading ? t('common.loading', 'Loading...') : t('appointments.actions.markCompleted', 'Mark as Completed')}
          </button>
        </div>
      )}

      {appointment.notes && (
        <div className="mt-4 pt-4 border-t border-secondary-200">
          <p className="text-sm text-secondary-600">
            <span className="font-medium">{t('appointments.notes', 'Notes')}:</span> {appointment.notes}
          </p>
        </div>
      )}

      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary-700">
                {t('appointments.cancelDialog.title', 'Cancel appointment')}
              </h3>
              <button
                onClick={() => setShowCancelDialog(false)}
                className="text-secondary-500 hover:text-secondary-700"
                aria-label={t('common.close', 'Close')}
              >
                ×
              </button>
            </div>

            <p className="text-sm text-secondary-600">
              {t('appointments.cancelDialog.subtitle', 'Please tell us why you are cancelling.')}
            </p>

            <div className="space-y-3">
              {cancelReasons.map((reason) => (
                <label
                  key={reason.key}
                  className="flex items-center gap-3 p-3 border border-secondary-200 rounded-lg hover:border-primary-300 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`cancel-reason-${appointment.id}`}
                    value={reason.key}
                    checked={cancelReasonKey === reason.key}
                    onChange={() => {
                      setCancelReasonKey(reason.key);
                      setCancelError(null);
                    }}
                  />
                  <span className="text-sm text-secondary-700">{reason.label}</span>
                </label>
              ))}

              {isOtherReason && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary-700" htmlFor={`cancel-other-${appointment.id}`}>
                    {t('appointments.cancelDialog.otherLabel', 'Other reason')}
                  </label>
                  <textarea
                    id={`cancel-other-${appointment.id}`}
                    className="w-full border border-secondary-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                    rows={3}
                    placeholder={t('appointments.cancelDialog.otherPlaceholder', 'Type your reason...')}
                    value={customReason}
                    onChange={(e) => {
                      setCustomReason(e.target.value);
                      setCancelError(null);
                    }}
                  />
                </div>
              )}

              {cancelError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {cancelError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 text-secondary-700 bg-secondary-100 rounded-lg hover:bg-secondary-200 text-sm"
              >
                {t('common.back', 'Back')}
              </button>
              <button
                onClick={submitCancellation}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-60"
              >
                {loading ? t('common.loading', 'Loading...') : t('appointments.cancel', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

