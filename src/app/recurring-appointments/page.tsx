'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import apiClient from '@/lib/utils/apiClient';

interface RecurringAppointment {
  id: number;
  user_id?: number;
  service_id?: number;
  service_name?: string;
  dentist_id?: number;
  recurrence_pattern: string;
  recurrence_interval: number;
  day_of_week?: number;
  day_of_month?: number;
  start_date: string;
  end_date?: string;
  time_slot: string;
  duration: number;
  status: string;
  notes?: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function RecurringAppointmentsPage() {
  const { user, loading: authLoading } = useAuth(true);
  const [recurringAppointments, setRecurringAppointments] = useState<RecurringAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const isStaff = user?.role === 'admin' || user?.role === 'staff' || user?.role === 'dentist';

  useEffect(() => {
    if (!authLoading && user) {
      fetchRecurringAppointments();
    }
  }, [authLoading, user]);

  // Check for success query param
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setSuccessMessage('Recurring appointment created successfully!');
      setTimeout(() => {
        fetchRecurringAppointments();
        window.history.replaceState({}, '', '/recurring-appointments');
        setTimeout(() => setSuccessMessage(null), 5000);
      }, 200);
    }
  }, []);

  const fetchRecurringAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/recurring-appointments');
      
      if (response.data.success) {
        setRecurringAppointments(response.data.data.recurringAppointments || []);
      }
    } catch (err: any) {
      console.error('Error fetching recurring appointments:', err);
      setError(err.response?.data?.error || 'Failed to load recurring appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this recurring appointment?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/recurring-appointments/${id}`);
      fetchRecurringAppointments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete recurring appointment');
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getRecurrenceDescription = (appointment: RecurringAppointment) => {
    const { recurrence_pattern, recurrence_interval, day_of_week, day_of_month } = appointment;
    
    switch (recurrence_pattern) {
      case 'daily':
        return `Every ${recurrence_interval} day${recurrence_interval > 1 ? 's' : ''}`;
      case 'weekly':
        const dayName = day_of_week !== null && day_of_week !== undefined 
          ? DAYS_OF_WEEK[day_of_week] 
          : '';
        return `Every ${recurrence_interval} week${recurrence_interval > 1 ? 's' : ''}${dayName ? ` on ${dayName}` : ''}`;
      case 'biweekly':
        return `Every 2 weeks${day_of_week !== null && day_of_week !== undefined ? ` on ${DAYS_OF_WEEK[day_of_week]}` : ''}`;
      case 'monthly':
        const day = day_of_month || 1;
        const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
        return `Every ${recurrence_interval} month${recurrence_interval > 1 ? 's' : ''} on the ${day}${suffix}`;
      default:
        return recurrence_pattern;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading recurring appointments...</div>
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
            {isStaff ? 'Manage Recurring Appointments' : 'Recurring Appointments'}
          </h1>
          <p className="text-secondary-600 mt-2">
            {isStaff 
              ? 'View and manage all patient recurring appointment schedules'
              : 'View your recurring appointment schedules'}
          </p>
        </div>
        {isStaff && (
          <Link
            href="/recurring-appointments/book"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create Recurring Appointment
          </Link>
        )}
      </div>

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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {recurringAppointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-secondary-200">
          <p className="text-secondary-600 mb-4">
            {isStaff 
              ? 'No recurring appointments scheduled.'
              : 'No recurring appointments scheduled for you. Please contact your dentist to set up recurring appointments.'}
          </p>
          {isStaff && (
            <Link
              href="/recurring-appointments/book"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Recurring Appointment
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recurringAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-lg shadow-md p-6 border border-secondary-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  {isStaff && (appointment.first_name || appointment.last_name) && (
                    <div className="mb-3 pb-3 border-b border-secondary-200">
                      <p className="text-sm font-semibold text-primary-700">
                        Patient: {appointment.first_name} {appointment.last_name}
                      </p>
                      {appointment.email && (
                        <p className="text-xs text-secondary-500">{appointment.email}</p>
                      )}
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-primary-700 mb-2">
                    {appointment.service_name || 'General Appointment'}
                  </h3>
                  <div className="space-y-1 text-sm text-secondary-600">
                    <p>
                      <span className="font-medium">Schedule:</span> {getRecurrenceDescription(appointment)}
                    </p>
                    <p>
                      <span className="font-medium">Time:</span> {formatTime(appointment.time_slot)}
                    </p>
                    <p>
                      <span className="font-medium">Duration:</span> {appointment.duration} minutes
                    </p>
                    <p>
                      <span className="font-medium">Starts:</span> {formatDate(appointment.start_date)}
                    </p>
                    {appointment.end_date && (
                      <p>
                        <span className="font-medium">Ends:</span> {formatDate(appointment.end_date)}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    appointment.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {appointment.status}
                </span>
              </div>

              {appointment.notes && (
                <p className="text-sm text-secondary-600 mb-4 border-t border-secondary-200 pt-4">
                  <span className="font-medium">Notes:</span> {appointment.notes}
                </p>
              )}

              {isStaff && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleDelete(appointment.id)}
                    className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

