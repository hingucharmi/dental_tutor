'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/utils/apiClient';

export default function OfficePage() {
  const [office, setOffice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOfficeInfo();
  }, []);

  const fetchOfficeInfo = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/office');
      if (response.data.success) {
        setOffice(response.data.data.office);
      }
    } catch (error) {
      console.error('Error fetching office info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading office information...</div>
      </div>
    );
  }

  if (!office) {
    return null;
  }

  const formatHours = (hours: any) => {
    if (!hours) return 'Closed';
    return `${hours.start} - ${hours.end}`;
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="heading-responsive font-bold text-primary-700">
          Office Information
        </h1>
        <p className="text-secondary-600 mt-2">
          Location, hours, and contact information
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">{office.name}</h2>
          <div className="space-y-2 text-secondary-600">
            <p>{office.address}</p>
            <p>
              {office.city}, {office.state} {office.zipCode}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-secondary-200">
          <div>
            <h3 className="font-semibold text-primary-700 mb-3">Contact</h3>
            <div className="space-y-2 text-secondary-600">
              {office.phone && <p>Phone: {office.phone}</p>}
              {office.email && <p>Email: {office.email}</p>}
            </div>
          </div>

          {office.parkingInfo && (
            <div>
              <h3 className="font-semibold text-primary-700 mb-3">Parking</h3>
              <p className="text-secondary-600">{office.parkingInfo}</p>
            </div>
          )}
        </div>

        {office.officeHours && (
          <div className="pt-6 border-t border-secondary-200">
            <h3 className="font-semibold text-primary-700 mb-4">Office Hours</h3>
            <div className="space-y-2">
              {days.map((day) => (
                <div key={day} className="flex justify-between">
                  <span className="font-medium text-secondary-700 capitalize">{day}:</span>
                  <span className="text-secondary-600">
                    {formatHours(office.officeHours[day])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {office.latitude && office.longitude && (
          <div className="pt-6 border-t border-secondary-200">
            <h3 className="font-semibold text-primary-700 mb-4">Location</h3>
            <div className="aspect-video bg-secondary-100 rounded-lg flex items-center justify-center">
              <a
                href={`https://www.google.com/maps?q=${office.latitude},${office.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                View on Google Maps
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


