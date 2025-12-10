'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/utils/apiClient';
import { useTranslation } from 'react-i18next';

interface CareInstruction {
  id: number;
  treatment_type: string;
  title: string;
  content: string;
  display_order?: number;
}

export default function CareInstructionsPage() {
  const { t } = useTranslation();
  const [instructions, setInstructions] = useState<CareInstruction[]>([]);
  const [treatmentTypes, setTreatmentTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstructions();
  }, []);

  useEffect(() => {
    if (treatmentTypes.length > 0 && !selectedType) {
      setSelectedType(treatmentTypes[0]);
    }
  }, [treatmentTypes, selectedType]);

  const fetchInstructions = async () => {
    try {
      setLoading(true);
      // Fetch all instructions
      const response = await apiClient.get('/api/care-instructions');
      if (response.data.success) {
        const allInstructions = response.data.data.instructions as CareInstruction[];
        setInstructions(allInstructions);
        
        // Extract unique treatment types
        const types = Array.from(new Set(allInstructions.map(i => i.treatment_type))).sort();
        setTreatmentTypes(types);
      }
    } catch (error) {
      console.error('Error fetching care instructions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstructions = selectedType
    ? instructions.filter(i => i.treatment_type === selectedType)
    : [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-700 mb-2">
          {t('common.careInstructions', 'Post-Treatment Care')}
        </h1>
        <p className="text-secondary-600">
          {t('care.description', 'Essential care guidelines to follow after your dental procedures.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar - Treatment Types */}
        <div className="md:col-span-1 space-y-4">
          <h2 className="font-semibold text-primary-800 border-b border-secondary-200 pb-2">
            Treatments
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-secondary-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {treatmentTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm font-medium capitalize ${
                    selectedType === type
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white text-secondary-700 hover:bg-secondary-50 border border-secondary-200'
                  }`}
                >
                  {type.replace(/-/g, ' ')}
                </button>
              ))}
              {treatmentTypes.length === 0 && (
                <p className="text-secondary-500 text-sm italic">No care instructions found.</p>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow-md border border-secondary-200 p-6 min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="text-secondary-500">Loading instructions...</p>
              </div>
            ) : selectedType ? (
              <>
                <h2 className="text-2xl font-bold text-primary-700 mb-6 flex items-center capitalize">
                  {selectedType.replace(/-/g, ' ')}
                  <span className="ml-3 text-sm font-normal text-secondary-500 bg-secondary-100 px-3 py-1 rounded-full">
                    Care Guide
                  </span>
                </h2>
                
                <div className="space-y-8">
                  {filteredInstructions.map((instruction) => (
                    <div key={instruction.id} className="border-b border-secondary-100 last:border-0 pb-6 last:pb-0">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-start">
                        <svg className="w-6 h-6 text-primary-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {instruction.title}
                      </h3>
                      <div className="prose prose-blue text-secondary-600 pl-8">
                        <p>{instruction.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-secondary-200">
                  <div className="bg-orange-50 text-orange-800 p-4 rounded-lg flex items-start">
                    <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="font-bold mb-1">Emergency Warning</p>
                      <p className="text-sm">
                        If you experience severe pain, excessive bleeding, or signs of infection (fever, swelling) that persist despite following these instructions, please contact our emergency line immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-secondary-500">
                <p>Select a treatment type from the menu to view care instructions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

