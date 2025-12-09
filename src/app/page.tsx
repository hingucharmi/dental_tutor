'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Home() {
  const { t } = useTranslation();
  const { isAuthenticated, user, loading } = useAuth();

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';
  const isDentist = user?.role === 'dentist';
  const isPatient = user?.role === 'patient' || !user?.role;

  const getWelcomeTitle = () => {
    if (!isAuthenticated || !user) return t('home.welcomeTitle');
    if (isAdmin) return t('home.welcomeAdmin', { name: user.firstName, role: user.role });
    if (isDentist) return t('home.welcomeDentist', { name: user.firstName });
    return t('home.welcomePatient', { name: user.firstName });
  };

  const getWelcomeMessage = () => {
    if (!isAuthenticated || !user) {
      return t('home.welcomeMessage');
    }
    if (isAdmin) {
      return t('home.welcomeMessageAdmin', { email: user.email, role: user.role });
    }
    if (isDentist) {
      return t('home.welcomeMessageDentist', { email: user.email });
    }
    return t('home.welcomeMessagePatient', { email: user.email });
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-blue-50 rounded-2xl p-8 md:p-12 lg:p-16">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative z-10 text-center space-y-6">
          <div className="inline-block">
            <h1 className="heading-responsive font-bold text-primary-700 mb-4">
              {getWelcomeTitle()}
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-primary-400 to-blue-400 mx-auto rounded-full"></div>
          </div>
          <p className="text-responsive text-secondary-600 max-w-3xl mx-auto leading-relaxed">
            {getWelcomeMessage()}
          </p>
          {!loading && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl font-medium"
                  >
                    {isAdmin ? t('header.adminDashboard') : isDentist ? t('header.dentistDashboard') : t('header.goToDashboard')}
                  </Link>
                  <Link
                    href="/appointments"
                    className="px-8 py-3 bg-white text-primary-700 rounded-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-md hover:shadow-lg font-medium border-2 border-primary-200"
                  >
                    {isAdmin ? t('header.manageAppointments') : isDentist ? t('header.mySchedule') : t('header.myAppointments')}
                  </Link>
                  {(isPatient || isDentist) && (
                    <Link
                      href="/chat"
                      className="px-8 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all transform hover:scale-105 shadow-md hover:shadow-lg font-medium"
                    >
                      {t('common.chatAssistant')}
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl font-medium"
                  >
                    {t('common.signIn')}
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-8 py-3 bg-white text-primary-700 rounded-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-md hover:shadow-lg font-medium border-2 border-primary-200"
                  >
                    {t('common.getStarted')}
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section with Images */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="group p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-secondary-100">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-primary-700">{t('home.bookAppointments')}</h2>
          <p className="text-secondary-600 leading-relaxed">
            {t('home.bookAppointmentsDesc')}
          </p>
        </div>
        
        <div className="group p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-secondary-100">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-primary-700">{t('home.aiAssistant')}</h2>
          <p className="text-secondary-600 leading-relaxed">
            {t('home.aiAssistantDesc')}
          </p>
        </div>
        
        <div className="group p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-secondary-100">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-primary-700">{t('home.careManagement')}</h2>
          <p className="text-secondary-600 leading-relaxed">
            {t('home.careManagementDesc')}
          </p>
        </div>
      </section>

      {/* Dental Clinic Image Section */}
      <section className="relative rounded-2xl overflow-hidden shadow-2xl">
        <div className="relative h-64 md:h-96 bg-gradient-to-r from-primary-600 to-blue-600">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white p-8 z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.modernDentalCare')}</h2>
              <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90">
                {t('home.modernDentalCareDesc')}
              </p>
            </div>
          </div>
          {/* Placeholder for dental clinic image - using gradient background */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=1200&q=80')] bg-cover bg-center opacity-30"></div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-gradient-to-br from-secondary-50 to-primary-50 rounded-2xl p-8 md:p-12">
        <h2 className="text-3xl font-bold text-center text-primary-700 mb-12">{t('home.whyChooseUs')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-primary-700 mb-2">{t('home.availability24')}</h3>
            <p className="text-sm text-secondary-600">{t('home.availability24Desc')}</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold text-primary-700 mb-2">{t('home.securePrivate')}</h3>
            <p className="text-sm text-secondary-600">{t('home.securePrivateDesc')}</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-primary-700 mb-2">{t('home.fastEfficient')}</h3>
            <p className="text-sm text-secondary-600">{t('home.fastEfficientDesc')}</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-primary-700 mb-2">{t('home.expertCare')}</h3>
            <p className="text-sm text-secondary-600">{t('home.expertCareDesc')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

