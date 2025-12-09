'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import apiClient from '@/lib/utils/apiClient';

interface Service {
  id: number;
  name: string;
  duration: number;
}

interface Dentist {
  id: number;
  name: string;
  specialization?: string;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function BookRecurringAppointmentPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(true);
  const [services, setServices] = useState<Service[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStaff = user?.role === 'admin' || user?.role === 'staff' || user?.role === 'dentist';

  const [formData, setFormData] = useState({
    userId: '',
    serviceId: '',
    dentistId: '',
    recurrencePattern: 'monthly' as 'daily' | 'weekly' | 'biweekly' | 'monthly',
    recurrenceInterval: 1,
    dayOfWeek: '',
    dayOfMonth: '',
    startDate: '',
    endDate: '',
    timeSlot: '09:00',
    duration: 30,
    notes: '',
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchServices();
      fetchDentists();
      if (isStaff) {
        fetchPatients();
      }
    }
  }, [authLoading, user]);

  const fetchServices = async () => {
    try {
      const response = await apiClient.get('/api/services');
      if (response.data.success) {
        setServices(response.data.data.services || []);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchDentists = async () => {
    try {
      const response = await apiClient.get('/api/dentists');
      if (response.data.success) {
        setDentists(response.data.data.dentists || []);
      }
    } catch (err) {
      console.error('Error fetching dentists:', err);
    }
  };

  const fetchPatients = async () => {
    try {
      // Fetch all users and filter for patients
      // Note: You may need to create a /api/users endpoint or use an existing one
      // For now, we'll use a workaround - fetch from appointments or create a simple query
      const response = await apiClient.get('/api/appointments/upcoming');
      // Extract unique patients from appointments
      // This is a temporary solution - ideally you'd have a /api/users?role=patient endpoint
      const patientsSet = new Set<number>();
      const patientsList: Patient[] = [];
      
      // Alternative: Query database directly via a custom endpoint
      // For now, we'll make userId optional and let doctors enter it manually or via search
      // In production, you'd want a proper patients API endpoint
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        recurrencePattern: formData.recurrencePattern,
        recurrenceInterval: formData.recurrenceInterval,
        startDate: formData.startDate,
        duration: formData.duration,
      };

      // For staff, include userId if provided
      if (isStaff && formData.userId) {
        payload.userId = parseInt(formData.userId);
      }

      if (formData.serviceId) {
        payload.serviceId = parseInt(formData.serviceId);
      }

      if (formData.dentistId) {
        payload.dentistId = parseInt(formData.dentistId);
      }

      if (formData.recurrencePattern === 'weekly' || formData.recurrencePattern === 'biweekly') {
        if (formData.dayOfWeek) {
          payload.dayOfWeek = parseInt(formData.dayOfWeek);
        }
      }

      if (formData.recurrencePattern === 'monthly') {
        if (formData.dayOfMonth) {
          payload.dayOfMonth = parseInt(formData.dayOfMonth);
        }
      }

      if (formData.endDate) {
        payload.endDate = formData.endDate;
      }

      if (formData.timeSlot) {
        payload.timeSlot = formData.timeSlot;
      }

      if (formData.notes) {
        payload.notes = formData.notes;
      }

      const response = await apiClient.post('/api/recurring-appointments', payload);

      if (response.data.success) {
        router.push('/recurring-appointments?success=true');
      } else {
        setError(response.data.error || 'Failed to create recurring appointment');
      }
    } catch (err: any) {
      console.error('Error creating recurring appointment:', err);
      setError(err.response?.data?.error || 'Failed to create recurring appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setFormData({ ...formData, serviceId });
    if (serviceId) {
      const service = services.find(s => s.id === parseInt(serviceId));
      if (service) {
        setFormData(prev => ({ ...prev, duration: service.duration }));
      }
    }
  };

  // Generate time slots (9 AM to 5 PM, 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <Link
          href="/recurring-appointments"
          className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Recurring Appointments
        </Link>
        <h1 className="heading-responsive font-bold text-primary-700">
          Create Recurring Appointment
        </h1>
        <p className="text-secondary-600 mt-2">
          Set up a recurring appointment schedule
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {isStaff && (
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-secondary-700 mb-2">
              Patient User ID *
            </label>
            <input
              type="number"
              id="userId"
              required={isStaff}
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter patient user ID"
            />
            <p className="text-xs text-secondary-500 mt-1">
              Enter the patient's user ID to create a recurring appointment for them
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="serviceId" className="block text-sm font-medium text-secondary-700 mb-2">
              Service (Optional)
            </label>
            <select
              id="serviceId"
              value={formData.serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.duration} min)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dentistId" className="block text-sm font-medium text-secondary-700 mb-2">
              Preferred Dentist (Optional)
            </label>
            <select
              id="dentistId"
              value={formData.dentistId}
              onChange={(e) => setFormData({ ...formData, dentistId: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Any available dentist</option>
              {dentists.map((dentist) => (
                <option key={dentist.id} value={dentist.id}>
                  {dentist.name} {dentist.specialization ? `- ${dentist.specialization}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="recurrencePattern" className="block text-sm font-medium text-secondary-700 mb-2">
              Recurrence Pattern *
            </label>
            <select
              id="recurrencePattern"
              required
              value={formData.recurrencePattern}
              onChange={(e) => setFormData({ 
                ...formData, 
                recurrencePattern: e.target.value as any,
                dayOfWeek: '',
                dayOfMonth: '',
              })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label htmlFor="recurrenceInterval" className="block text-sm font-medium text-secondary-700 mb-2">
              Interval *
            </label>
            <input
              type="number"
              id="recurrenceInterval"
              required
              min="1"
              value={formData.recurrenceInterval}
              onChange={(e) => setFormData({ ...formData, recurrenceInterval: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="1"
            />
            <p className="text-xs text-secondary-500 mt-1">
              {formData.recurrencePattern === 'daily' && 'Repeat every X days'}
              {formData.recurrencePattern === 'weekly' && 'Repeat every X weeks'}
              {formData.recurrencePattern === 'biweekly' && 'Repeat every 2 weeks'}
              {formData.recurrencePattern === 'monthly' && 'Repeat every X months'}
            </p>
          </div>
        </div>

        {(formData.recurrencePattern === 'weekly' || formData.recurrencePattern === 'biweekly') && (
          <div>
            <label htmlFor="dayOfWeek" className="block text-sm font-medium text-secondary-700 mb-2">
              Day of Week *
            </label>
            <select
              id="dayOfWeek"
              required
              value={formData.dayOfWeek}
              onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select day</option>
              {DAYS_OF_WEEK.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {formData.recurrencePattern === 'monthly' && (
          <div>
            <label htmlFor="dayOfMonth" className="block text-sm font-medium text-secondary-700 mb-2">
              Day of Month *
            </label>
            <input
              type="number"
              id="dayOfMonth"
              required
              min="1"
              max="31"
              value={formData.dayOfMonth}
              onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="1-31"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-secondary-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-secondary-700 mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              id="endDate"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              min={formData.startDate || new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-secondary-500 mt-1">
              Leave empty for indefinite recurrence
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="timeSlot" className="block text-sm font-medium text-secondary-700 mb-2">
              Preferred Time *
            </label>
            <select
              id="timeSlot"
              required
              value={formData.timeSlot}
              onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {timeSlots.map((slot) => {
                const [hours, minutes] = slot.split(':');
                const hour = parseInt(hours);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour % 12 || 12;
                const displayTime = `${displayHour}:${minutes} ${ampm}`;
                return (
                  <option key={slot} value={slot}>
                    {displayTime}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-secondary-700 mb-2">
              Duration (minutes) *
            </label>
            <input
              type="number"
              id="duration"
              required
              min="15"
              step="15"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-secondary-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Any special instructions or notes..."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Link
            href="/recurring-appointments"
            className="px-6 py-3 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Recurring Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}

