'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Home() {
  const { isAuthenticated, user, loading } = useAuth();

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';
  const isDentist = user?.role === 'dentist';
  const isPatient = user?.role === 'patient' || !user?.role;

  const getWelcomeTitle = () => {
    if (!isAuthenticated || !user) return 'Welcome to Dental Tutor';
    if (isAdmin) return `Welcome, ${user.firstName} (${user.role})`;
    if (isDentist) return `Welcome, Dr. ${user.firstName}`;
    return `Welcome back, ${user.firstName}!`;
  };

  const getWelcomeMessage = () => {
    if (!isAuthenticated || !user) {
      return 'Your AI-powered dental care assistant. Book appointments, get dental care tips, and manage your oral health all in one place.';
    }
    if (isAdmin) {
      return `You're logged in as ${user.email} (${user.role}). Manage the dental practice, appointments, and patient records.`;
    }
    if (isDentist) {
      return `You're logged in as ${user.email}. Manage your schedule, view patient appointments, and provide dental care.`;
    }
    return `You're logged in as ${user.email}. Manage your appointments, chat with our AI assistant, and take care of your dental health.`;
  };

  return (
    <div className="space-y-12">
      <section className="text-center space-y-6">
        <h1 className="heading-responsive font-bold text-primary-700">
          {getWelcomeTitle()}
        </h1>
        <p className="text-responsive text-secondary-600 max-w-2xl mx-auto">
          {getWelcomeMessage()}
        </p>
        {!loading && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {isAdmin ? 'Admin Dashboard' : isDentist ? 'Dentist Dashboard' : 'Go to Dashboard'}
                </Link>
                <Link
                  href="/appointments"
                  className="px-6 py-3 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors"
                >
                  {isAdmin ? 'Manage Appointments' : isDentist ? 'My Schedule' : 'My Appointments'}
                </Link>
                {(isPatient || isDentist) && (
                  <Link
                    href="/chat"
                    className="px-6 py-3 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                  >
                    Chat Assistant
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-6 py-3 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3 text-primary-700">Book Appointments</h2>
          <p className="text-secondary-600">
            Easily schedule and manage your dental appointments online.
          </p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3 text-primary-700">AI Assistant</h2>
          <p className="text-secondary-600">
            Get instant answers to your dental care questions with our AI chatbot.
          </p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3 text-primary-700">Care Management</h2>
          <p className="text-secondary-600">
            Track your treatment history and receive personalized care instructions.
          </p>
        </div>
      </section>
    </div>
  );
}

