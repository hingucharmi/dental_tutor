'use client';

import { useEffect, useState } from 'react';
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
        <div className="text-secondary-600">Loading services...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-responsive font-bold text-primary-700 mb-4">
          Our Services
        </h1>
        <p className="text-secondary-600">
          Explore our comprehensive dental care services
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search services..."
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
              {category.charAt(0).toUpperCase() + category.slice(1)}
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
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-secondary-200"
          >
            <h2 className="text-xl font-semibold mb-2 text-primary-700">
              {service.name}
            </h2>
            <p className="text-secondary-600 mb-4 line-clamp-2">
              {service.description || 'No description available'}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-secondary-500">
                Duration: {service.duration} min
              </span>
              {service.basePrice && (
                <span className="text-lg font-semibold text-primary-600">
                  ${service.basePrice}
                </span>
              )}
            </div>
            {service.category && (
              <span className="inline-block mt-2 px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                {service.category}
              </span>
            )}
          </Link>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-secondary-600">No services found matching your search.</p>
        </div>
      )}
    </div>
  );
}

