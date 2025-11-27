import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Dental Tutor - Your Dental Care Assistant',
  description: 'AI-powered dental clinic chatbot for appointment management and dental care guidance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow container-responsive py-6 sm:py-8 lg:py-12">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

