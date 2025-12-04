'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading } = useAuth(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'admin' || user.role === 'staff';
  const isDentist = user.role === 'dentist';
  const isPatient = user.role === 'patient' || !user.role;

  const getDashboardTitle = () => {
    if (isAdmin) return 'Admin Dashboard';
    if (isDentist) return 'Dentist Dashboard';
    return 'Patient Dashboard';
  };

  const getWelcomeMessage = () => {
    if (isAdmin) return `Welcome, ${user.firstName} (${user.role})`;
    if (isDentist) return `Welcome, Dr. ${user.firstName}`;
    return `Welcome back, ${user.firstName}!`;
  };

  const getSubtitle = () => {
    if (isAdmin) return 'Manage the dental practice and patient records';
    if (isDentist) return 'Manage your schedule and patient appointments';
    return 'Manage your appointments, health records, and dental care';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl p-8 md:p-12 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <h1 className="heading-responsive font-bold mb-2">
            {getWelcomeMessage()}
          </h1>
          <p className="text-lg opacity-90 mt-2">{getSubtitle()}</p>
          <p className="text-sm opacity-75 mt-2">{user.email}</p>
        </div>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/appointments"
          className="group p-6 bg-white rounded-xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-secondary-200 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-100 to-blue-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-75 transition-opacity"></div>
          <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-primary-700 relative z-10">
            {isAdmin ? 'Manage Appointments' : isDentist ? 'My Schedule' : 'My Appointments'}
          </h2>
          <p className="text-secondary-600 relative z-10">
            {isAdmin ? 'View and manage all patient appointments' : isDentist ? 'View your scheduled appointments' : 'View and manage your appointments'}
          </p>
        </Link>

        {isPatient && (
          <>
            <Link
              href="/chat"
              className="group p-6 bg-white rounded-xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-secondary-200 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-primary-700 relative z-10">Chat Assistant</h2>
              <p className="text-secondary-600 relative z-10">Get help from our AI assistant</p>
            </Link>

            <Link
              href="/waitlist"
              className="group p-6 bg-white rounded-xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-secondary-200 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-primary-700 relative z-10">Waitlist</h2>
              <p className="text-secondary-600 relative z-10">Join waitlist for preferred times</p>
            </Link>

            <Link
              href="/prescriptions"
              className="group p-6 bg-white rounded-xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-secondary-200 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-primary-700 relative z-10">Prescriptions</h2>
              <p className="text-secondary-600 relative z-10">View prescriptions and request refills</p>
            </Link>

            <Link
              href="/insurance"
              className="group p-6 bg-white rounded-xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-secondary-200 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-primary-700 relative z-10">Insurance</h2>
              <p className="text-secondary-600 relative z-10">Manage insurance information</p>
            </Link>

            <Link
              href="/payments"
              className="group p-6 bg-white rounded-xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-secondary-200 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-primary-700 relative z-10">Payments</h2>
              <p className="text-secondary-600 relative z-10">View payment history</p>
            </Link>

            <Link
              href="/compliance"
              className="group p-6 bg-white rounded-xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-secondary-200 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-primary-700 relative z-10">Treatment Compliance</h2>
              <p className="text-secondary-600 relative z-10">Track your treatment compliance and follow-ups</p>
            </Link>
          </>
        )}

        {(isDentist || isPatient) && (
          <Link
            href="/chat"
            className="group p-6 bg-white rounded-xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-secondary-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-primary-700 relative z-10">Chat Assistant</h2>
            <p className="text-secondary-600 relative z-10">Get help from our AI assistant</p>
          </Link>
        )}

        {isAdmin && (
          <>
            <Link
              href="/support"
              className="group p-6 bg-white rounded-xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-secondary-200 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-red-400 to-pink-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-primary-700 relative z-10">Support Center</h2>
              <p className="text-secondary-600 relative z-10">Manage support tickets and inquiries</p>
            </Link>
          </>
        )}

        <Link
          href="/profile"
          className="group p-6 bg-white rounded-xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-secondary-200 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-100 to-slate-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-75 transition-opacity"></div>
          <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-gray-400 to-slate-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-primary-700 relative z-10">Profile</h2>
          <p className="text-secondary-600 relative z-10">Manage your account settings</p>
        </Link>

        <Link
          href="/notifications"
          className="group p-6 bg-white rounded-xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-secondary-200 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-75 transition-opacity"></div>
          <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-primary-700 relative z-10">Notifications</h2>
          <p className="text-secondary-600 relative z-10">View your notifications</p>
        </Link>

        <Link
          href="/office"
          className="group p-6 bg-white rounded-xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-secondary-200 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-75 transition-opacity"></div>
          <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-primary-700 relative z-10">Office Info</h2>
          <p className="text-secondary-600 relative z-10">Location, hours</p>
        </Link>
      </div>
    </div>
  );
}

