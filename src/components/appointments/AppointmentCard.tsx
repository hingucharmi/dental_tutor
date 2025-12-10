'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import axios from 'axios';

interface Appointment {
  id: number;
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
}

interface AppointmentCardProps {
  appointment: Appointment;
  onUpdate?: () => void;
  isHistory?: boolean;
}

type AppointmentState = 'booked' | 'pre_check_done' | 'completed' | 'cancelled';

export function AppointmentCard({ appointment, onUpdate, isHistory = false }: AppointmentCardProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

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

  const handleCancel = async () => {
    if (!confirm(t('appointments.confirmCancel', 'Are you sure you want to cancel this appointment?'))) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`/api/appointments/${appointment.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      onUpdate?.();
    } catch (err: any) {
      alert(err.response?.data?.error || t('appointments.cancelError'));
    } finally {
      setLoading(false);
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
            disabled={loading || appointment.hasBeenCancelled || (appointment.cancelCount !== undefined && appointment.cancelCount > 0)}
            className={`px-3 py-1.5 rounded-lg transition-colors text-xs whitespace-nowrap ${
              appointment.hasBeenCancelled || (appointment.cancelCount !== undefined && appointment.cancelCount > 0)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {loading ? t('common.loading', 'Loading...') : t('appointments.cancel', 'Cancel')}
          </button>
          </div>
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
              disabled={loading || appointment.hasBeenCancelled || (appointment.cancelCount !== undefined && appointment.cancelCount > 0)}
              className={`px-3 py-1.5 rounded-lg transition-colors text-xs whitespace-nowrap ${
                appointment.hasBeenCancelled || (appointment.cancelCount !== undefined && appointment.cancelCount > 0)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {loading ? t('common.loading', 'Loading...') : t('appointments.cancel', 'Cancel')}
            </button>
          </div>
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
              className="flex-1 px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors text-center text-sm"
            >
              {t('appointments.actions.leaveFeedback', 'Leave Feedback')}
            </Link>
            {appointment.hasPrescription && (
              <Link
                href="/prescriptions"
                className="flex-1 px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors text-center text-sm"
              >
                {t('appointments.actions.requestRefill', 'Request Refill')}
              </Link>
            )}
          </div>
        </div>
      )}

      {appointment.notes && (
        <div className="mt-4 pt-4 border-t border-secondary-200">
          <p className="text-sm text-secondary-600">
            <span className="font-medium">{t('appointments.notes', 'Notes')}:</span> {appointment.notes}
          </p>
        </div>
      )}
    </div>
  );
}

