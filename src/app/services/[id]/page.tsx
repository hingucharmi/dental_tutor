'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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

export default function ServiceDetailPage() {
  const params = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchService();
    }
  }, [params.id]);

  const fetchService = async () => {
    try {
      const response = await axios.get(`/api/services/${params.id}`);
      if (response.data.success) {
        setService(response.data.data.service);
      }
    } catch (error) {
      console.error('Error fetching service:', error);
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

  if (!service) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-600 mb-4">Service not found</p>
        <Link href="/services" className="text-primary-600 hover:text-primary-700">
          Back to Services
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/services" className="text-primary-600 hover:text-primary-700">
        ← Back to Services
      </Link>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="heading-responsive font-bold text-primary-700 mb-4">
          {service.name}
        </h1>

        {service.category && (
          <span className="inline-block mb-4 px-3 py-1 bg-primary-100 text-primary-700 rounded">
            {service.category}
          </span>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <div>
            <h3 className="font-semibold text-secondary-700 mb-2">Duration</h3>
            <p className="text-secondary-600">{service.duration} minutes</p>
          </div>
          {service.basePrice && (
            <div>
              <h3 className="font-semibold text-secondary-700 mb-2">Price</h3>
              <p className="text-2xl font-bold text-primary-600">${service.basePrice}</p>
            </div>
          )}
        </div>

        {service.description && (
          <div className="mt-6">
            <h3 className="font-semibold text-secondary-700 mb-2">Description</h3>
            <p className="text-secondary-600 whitespace-pre-line">{service.description}</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-secondary-200">
          <Link
            href={`/appointments/book?serviceId=${service.id}`}
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Book Appointment
          </Link>
        </div>
      </div>
    </div>
  );
}

