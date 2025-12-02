'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
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
}

export default function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';
  const isDentist = user?.role === 'dentist';
  const isPatient = user?.role === 'patient' || !user?.role;

  const getPageTitle = () => {
    if (isAdmin) return 'Manage Appointments';
    if (isDentist) return 'My Schedule';
    return 'My Appointments';
  };

  const getPageSubtitle = () => {
    if (isAdmin) return 'View and manage all patient appointments';
    if (isDentist) return 'View your scheduled appointments and patient visits';
    return 'Manage your dental appointments';
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchAppointments();
    }
  }, [authLoading, user, activeTab]);

  // Listen for appointment creation events
  useEffect(() => {
    const handleAppointmentCreated = () => {
      fetchAppointments();
    };

    window.addEventListener('appointment-created', handleAppointmentCreated);
    
    // Check for success query param
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      console.log('Success param detected, refreshing appointments...');
      // Small delay to ensure page is ready
      setTimeout(() => {
        fetchAppointments();
        // Remove query param from URL
        window.history.replaceState({}, '', '/appointments');
      }, 200);
    }

    return () => {
      window.removeEventListener('appointment-created', handleAppointmentCreated);
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
    if (!confirm('Are you sure you want to cancel this appointment?')) {
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
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel appointment');
    }
  };

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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading appointments...</div>
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
          <Link
            href="/appointments/book"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Book New Appointment
          </Link>
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
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-600 hover:text-primary-600'
          }`}
        >
          History
        </button>
      </div>

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
              ? 'No upcoming appointments scheduled.'
              : 'No appointment history found.'}
          </p>
          {activeTab === 'upcoming' && (
            <Link
              href="/appointments/book"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Book Your First Appointment
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-lg shadow-md p-6 border border-secondary-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-primary-700 mb-1">
                    {appointment.serviceName || 'General Appointment'}
                  </h3>
                  <p className="text-sm text-secondary-500">
                    {formatDate(appointment.appointmentDate)}
                  </p>
                  <p className="text-sm text-secondary-500">
                    {formatTime(appointment.appointmentTime)} ({appointment.duration} min)
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    appointment.status === 'scheduled'
                      ? 'bg-green-100 text-green-700'
                      : appointment.status === 'completed'
                      ? 'bg-blue-100 text-blue-700'
                      : appointment.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {appointment.status}
                </span>
              </div>

              {appointment.notes && (
                <p className="text-sm text-secondary-600 mb-4">{appointment.notes}</p>
              )}

              {activeTab === 'upcoming' && appointment.status === 'scheduled' && (
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/appointments/${appointment.id}/reschedule`}
                    className="flex-1 px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors text-center text-sm"
                  >
                    Reschedule
                  </Link>
                  <button
                    onClick={() => handleCancel(appointment.id)}
                    className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    Cancel
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

