'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';

export default function PrescriptionsPage() {
  const { user, loading: authLoading } = useAuth(true);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchPrescriptions();
    }
  }, [authLoading, user]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/prescriptions');
      if (response.data.success) {
        setPrescriptions(response.data.data.prescriptions || []);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading prescriptions...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="heading-responsive font-bold text-primary-700">
          My Prescriptions
        </h1>
        <p className="text-secondary-600 mt-2">
          View your prescription history and request refills
        </p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-secondary-600">No prescriptions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="bg-white rounded-lg shadow-md p-6 border border-secondary-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-primary-700">
                    {prescription.medication_name}
                  </h3>
                  <p className="text-sm text-secondary-600">
                    {prescription.dosage} - {prescription.frequency}
                  </p>
                  <p className="text-sm text-secondary-500">
                    Prescribed: {new Date(prescription.prescribed_date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    prescription.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {prescription.status}
                </span>
              </div>

              {prescription.refills_remaining > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-secondary-600 mb-2">
                    Refills remaining: {prescription.refills_remaining}
                  </p>
                  <Link
                    href={`/prescriptions/${prescription.id}/refill`}
                    className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    Request Refill
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

