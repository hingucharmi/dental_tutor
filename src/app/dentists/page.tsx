'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import apiClient from '@/lib/utils/apiClient';

interface Dentist {
  id: number;
  name: string;
  specialization?: string;
  bio?: string;
  specialties?: string[];
  averageRating: number;
  reviewCount: number;
}

export default function DentistsPage() {
  const { t, i18n } = useTranslation();
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');

  useEffect(() => {
    fetchDentists();
  }, [selectedSpecialization]);

  const fetchDentists = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedSpecialization !== 'all') {
        params.specialization = selectedSpecialization;
      }

      const response = await apiClient.get('/api/dentists', { params });
      if (response.data.success) {
        setDentists(response.data.data.dentists || []);
      }
    } catch (error) {
      console.error('Error fetching dentists:', error);
    } finally {
      setLoading(false);
    }
  };

  const specializations = ['all', 'general', 'orthodontics', 'oral_surgery', 'pediatric', 'cosmetic'];

  const getSpecializationLabel = (spec: string) => {
    if (spec === 'all') return t('common.all');
    return t(`dentists.specialization.${spec}`, spec.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-responsive font-bold text-primary-700 mb-4">
          {t('dentists.title')}
        </h1>
        <p className="text-secondary-600">
          {t('dentists.subtitle')}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {specializations.map((spec) => (
          <button
            key={spec}
            onClick={() => setSelectedSpecialization(spec)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedSpecialization === spec
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            {getSpecializationLabel(spec)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dentists.map((dentist) => (
          <Link
            key={dentist.id}
            href={`/dentists/${dentist.id}`}
            className="bg-white rounded-lg shadow-md p-6 border border-secondary-200 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2 text-primary-700">
              {dentist.name}
            </h2>
            {dentist.specialization && (
              <p className="text-sm text-secondary-600 mb-2">{dentist.specialization}</p>
            )}
            {dentist.bio && (
              <p className="text-sm text-secondary-600 mb-4 line-clamp-2">{dentist.bio}</p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">★</span>
              <span className="text-sm font-medium">
                {dentist.averageRating.toFixed(1)} ({dentist.reviewCount} {t('dentists.reviews', 'reviews')})
              </span>
            </div>
          </Link>
        ))}
      </div>

      {dentists.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-secondary-200">
          <p className="text-secondary-600">{t('dentists.noDentists')}</p>
        </div>
      )}
    </div>
  );
}


