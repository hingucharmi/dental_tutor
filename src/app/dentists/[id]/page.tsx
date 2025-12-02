'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/utils/apiClient';

export default function DentistDetailPage() {
  const params = useParams();
  const dentistId = params.id as string;
  const [dentist, setDentist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dentistId) {
      fetchDentist();
    }
  }, [dentistId]);

  const fetchDentist = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/dentists/${dentistId}`);
      if (response.data.success) {
        setDentist(response.data.data.dentist);
      }
    } catch (error) {
      console.error('Error fetching dentist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading...</div>
      </div>
    );
  }

  if (!dentist) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-600 mb-4">Dentist not found</p>
        <Link href="/dentists" className="text-primary-600 hover:text-primary-700">
          Back to Dentists
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/dentists" className="text-primary-600 hover:text-primary-700">
        ← Back to Dentists
      </Link>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="heading-responsive font-bold text-primary-700 mb-4">
          {dentist.name}
        </h1>

        {dentist.specialization && (
          <p className="text-lg text-secondary-600 mb-4">{dentist.specialization}</p>
        )}

        <div className="flex items-center gap-2 mb-6">
          <span className="text-yellow-500 text-xl">★</span>
          <span className="text-lg font-medium">
            {dentist.averageRating.toFixed(1)} ({dentist.reviewCount} reviews)
          </span>
        </div>

        {dentist.bio && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-primary-700 mb-2">About</h2>
            <p className="text-secondary-600 whitespace-pre-line">{dentist.bio}</p>
          </div>
        )}

        {dentist.specialties && dentist.specialties.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-primary-700 mb-2">Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {dentist.specialties.map((spec: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}

        {dentist.education && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-primary-700 mb-2">Education</h2>
            <p className="text-secondary-600">{dentist.education}</p>
          </div>
        )}

        {dentist.yearsExperience && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-primary-700 mb-2">Experience</h2>
            <p className="text-secondary-600">{dentist.yearsExperience} years of experience</p>
          </div>
        )}

        {dentist.languages && dentist.languages.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-primary-700 mb-2">Languages</h2>
            <div className="flex flex-wrap gap-2">
              {dentist.languages.map((lang: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-secondary-200">
          <Link
            href="/appointments/book"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Book Appointment
          </Link>
        </div>
      </div>
    </div>
  );
}


