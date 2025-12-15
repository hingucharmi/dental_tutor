'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/hooks/useAuth';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user, logout } = useAuth();
  
  const isAdmin = user?.role === 'admin' || user?.role === 'staff';
  const isPatient = user?.role === 'patient' || !user?.role;
  const isDentist = user?.role === 'dentist';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };

    if (moreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [moreMenuOpen]);

  return (
    <header className="bg-white shadow-sm border-b border-secondary-200 sticky top-0 z-50">
      <nav className="container-responsive">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-primary-600 flex-shrink-0">
            {t('header.title')}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 flex-1 justify-end max-w-5xl">
            {/* Public Links - Available to Everyone */}
            <Link
              href="/"
              className="text-secondary-700 hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              {t('common.home')}
            </Link>
            <Link
              href="/services"
              className="text-secondary-700 hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              {t('common.services')}
            </Link>
            <Link
              href="/dentists"
              className="text-secondary-700 hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              {t('common.dentists')}
            </Link>
            <Link
              href="/faqs"
              className="text-secondary-700 hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              {t('common.faqs')}
            </Link>

            {isAuthenticated ? (
              <>
                {/* Main Navigation Links - Always Visible */}
                {(isPatient || isDentist) && (
                  <>
                    <Link
                      href="/dashboard"
                      className="text-secondary-700 hover:text-primary-600 transition-colors whitespace-nowrap font-medium"
                    >
                      {t('common.dashboard')}
                    </Link>
                    <Link
                      href="/appointments"
                      className="text-secondary-700 hover:text-primary-600 transition-colors whitespace-nowrap font-medium"
                    >
                      {t('common.appointments')}
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <>
                    <Link
                      href="/dashboard"
                      className="text-secondary-700 hover:text-primary-600 transition-colors whitespace-nowrap font-medium"
                    >
                      {t('header.adminDashboard')}
                    </Link>
                    <Link
                      href="/appointments"
                      className="text-secondary-700 hover:text-primary-600 transition-colors whitespace-nowrap font-medium"
                    >
                      {t('header.manageAppointments')}
                    </Link>
                  </>
                )}

                {/* Patient Main Links */}
                {isPatient && (
                  <Link
                    href="/payments"
                    className="text-secondary-700 hover:text-primary-600 transition-colors whitespace-nowrap"
                  >
                    {t('common.payments')}
                  </Link>
                )}

                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* More Menu Dropdown - For Additional Links */}
                {(isPatient || isAdmin || isDentist) && (
                  <div className="relative" ref={moreMenuRef}>
                    <button
                      onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                      className="flex items-center space-x-1 text-secondary-700 hover:text-primary-600 transition-colors whitespace-nowrap"
                    >
                      <span>{t('common.more')}</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {moreMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-secondary-200 py-2 z-50">
                        {(isPatient || isDentist) && (
                          <>
                            <Link
                              href="/referrals"
                              className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-primary-600 transition-colors"
                              onClick={() => setMoreMenuOpen(false)}
                            >
                              {t('common.referrals')}
                            </Link>
                            <Link
                              href="/recommendations"
                              className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-primary-600 transition-colors"
                              onClick={() => setMoreMenuOpen(false)}
                            >
                              {t('common.recommendations')}
                            </Link>
                            <Link
                              href="/loyalty"
                              className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-primary-600 transition-colors"
                              onClick={() => setMoreMenuOpen(false)}
                            >
                              {t('common.loyalty')}
                            </Link>
                            {/* <Link
                              href="/recurring-appointments"
                              className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-primary-600 transition-colors"
                              onClick={() => setMoreMenuOpen(false)}
                            >
                              {t('common.recurringAppointments', 'Recurring Appointments')}
                            </Link> */}
                            {/* <Link
                              href="/prescriptions"
                              className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-primary-600 transition-colors"
                              onClick={() => setMoreMenuOpen(false)}
                            >
                              {t('common.prescriptions')}
                            </Link> */}
                            <Link
                              href="/insurance"
                              className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-primary-600 transition-colors"
                              onClick={() => setMoreMenuOpen(false)}
                            >
                              {t('common.insurance')}
                            </Link>
                            <Link
                              href="/compliance"
                              className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-primary-600 transition-colors"
                              onClick={() => setMoreMenuOpen(false)}
                            >
                              {t('common.compliance')}
                            </Link>
                            <div className="border-t border-secondary-200 my-1"></div>
                          </>
                        )}
                        {isAdmin && (
                          <Link
                            href="/support"
                            className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-primary-600 transition-colors"
                            onClick={() => setMoreMenuOpen(false)}
                          >
                            {t('header.supportCenter')}
                          </Link>
                        )}
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-primary-600 transition-colors"
                          onClick={() => setMoreMenuOpen(false)}
                        >
                          {t('common.profile')}
                        </Link>
                        <Link
                          href="/notifications"
                          className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-primary-600 transition-colors"
                          onClick={() => setMoreMenuOpen(false)}
                        >
                          {t('common.notifications')}
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* User Info and Logout - Always Visible */}
                <div className="flex items-center space-x-3 ml-4 border-l border-secondary-200 pl-4 flex-shrink-0">
                  {user && (
                    <span className="text-secondary-600 text-sm whitespace-nowrap hidden lg:inline">
                      {user.firstName} {isAdmin && <span className="text-primary-600">({user.role})</span>}
                    </span>
                  )}
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap font-medium"
                    title={t('common.signOut')}
                    aria-label={t('common.signOut')}
                  >
                    {t('common.signOut')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <LanguageSwitcher />
                <Link
                  href="/support"
                  className="text-secondary-700 hover:text-primary-600 transition-colors"
                >
                  {t('common.support')}
                </Link>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {t('common.signIn')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-secondary-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-secondary-200">
            {/* Public Links */}
            <div className="flex items-center justify-between border-b border-secondary-200 pb-2 mb-2">
              <LanguageSwitcher />
            </div>
            <Link
              href="/"
              className="block py-2 text-secondary-700 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('common.home')}
            </Link>
            <Link
              href="/services"
              className="block py-2 text-secondary-700 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('common.services')}
            </Link>
            <Link
              href="/dentists"
              className="block py-2 text-secondary-700 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('common.dentists')}
            </Link>
            <Link
              href="/faqs"
              className="block py-2 text-secondary-700 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('common.faqs')}
            </Link>

            {isAuthenticated ? (
              <>
                {/* Patient/Dentist Links */}
                {(isPatient || isDentist) && (
                  <>
                    <div className="border-t border-secondary-200 pt-2 mt-2">
                      <Link
                        href="/dashboard"
                        className="block py-2 text-secondary-700 hover:text-primary-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('common.dashboard')}
                      </Link>
                      <Link
                        href="/appointments"
                        className="block py-2 text-secondary-700 hover:text-primary-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('common.appointments')}
                      </Link>
                    </div>
                  </>
                )}

                {/* Patient-Only Links */}
                {isPatient && (
                  <div className="border-t border-secondary-200 pt-2">
                    <Link
                      href="/payments"
                      className="block py-2 text-secondary-700 hover:text-primary-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('common.payments')}
                    </Link>
                    <Link
                      href="/referrals"
                      className="block py-2 text-secondary-700 hover:text-primary-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('common.referrals')}
                    </Link>
                    <Link
                      href="/recommendations"
                      className="block py-2 text-secondary-700 hover:text-primary-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('common.recommendations')}
                    </Link>
                    <Link
                      href="/loyalty"
                      className="block py-2 text-secondary-700 hover:text-primary-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('common.loyalty')}
                    </Link>
                    {/* <Link
                      href="/prescriptions"
                      className="block py-2 text-secondary-700 hover:text-primary-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('common.prescriptions')}
                    </Link> */}
                    <Link
                      href="/insurance"
                      className="block py-2 text-secondary-700 hover:text-primary-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('common.insurance')}
                    </Link>
                    <Link
                      href="/compliance"
                      className="block py-2 text-secondary-700 hover:text-primary-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('common.compliance')}
                    </Link>
                  </div>
                )}

                {/* Admin/Staff Links */}
                {isAdmin && (
                  <div className="border-t border-secondary-200 pt-2">
                    <Link
                      href="/dashboard"
                      className="block py-2 text-secondary-700 hover:text-primary-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('header.adminDashboard')}
                    </Link>
                    <Link
                      href="/appointments"
                      className="block py-2 text-secondary-700 hover:text-primary-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('header.manageAppointments')}
                    </Link>
                    <Link
                      href="/support"
                      className="block py-2 text-secondary-700 hover:text-primary-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('header.supportCenter')}
                    </Link>
                  </div>
                )}

                {/* Common Links */}
                <div className="border-t border-secondary-200 pt-2">
                  <Link
                    href="/profile"
                    className="block py-2 text-secondary-700 hover:text-primary-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('common.profile')}
                  </Link>
                  <Link
                    href="/notifications"
                    className="block py-2 text-secondary-700 hover:text-primary-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('common.notifications')}
                  </Link>
                </div>

                {/* User Info */}
                {user && (
                  <div className="block py-2 text-secondary-600 text-sm border-t border-secondary-200 pt-2">
                    {user.firstName} {user.lastName}
                    {isAdmin && <span className="block text-primary-600 text-xs mt-1">Role: {user.role}</span>}
                  </div>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center transition-colors"
                >
                  {t('common.signOut')}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-secondary-200 pb-2 mb-2">
                  <LanguageSwitcher />
                </div>
                <Link
                  href="/support"
                  className="block py-2 text-secondary-700 hover:text-primary-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.support')}
                </Link>
                <Link
                  href="/auth/login"
                  className="block py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.signIn')}
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

