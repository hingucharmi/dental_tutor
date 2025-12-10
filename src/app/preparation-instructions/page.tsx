'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/utils/apiClient';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

interface Service {
  id: number;
  name: string;
  category: string;
}

interface Instruction {
  id: number;
  service_id: number;
  title: string;
  content: string;
  step_number: number;
  display_order?: number;
}

export default function PreparationInstructionsPage() {
  const { t } = useTranslation();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingInstructions, setLoadingInstructions] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedServiceId) {
      fetchInstructions(selectedServiceId);
    } else {
      setInstructions([]);
    }
  }, [selectedServiceId]);

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const response = await apiClient.get('/api/services');
      if (response.data.success) {
        setServices(response.data.data.services);
        // If services exist, select the first one by default
        if (response.data.data.services.length > 0) {
          setSelectedServiceId(response.data.data.services[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchInstructions = async (serviceId: number) => {
    try {
      setLoadingInstructions(true);
      const response = await apiClient.get(`/api/preparation-instructions?serviceId=${serviceId}`);
      if (response.data.success) {
        setInstructions(response.data.data.instructions);
      }
    } catch (error) {
      console.error('Error fetching instructions:', error);
    } finally {
      setLoadingInstructions(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-700 mb-2">
          {t('common.preparationInstructions', 'Preparation Instructions')}
        </h1>
        <p className="text-secondary-600">
          {t('preparation.description', 'Find out how to prepare for your upcoming dental visit.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar - Service Selection */}
        <div className="md:col-span-1 space-y-4">
          <h2 className="font-semibold text-primary-800 border-b border-secondary-200 pb-2">
            Select Procedure
          </h2>
          {loadingServices ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-secondary-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                    selectedServiceId === service.id
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white text-secondary-700 hover:bg-secondary-50 border border-secondary-200'
                  }`}
                >
                  {service.name}
                </button>
              ))}
              {services.length === 0 && (
                <p className="text-secondary-500 text-sm italic">No procedures found.</p>
              )}
            </div>
          )}
        </div>

        {/* Main Content - Instructions */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow-md border border-secondary-200 p-6 min-h-[400px]">
            {loadingInstructions ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="text-secondary-500">Loading instructions...</p>
              </div>
            ) : selectedServiceId ? (
              <>
                <h2 className="text-2xl font-bold text-primary-700 mb-6 flex items-center">
                  {services.find(s => s.id === selectedServiceId)?.name}
                  <span className="ml-3 text-sm font-normal text-secondary-500 bg-secondary-100 px-3 py-1 rounded-full">
                    Pre-visit Guide
                  </span>
                </h2>
                
                {instructions.length > 0 ? (
                  <div className="space-y-6">
                    {instructions.map((instruction, index) => (
                      <div key={instruction.id} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                            {instruction.step_number || index + 1}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {instruction.title}
                          </h3>
                          <p className="text-secondary-600 leading-relaxed">
                            {instruction.content}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 flex items-start">
                      <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>
                        If you have any questions about these instructions, please contact our office at least 24 hours before your appointment.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-secondary-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg text-secondary-600 font-medium">No specific instructions available.</p>
                    <p className="text-secondary-500 mt-2">Please arrive 15 minutes early for your appointment.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-secondary-500">
                <p>Select a procedure from the menu to view instructions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

