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
      <div>
        <h1 className="heading-responsive font-bold text-primary-700 mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-secondary-600">
          Find answers to common questions about our services
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search FAQs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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

      <div className="space-y-4">
        {faqs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-secondary-200">
            <p className="text-secondary-600">No FAQs found</p>
          </div>
        ) : (
          faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white rounded-lg shadow-md p-6 border border-secondary-200"
            >
              <h3 className="text-lg font-semibold text-primary-700 mb-2">
                {faq.question}
              </h3>
              <p className="text-secondary-600 whitespace-pre-line">{faq.answer}</p>
              {faq.category && (
                <span className="inline-block mt-3 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded">
                  {faq.category}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}


