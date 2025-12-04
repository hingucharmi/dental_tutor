'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/utils/apiClient';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

interface OfficeInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  latitude?: number | null;
  longitude?: number | null;
  country?: string;
}

interface EmergencyContact {
  name: string;
  phone: string;
  email?: string;
  description?: string;
}

// Google Maps Component
function OfficeMap({ office }: { office: OfficeInfo }) {
  const fullAddress = `${office.address}, ${office.city}, ${office.state} ${office.zipCode}${office.country ? `, ${office.country}` : ''}`;
  
  // Build Google Maps embed URL
  // Using Google Maps Embed API - works without API key for basic usage
  const getMapUrl = () => {
    // If we have coordinates, use them (more accurate)
    if (office.latitude && office.longitude) {
      return `https://www.google.com/maps?q=${office.latitude},${office.longitude}&hl=en&z=15&output=embed`;
    }
    // Otherwise use address search
    return `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&hl=en&z=15&output=embed`;
  };

  return (
    <iframe
      width="100%"
      height="100%"
      style={{ border: 0 }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={getMapUrl()}
      title={`${office.name} Location Map`}
      className="w-full h-full"
    />
  );
}

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'contact' | 'faq'>('contact');
  const [office, setOffice] = useState<OfficeInfo | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    if (activeTab === 'contact') {
      fetchContactInfo();
    } else {
      fetchFAQs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'faq') {
      fetchFAQs();
    }
  }, [selectedCategory, searchTerm]);

  const fetchContactInfo = async () => {
    try {
      setLoading(true);
      // Fetch office info with coordinates
      const officeResponse = await apiClient.get('/api/office');
      if (officeResponse.data.success) {
        setOffice(officeResponse.data.data.office);
      }
      // Fetch emergency contacts
      try {
        const emergencyResponse = await apiClient.get('/api/emergency-contacts');
        if (emergencyResponse.data.success) {
          setEmergencyContacts(emergencyResponse.data.data.emergencyContacts || []);
        }
      } catch (err) {
        // Fallback to contact API if emergency-contacts doesn't exist
        const contactResponse = await apiClient.get('/api/contact');
        if (contactResponse.data.success) {
          setEmergencyContacts(contactResponse.data.data.emergencyContacts || []);
        }
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const response = await apiClient.post('/api/contact', formData);
      if (response.data.success) {
        alert(response.data.message || 'Thank you for contacting us! We will get back to you soon.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      }
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      alert(error.response?.data?.error || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['all', 'general', 'appointments', 'insurance', 'payment', 'emergency'];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="text-center">
        <h1 className="heading-responsive font-bold text-primary-700 mb-4">
          Support Center
        </h1>
        <p className="text-secondary-600 text-lg">
          We're here to help you with any questions or concerns
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 border-b border-secondary-200">
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'contact'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-600 hover:text-primary-600'
          }`}
        >
          Contact Us
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'faq'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-600 hover:text-primary-600'
          }`}
        >
          Frequently Asked Questions
        </button>
      </div>

      {/* Contact Us Tab */}
      {activeTab === 'contact' && (
        <div className="space-y-8">
          {/* Contact Form and Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-primary-700 mb-6">
              Send us a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-secondary-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-secondary-700 mb-1">
                  Message *
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-secondary-600">Loading contact information...</div>
              </div>
            ) : (
              <>
                {office && (
                  <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
                    <h2 className="text-2xl font-semibold text-primary-700 mb-4">
                      Office Information
                    </h2>
                    <div className="space-y-3 text-secondary-600">
                      <p className="font-semibold text-primary-700">{office.name}</p>
                      <p>{office.address}</p>
                      <p>
                        {office.city}, {office.state} {office.zipCode}
                      </p>
                      {office.phone && (
                        <p>
                          <span className="font-medium">Phone:</span>{' '}
                          <a href={`tel:${office.phone}`} className="text-primary-600 hover:underline">
                            {office.phone}
                          </a>
                        </p>
                      )}
                      {office.email && (
                        <p>
                          <span className="font-medium">Email:</span>{' '}
                          <a href={`mailto:${office.email}`} className="text-primary-600 hover:underline">
                            {office.email}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Map Section - Below Office Information */}
                {office && (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 sm:p-8 border-b border-secondary-200">
                      <h2 className="text-2xl font-semibold text-primary-700 mb-2">
                        Find Us
                      </h2>
                      <p className="text-secondary-600 text-sm">
                        Visit our clinic at the location shown on the map below
                      </p>
                    </div>
                    <div className="w-full h-[400px] bg-secondary-100 relative">
                      <OfficeMap office={office} />
                    </div>
                    <div className="p-4 bg-secondary-50 border-t border-secondary-200">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${office.address}, ${office.city}, ${office.state} ${office.zipCode}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                )}

                {emergencyContacts.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
                    <h2 className="text-2xl font-semibold text-primary-700 mb-4">
                      Emergency Contacts
                    </h2>
                    <div className="space-y-3">
                      {emergencyContacts.map((contact, index) => (
                        <div key={index} className="border-l-4 border-primary-600 pl-4">
                          <p className="font-semibold text-secondary-700">{contact.name}</p>
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-primary-600 hover:underline"
                          >
                            {contact.phone}
                          </a>
                          {contact.email && (
                            <p className="text-sm text-secondary-600 mt-1">
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-primary-600 hover:underline"
                              >
                                {contact.email}
                              </a>
                            </p>
                          )}
                          {contact.description && (
                            <p className="text-sm text-secondary-600 mt-1">{contact.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          </div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="flex gap-2 overflow-x-auto pb-2">
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

          {/* FAQ List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-secondary-600">Loading FAQs...</div>
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-secondary-200">
              <p className="text-secondary-600">No FAQs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => (
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
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

