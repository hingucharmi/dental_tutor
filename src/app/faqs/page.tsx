'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/utils/apiClient';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, [selectedCategory]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await apiClient.get('/api/faqs', { params });
      if (response.data.success) {
        setFaqs(response.data.data.faqs || []);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        fetchFAQs();
      } else {
        fetchFAQs();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const categories = ['all', 'general', 'appointments', 'insurance', 'payment', 'emergency'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading FAQs...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="heading-responsive font-bold text-primary-700 mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-secondary-600">
          Find answers to common questions about our services
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors font-medium ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* FAQs List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-secondary-600">Loading FAQs...</div>
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-secondary-200">
            <svg
              className="mx-auto h-12 w-12 text-secondary-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-secondary-600 text-lg">No FAQs found</p>
            <p className="text-secondary-500 text-sm mt-2">Try adjusting your search or filter</p>
          </div>
        ) : (
            faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-secondary-200 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full p-6 text-left flex justify-between items-start gap-4 hover:bg-gradient-to-r hover:from-primary-50 hover:to-blue-50 transition-colors group"
                >
                  <div className="flex-1 flex items-start gap-4">
                    {/* Question Badge */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform">
                      Q
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-primary-800 mb-2 leading-snug group-hover:text-primary-900 transition-colors">
                        {faq.question}
                      </h3>
                      
                      {/* Answer Section */}
                      {expandedFaq === faq.id && (
                        <div className="mt-4 pt-4 border-t border-secondary-200 animate-fadeIn">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                              A
                            </div>
                            <div className="flex-1">
                              <p className="text-secondary-700 whitespace-pre-line leading-relaxed text-base">
                                {faq.answer}
                              </p>
                              {faq.category && (
                                <span className="inline-block mt-4 px-3 py-1.5 bg-gradient-to-r from-primary-100 to-blue-100 text-primary-700 text-xs font-semibold rounded-full border border-primary-200">
                                  {faq.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Expand/Collapse Icon */}
                  <div className="flex-shrink-0 pt-1">
                    <svg
                      className={`w-6 h-6 text-primary-500 transition-transform duration-300 ${
                        expandedFaq === faq.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
              </div>
            ))
        )}
      </div>
    </div>
  );
}


