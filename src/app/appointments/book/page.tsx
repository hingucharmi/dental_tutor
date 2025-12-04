'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import axios from 'axios';

interface Service {
  id: number;
  name: string;
  duration: number;
}

// Slots are returned as strings (time strings like "09:00")
type AvailableSlot = string;

export default function BookAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth(true);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<AvailableSlot[]>([]);
  const [allSlots, setAllSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get serviceId from URL params
  const serviceIdFromUrl = searchParams?.get('serviceId') || null;
  
  const [formData, setFormData] = useState({
    serviceId: serviceIdFromUrl || '',
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchServices();
    }
  }, [authLoading, user]);

  // Update serviceId when URL param changes
  useEffect(() => {
    if (serviceIdFromUrl) {
      setFormData(prev => ({ ...prev, serviceId: serviceIdFromUrl, appointmentTime: '' }));
    }
  }, [serviceIdFromUrl]);

  useEffect(() => {
    if (formData.appointmentDate) {
      fetchAvailableSlots();
    }
  }, [formData.appointmentDate, formData.serviceId]);

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/services');
      if (response.data.success) {
        setServices(response.data.data.services || []);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!formData.appointmentDate) {
      setAvailableSlots([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const params: any = { date: formData.appointmentDate };
      if (formData.serviceId) {
        params.serviceId = formData.serviceId;
      }

      console.log('Fetching slots for date:', formData.appointmentDate, 'params:', params);

      const response = await axios.get('/api/appointments/slots', {
        params,
        // Slots API doesn't require auth, but won't hurt to send it
      });

      console.log('Slots API response:', response.data);

      if (response.data.success) {
        const slots = response.data.data.slots || [];
        const booked = response.data.data.bookedSlots || [];
        const all = response.data.data.allSlots || [];
        
        console.log('Available slots:', slots.length, slots);
        console.log('Booked slots:', booked.length, booked);
        console.log('All slots:', all.length, all);
        
        // Ensure slots are strings (API returns array of time strings)
        const slotStrings = slots.map((slot: any) => {
          if (typeof slot === 'string') return slot;
          if (slot && typeof slot === 'object' && slot.time) return slot.time;
          return String(slot);
        });
        
        const bookedStrings = booked.map((slot: any) => {
          if (typeof slot === 'string') return slot;
          if (slot && typeof slot === 'object' && slot.time) return slot.time;
          return String(slot);
        });
        
        const allStrings = all.map((slot: any) => {
          if (typeof slot === 'string') return slot;
          if (slot && typeof slot === 'object' && slot.time) return slot.time;
          return String(slot);
        });
        
        setAvailableSlots(slotStrings);
        setBookedSlots(bookedStrings);
        setAllSlots(allStrings);
        
        if (slotStrings.length === 0 && allStrings.length === 0) {
          setError(response.data.data.message || 'No available slots for this date. Please select another date.');
        } else {
          setError(null); // Clear error if slots are found
        }
      } else {
        setError(response.data.error || 'Failed to load available slots');
        setAvailableSlots([]);
        setBookedSlots([]);
        setAllSlots([]);
      }
    } catch (err: any) {
      console.error('Error fetching slots:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load available slots';
      setError(errorMsg);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.serviceId || !formData.appointmentDate || !formData.appointmentTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const token = localStorage.getItem('token');

      // Validate serviceId before sending
      const serviceIdNum = parseInt(formData.serviceId);
      if (isNaN(serviceIdNum)) {
        setError('Please select a valid service');
        setSubmitting(false);
        return;
      }

      // Validate time format
      if (!/^\d{2}:\d{2}$/.test(formData.appointmentTime)) {
        setError('Invalid time format. Please select a time slot.');
        setSubmitting(false);
        return;
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.appointmentDate)) {
        setError('Invalid date format');
        setSubmitting(false);
        return;
      }

      const requestData = {
        serviceId: serviceIdNum,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        notes: formData.notes || undefined,
      };

      console.log('Submitting appointment:', requestData);

      const response = await axios.post(
        '/api/appointments',
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        console.log('Appointment booked successfully:', response.data.data.appointment);
        // Dispatch event to refresh appointments list
        window.dispatchEvent(new Event('appointment-created'));
        // Small delay to ensure event is processed
        setTimeout(() => {
          router.push('/appointments?success=true');
        }, 100);
      } else {
        const errorMsg = response.data.error || 'Failed to book appointment';
        console.error('Booking failed:', response.data);
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to book appointment';
      const errorDetails = err.response?.data?.details;
      
      if (errorDetails && Array.isArray(errorDetails)) {
        const detailMessages = errorDetails.map((d: any) => `${d.path?.join('.') || 'field'}: ${d.message}`).join(', ');
        setError(`${errorMsg} (${detailMessages})`);
      } else {
        setError(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

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

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  // Get maximum date (30 days from now)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="heading-responsive font-bold text-primary-700 mb-4">
          Book Appointment
        </h1>
        <p className="text-secondary-600">
          Select a service and choose an available time slot
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="serviceId" className="block text-sm font-medium text-secondary-700 mb-2">
            Service *
          </label>
          <select
            id="serviceId"
            value={formData.serviceId}
            onChange={(e) => setFormData({ ...formData, serviceId: e.target.value, appointmentTime: '' })}
            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50 disabled:cursor-not-allowed"
            required
            disabled={!!serviceIdFromUrl}
          >
            <option value="">Select a service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.duration} min)
              </option>
            ))}
          </select>
          {serviceIdFromUrl && (
            <p className="mt-1 text-sm text-secondary-500 flex items-center">
              <svg className="w-4 h-4 mr-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Service pre-selected from service page
            </p>
          )}
        </div>

        <div>
          <label htmlFor="appointmentDate" className="block text-sm font-medium text-secondary-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            id="appointmentDate"
            value={formData.appointmentDate}
            onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value, appointmentTime: '' })}
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
            {loading ? (
              <div className="text-secondary-600 py-4 flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading available slots...
              </div>
            ) : allSlots.length === 0 ? (
              <div className="text-secondary-600 py-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4">
                <p className="font-medium text-yellow-800 mb-1">No available slots</p>
                <p className="text-sm text-yellow-700">
                  {error || 'No available slots for this date. Please select another date.'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-3">
                  <p className="text-sm text-secondary-600">
                    Select a time slot ({availableSlots.length} available)
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-secondary-600">Available</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-secondary-600">Booked</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {allSlots.map((slot) => {
                    // Slots are always strings, but handle both cases for safety
                    const slotTime = typeof slot === 'string' ? slot : (slot as any).time || String(slot);
                    const isBooked = bookedSlots.includes(slotTime);
                    const isAvailable = availableSlots.includes(slotTime);
                    
                    return (
                      <button
                        key={slotTime}
                        type="button"
                        onClick={() => {
                          if (!isBooked && isAvailable) {
                            setFormData({ ...formData, appointmentTime: slotTime });
                          }
                        }}
                        disabled={isBooked}
                        className={`px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${
                          isBooked
                            ? 'bg-red-100 text-red-700 border-red-300 cursor-not-allowed opacity-75'
                            : formData.appointmentTime === slotTime
                            ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                            : 'bg-green-50 text-secondary-700 border-green-300 hover:border-primary-500 hover:bg-primary-50'
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

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-secondary-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Any special requests or information..."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !formData.serviceId || !formData.appointmentDate || !formData.appointmentTime}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}

