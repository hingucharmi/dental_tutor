'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import axios from 'axios';

// Slots are returned as strings (time strings like "09:00")
type AvailableSlot = string;

export default function RescheduleAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth(true);
  const [appointment, setAppointment] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    appointmentDate: '',
    appointmentTime: '',
  });

  const appointmentId = params.id as string;

  useEffect(() => {
    if (!authLoading && user && appointmentId) {
      fetchAppointment();
    }
  }, [authLoading, user, appointmentId]);

  useEffect(() => {
    if (formData.appointmentDate) {
      fetchAvailableSlots();
    }
  }, [formData.appointmentDate]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/appointments/${appointmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const apt = response.data.data.appointment;
        setAppointment(apt);
        
        // Normalize date to YYYY-MM-DD format
        const appointmentDate = apt.appointmentDate;
        let normalizedDate = appointmentDate;
        
        // If date is in ISO format or has time, extract just the date part
        if (appointmentDate.includes('T')) {
          normalizedDate = appointmentDate.split('T')[0];
        } else if (appointmentDate.includes(' ')) {
          normalizedDate = appointmentDate.split(' ')[0];
        }
        
        setFormData({
          appointmentDate: normalizedDate,
          appointmentTime: apt.appointmentTime,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load appointment');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!formData.appointmentDate) {
      setAvailableSlots([]);
      return;
    }

    try {
      setSlotsLoading(true);
      setError(null);
      
      // Normalize date to YYYY-MM-DD format before sending
      let dateToSend = formData.appointmentDate;
      if (dateToSend.includes('T')) {
        dateToSend = dateToSend.split('T')[0];
      } else if (dateToSend.includes(' ')) {
        dateToSend = dateToSend.split(' ')[0];
      }
      
      console.log('Fetching slots for date:', dateToSend);
      
      const response = await axios.get('/api/appointments/slots', {
        params: { date: dateToSend },
      });

      console.log('Slots API response:', response.data);

      if (response.data.success) {
        const slots = response.data.data.slots || [];
        // Ensure slots are strings (API returns array of time strings)
        const slotStrings = slots.map((slot: any) => {
          if (typeof slot === 'string') return slot;
          if (slot && typeof slot === 'object' && slot.time) return slot.time;
          return String(slot);
        });
        console.log('Available slots:', slotStrings.length, slotStrings);
        setAvailableSlots(slotStrings);
        if (slotStrings.length === 0) {
          setError(response.data.data.message || 'No available slots for this date. Please select another date.');
        } else {
          setError(null); // Clear error if slots are found
        }
      } else {
        setError(response.data.error || 'Failed to load available slots');
        setAvailableSlots([]);
      }
    } catch (err: any) {
      console.error('Error fetching slots:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load available slots';
      setError(errorMsg);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.appointmentDate || !formData.appointmentTime) {
      setError('Please select a new date and time');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `/api/appointments/${appointmentId}/reschedule`,
        {
          appointmentDate: formData.appointmentDate,
          appointmentTime: formData.appointmentTime,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        router.push('/appointments?rescheduled=true');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reschedule appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading...</div>
      </div>
    );
  }

  if (!user || !appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-600 mb-4">Appointment not found</p>
        <Link href="/appointments" className="text-primary-600 hover:text-primary-700">
          Back to Appointments
        </Link>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link href="/appointments" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
          ← Back to Appointments
        </Link>
        <h1 className="heading-responsive font-bold text-primary-700 mb-4">
          Reschedule Appointment
        </h1>
        <p className="text-secondary-600">
          Current appointment: {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="appointmentDate" className="block text-sm font-medium text-secondary-700 mb-2">
            New Date *
          </label>
          <input
            type="date"
            id="appointmentDate"
            value={formData.appointmentDate}
            onChange={(e) => {
              // Ensure date is in YYYY-MM-DD format
              let dateValue = e.target.value;
              if (dateValue.includes('T')) {
                dateValue = dateValue.split('T')[0];
              }
              setFormData({ ...formData, appointmentDate: dateValue, appointmentTime: '' });
            }}
            min={today}
            max={maxDateStr}
            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>

        {formData.appointmentDate && (
          <div>
            <label htmlFor="appointmentTime" className="block text-sm font-medium text-secondary-700 mb-2">
              Available Time Slots *
            </label>
            {slotsLoading ? (
              <div className="text-secondary-600 py-4 flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading available slots...
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-secondary-600 py-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4">
                <p className="font-medium text-yellow-800 mb-1">No available slots</p>
                <p className="text-sm text-yellow-700">
                  {error || 'No available slots for this date. Please select another date.'}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-secondary-600 mb-3">
                  Select a time slot ({availableSlots.length} available)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {availableSlots.map((slot) => {
                    const slotTime = typeof slot === 'string' ? slot : (slot as any).time || String(slot);
                    return (
                      <button
                        key={slotTime}
                        type="button"
                        onClick={() => setFormData({ ...formData, appointmentTime: slotTime })}
                        className={`px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${
                          formData.appointmentTime === slotTime
                            ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                            : 'bg-white text-secondary-700 border-secondary-300 hover:border-primary-500 hover:bg-primary-50'
                        }`}
                      >
                        {slotTime}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <Link
            href="/appointments"
            className="flex-1 px-6 py-3 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !formData.appointmentDate || !formData.appointmentTime}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Rescheduling...' : 'Reschedule Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}

