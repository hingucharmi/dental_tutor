'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';

interface CalendarIntegration {
  id: number;
  provider: string;
  calendarId?: string;
  isActive: boolean;
  lastSyncAt?: string;
  syncFrequency?: string;
}

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth(true);
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('google');

  useEffect(() => {
    if (!authLoading && user) {
      fetchIntegrations();
    }
  }, [authLoading, user]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/calendar/integrations');
      if (response.data.success) {
        setIntegrations(response.data.data.integrations || []);
      }
    } catch (error) {
      console.error('Error fetching calendar integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: string) => {
    try {
      // In a real implementation, this would redirect to OAuth flow
      // For now, we'll simulate the connection
      const response = await apiClient.post('/api/calendar/integrations', {
        provider,
        syncFrequency: 'realtime',
      });
      
      if (response.data.success) {
        setShowConnectForm(false);
        fetchIntegrations();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to connect calendar');
    }
  };

  const handleDisconnect = async (id: number) => {
    if (!confirm('Are you sure you want to disconnect this calendar?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/calendar/integrations/${id}`);
      fetchIntegrations();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to disconnect calendar');
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await apiClient.post('/api/calendar/sync');
      if (response.data.success) {
        alert('Calendar synced successfully!');
        fetchIntegrations();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to sync calendar');
    } finally {
      setSyncing(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        );
      case 'outlook':
      case 'microsoft':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.5 11.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5zm0-7c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5-1.1-2.5-2.5-2.5zM24 4v16H8V4h16zm-1 1H9v14h14V5z" fill="#0078D4"/>
          </svg>
        );
      case 'apple':
      case 'ical':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-1.02.65.03 2.47.26 3.64 1.98-3.09.67-3.05 3.99.03 4.73-.74.38-1.5.75-2.64 1.26zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="#000"/>
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return 'Google Calendar';
      case 'outlook':
      case 'microsoft':
        return 'Outlook Calendar';
      case 'apple':
      case 'ical':
        return 'Apple iCal';
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading calendar settings...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const availableProviders = ['google', 'outlook', 'apple'];
  const connectedProviders = integrations.filter(i => i.isActive).map(i => i.provider.toLowerCase());

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-responsive font-bold text-primary-700">
            Calendar Integration
          </h1>
          <p className="text-secondary-600 mt-2">
            Sync your appointments with your favorite calendar app
          </p>
        </div>
        {integrations.some(i => i.isActive) && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>

      {/* Connected Calendars */}
      {integrations.filter(i => i.isActive).length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-primary-700 mb-4">
            Connected Calendars
          </h2>
          <div className="space-y-4">
            {integrations
              .filter(i => i.isActive)
              .map((integration) => (
                <div
                  key={integration.id}
                  className="bg-white rounded-lg shadow-md p-6 border border-secondary-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-primary-600">
                        {getProviderIcon(integration.provider)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-primary-700">
                          {getProviderName(integration.provider)}
                        </h3>
                        {integration.lastSyncAt && (
                          <p className="text-sm text-secondary-600">
                            Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
                          </p>
                        )}
                        {integration.syncFrequency && (
                          <p className="text-sm text-secondary-600">
                            Sync frequency: {integration.syncFrequency}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Connected
                      </span>
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Available Calendars */}
      <div>
        <h2 className="text-xl font-semibold text-primary-700 mb-4">
          Available Calendar Providers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableProviders.map((provider) => {
            const isConnected = connectedProviders.includes(provider.toLowerCase());
            return (
              <div
                key={provider}
                className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all ${
                  isConnected
                    ? 'border-green-300 bg-green-50'
                    : 'border-secondary-200 hover:border-primary-300 hover:shadow-lg'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`mb-4 ${isConnected ? 'text-green-600' : 'text-primary-600'}`}>
                    {getProviderIcon(provider)}
                  </div>
                  <h3 className="text-lg font-semibold text-primary-700 mb-2">
                    {getProviderName(provider)}
                  </h3>
                  {isConnected ? (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Already Connected
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnect(provider)}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mt-2"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sync Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          How Calendar Sync Works
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Your appointments will automatically sync to your connected calendar</li>
          <li>• Changes made in your calendar app will sync back to Dental Tutor</li>
          <li>• You can connect multiple calendar providers</li>
          <li>• Sync happens in real-time or on a schedule you choose</li>
          <li>• You can disconnect any calendar at any time</li>
        </ul>
      </div>
    </div>
  );
}

