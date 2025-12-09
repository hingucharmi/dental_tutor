'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-gradient-to-br from-secondary-900 via-secondary-800 to-primary-900 text-secondary-300 mt-auto border-t border-secondary-700">
      <div className="container-responsive py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {t('header.title')}
            </h3>
            <p className="text-sm leading-relaxed">
              {t('footer.description')}
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-primary-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {t('common.home')}
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-primary-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {t('common.services')}
                </Link>
              </li>
              <li>
                <Link href="/appointments" className="hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-primary-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {t('common.appointments')}
                </Link>
              </li>
              <li>
                <Link href="/dentists" className="hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-primary-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {t('common.dentists')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {t('common.support')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/support" className="hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-primary-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {t('header.supportCenter')}
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-primary-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {t('common.faqs')}
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-primary-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {t('common.chatAssistant')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {t('footer.legal')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-primary-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-primary-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {t('footer.termsOfService')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-secondary-700 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-secondary-400">
              &copy; {new Date().getFullYear()} {t('header.title')}. {t('footer.copyright')}
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-secondary-400">{t('footer.madeWith')}</span>
              <svg className="w-5 h-5 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-secondary-400">{t('footer.forBetterDentalCare')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

