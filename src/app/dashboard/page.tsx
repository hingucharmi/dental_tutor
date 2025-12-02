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
      <div>
        <h1 className="heading-responsive font-bold text-primary-700">
          {getWelcomeMessage()}
        </h1>
        <p className="text-secondary-600 mt-2">{getSubtitle()}</p>
        <p className="text-sm text-secondary-500 mt-1">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/appointments"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-secondary-200"
        >
          <h2 className="text-xl font-semibold mb-2 text-primary-700">
            {isAdmin ? 'Manage Appointments' : isDentist ? 'My Schedule' : 'My Appointments'}
          </h2>
          <p className="text-secondary-600">
            {isAdmin ? 'View and manage all patient appointments' : isDentist ? 'View your scheduled appointments' : 'View and manage your appointments'}
          </p>
        </Link>

        {isPatient && (
          <>
            <Link
              href="/chat"
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-secondary-200"
            >
              <h2 className="text-xl font-semibold mb-2 text-primary-700">Chat Assistant</h2>
              <p className="text-secondary-600">Get help from our AI assistant</p>
            </Link>

            <Link
              href="/waitlist"
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-secondary-200"
            >
              <h2 className="text-xl font-semibold mb-2 text-primary-700">Waitlist</h2>
              <p className="text-secondary-600">Join waitlist for preferred times</p>
            </Link>

            <Link
              href="/prescriptions"
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-secondary-200"
            >
              <h2 className="text-xl font-semibold mb-2 text-primary-700">Prescriptions</h2>
              <p className="text-secondary-600">View prescriptions and request refills</p>
            </Link>

            <Link
              href="/insurance"
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-secondary-200"
            >
              <h2 className="text-xl font-semibold mb-2 text-primary-700">Insurance</h2>
              <p className="text-secondary-600">Manage insurance information</p>
            </Link>

            <Link
              href="/payments"
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-secondary-200"
            >
              <h2 className="text-xl font-semibold mb-2 text-primary-700">Payments</h2>
              <p className="text-secondary-600">View payment history</p>
            </Link>
          </>
        )}

        {(isDentist || isPatient) && (
          <Link
            href="/chat"
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-secondary-200"
          >
            <h2 className="text-xl font-semibold mb-2 text-primary-700">Chat Assistant</h2>
            <p className="text-secondary-600">Get help from our AI assistant</p>
          </Link>
        )}

        {isAdmin && (
          <>
            <Link
              href="/support"
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-secondary-200"
            >
              <h2 className="text-xl font-semibold mb-2 text-primary-700">Support Center</h2>
              <p className="text-secondary-600">Manage support tickets and inquiries</p>
            </Link>
          </>
        )}

        <Link
          href="/profile"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-secondary-200"
        >
          <h2 className="text-xl font-semibold mb-2 text-primary-700">Profile</h2>
          <p className="text-secondary-600">Manage your account settings</p>
        </Link>

        <Link
          href="/notifications"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-secondary-200"
        >
          <h2 className="text-xl font-semibold mb-2 text-primary-700">Notifications</h2>
          <p className="text-secondary-600">View your notifications</p>
        </Link>

        <Link
          href="/office"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-secondary-200"
        >
          <h2 className="text-xl font-semibold mb-2 text-primary-700">Office Info</h2>
          <p className="text-secondary-600">Location, hours</p>
        </Link>
      </div>
    </div>
  );
}

