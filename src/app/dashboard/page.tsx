'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth(true);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="heading-responsive font-bold text-primary-700">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-secondary-600 mt-2">{user.email}</p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-secondary-200 text-secondary-700 rounded-lg hover:bg-secondary-300 transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/appointments"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-secondary-200"
        >
          <h2 className="text-xl font-semibold mb-2 text-primary-700">My Appointments</h2>
          <p className="text-secondary-600">View and manage your appointments</p>
        </Link>

        <Link
          href="/chat"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-secondary-200"
        >
          <h2 className="text-xl font-semibold mb-2 text-primary-700">Chat Assistant</h2>
          <p className="text-secondary-600">Get help from our AI assistant</p>
        </Link>

        <Link
          href="/profile"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-secondary-200"
        >
          <h2 className="text-xl font-semibold mb-2 text-primary-700">Profile</h2>
          <p className="text-secondary-600">Manage your account settings</p>
        </Link>
      </div>
    </div>
  );
}

