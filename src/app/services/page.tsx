'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import axios from 'axios';

interface Service {
  id: number;
  name: string;
  description?: string;
  duration: number;
  basePrice?: number;
  category?: string;
}

export default function ServicesPage() {
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchServices();
  }, [selectedCategory]);

  const fetchServices = async () => {
    try {
      const url = selectedCategory === 'all'
        ? '/api/services'
        : `/api/services?category=${selectedCategory}`;
      const response = await axios.get(url);
      if (response.data.success) {
        setServices(response.data.data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = ['all', 'preventive', 'restorative', 'cosmetic', 'surgery'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">{t('common.loading')}</div>
      </div>
    );
  }

  const getCategoryLabel = (category: string) => {
    if (category === 'all') return t('common.all');
    return t(`services.category.${category}`, category.charAt(0).toUpperCase() + category.slice(1));
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl p-8 md:p-12 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <h1 className="heading-responsive font-bold mb-4">
            {t('services.title')}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl">
            {t('services.subtitle')}
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder={t('services.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <Link
            key={service.id}
            href={`/services/${service.id}`}
            className="group p-6 bg-white rounded-xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-secondary-200 overflow-hidden relative"
          >
            {/* Decorative gradient overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100 to-blue-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-75 transition-opacity"></div>
            
            {/* Service Icon */}
            <div className="relative z-10 w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold mb-2 text-primary-700 relative z-10">
              {service.name}
            </h2>
            <p className="text-secondary-600 mb-4 line-clamp-2 relative z-10">
              {service.description || t('services.noDescription')}
            </p>
            <div className="flex justify-between items-center relative z-10">
              <span className="text-sm text-secondary-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {service.duration} {t('common.minutes', 'min')}
              </span>
              {service.basePrice && (
                <span className="text-lg font-semibold text-primary-600">
                  ${service.basePrice}
                </span>
              )}
            </div>
            {service.category && (
              <span className="inline-block mt-3 px-3 py-1 text-xs font-medium bg-gradient-to-r from-primary-100 to-blue-100 text-primary-700 rounded-full relative z-10">
                {service.category}
              </span>
            )}
          </Link>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-secondary-600">{t('services.noServices')}</p>
        </div>
      )}
    </div>
  );
}

