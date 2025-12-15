'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import axios from 'axios';
import { AppointmentCard } from '@/components/appointments/AppointmentCard';

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
  patientFirstName?: string;
  patientLastName?: string;
  patientEmail?: string;
}

export default function AppointmentsPage() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';
  const isDentist = user?.role === 'dentist';
  const isPatient = user?.role === 'patient' || !user?.role;
  const canManageAsProvider = isDentist || isAdmin;

  const getPageTitle = () => {
    if (isAdmin) return t('appointments.manageTitle');
    if (isDentist) return t('appointments.scheduleTitle');
    return t('appointments.myAppointmentsTitle');
  };

  const getPageSubtitle = () => {
    if (isAdmin) return t('appointments.subtitleAdmin');
    if (isDentist) return t('appointments.subtitleDentist');
    return t('appointments.subtitlePatient');
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchAppointments();
    }
  }, [authLoading, user, activeTab]);

  // Listen for appointment creation/update events
  useEffect(() => {
    const handleAppointmentCreated = () => {
      fetchAppointments();
    };

    const handleAppointmentCancelled = () => {
      fetchAppointments();
    };

    const handleAppointmentRescheduled = () => {
      fetchAppointments();
    };

    window.addEventListener('appointment-created', handleAppointmentCreated);
    window.addEventListener('appointment-cancelled', handleAppointmentCancelled);
    window.addEventListener('appointment-rescheduled', handleAppointmentRescheduled);
    
    // Check for success/rescheduled query params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      console.log('Success param detected, refreshing appointments...');
      setSuccessMessage('Appointment booked successfully!');
      // Small delay to ensure page is ready
      setTimeout(() => {
        fetchAppointments();
        // Remove query param from URL
        window.history.replaceState({}, '', '/appointments');
        setTimeout(() => setSuccessMessage(null), 5000);
      }, 200);
    }
    if (urlParams.get('rescheduled') === 'true') {
      console.log('Rescheduled param detected, refreshing appointments...');
      setSuccessMessage('Appointment rescheduled successfully!');
      // Small delay to ensure page is ready
      setTimeout(() => {
        fetchAppointments();
        // Remove query param from URL
        window.history.replaceState({}, '', '/appointments');
        setTimeout(() => setSuccessMessage(null), 5000);
      }, 200);
    }

    return () => {
      window.removeEventListener('appointment-created', handleAppointmentCreated);
      window.removeEventListener('appointment-cancelled', handleAppointmentCancelled);
      window.removeEventListener('appointment-rescheduled', handleAppointmentRescheduled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const endpoint = activeTab === 'upcoming' 
        ? '/api/appointments/upcoming'
        : '/api/appointments/history';
      
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const appointmentsList = response.data.data.appointments || [];
        console.log('Fetched appointments:', appointmentsList.length, appointmentsList);
        setAppointments(appointmentsList);
      } else {
        console.error('API returned success=false:', response.data);
      }
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.error || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId: number) => {
    if (!confirm(t('appointments.confirmCancel', 'Are you sure you want to cancel this appointment?'))) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/appointments/${appointmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Refresh appointments
      setSuccessMessage(t('appointments.cancelSuccess'));
      fetchAppointments();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || t('appointments.cancelError'));
    }
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="heading-responsive font-bold text-primary-700">
            {getPageTitle()}
          </h1>
          <p className="text-secondary-600 mt-2">
            {getPageSubtitle()}
          </p>
        </div>
        {isPatient && (
          <div className="flex gap-3">
            <Link
              href="/appointments/book"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t('appointments.bookNew')}
            </Link>
            <Link
              href="/recurring-appointments"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t('common.recurringAppointments', 'Recurring Appointments')}
            </Link>
          </div>
        )}
        {(isDentist || isAdmin) && (
          <div className="flex gap-3">
            <Link
              href="/recurring-appointments"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-200 transition-colors"
            >
              {t('common.recurringAppointments', 'Recurring Appointments')}
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-secondary-200">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-600 hover:text-primary-600'
          }`}
        >
          {t('appointments.upcoming')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-600 hover:text-primary-600'
          }`}
        >
          {t('appointments.history')}
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-700 hover:text-green-900"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-secondary-200">
          <p className="text-secondary-600 mb-4">
            {activeTab === 'upcoming' 
              ? t('appointments.noUpcoming')
              : t('appointments.noHistory')}
          </p>
          {activeTab === 'upcoming' && (
            <Link
              href="/appointments/book"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t('appointments.bookFirst', 'Book Your First Appointment')}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onUpdate={fetchAppointments}
              isHistory={activeTab === 'history'}
              canComplete={canManageAsProvider}
              showPatientDetails={canManageAsProvider}
            />
          ))}
        </div>
      )}
    </div>
  );
}

