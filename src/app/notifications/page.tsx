'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';

interface Notification {
  id: number;
  type: string;
  title?: string;
  content: string;
  sentAt: string;
  readAt?: string;
  channel: string;
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchNotifications();
    }
  }, [authLoading, user, unreadOnly]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = unreadOnly ? { unreadOnly: 'true' } : {};
      const response = await apiClient.get('/api/notifications', { params });
      if (response.data.success) {
        setNotifications(response.data.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await apiClient.put(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading notifications...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="heading-responsive font-bold text-primary-700">
            Notifications
          </h1>
          <p className="text-secondary-600 mt-2">
            {unreadCount > 0 && (
              <span className="font-medium">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/notifications/preferences"
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Preferences
          </a>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-secondary-700">Show unread only</span>
          </label>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-secondary-600">No notifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-md p-6 border border-secondary-200 cursor-pointer transition-colors ${
                !notification.readAt ? 'border-primary-300 bg-primary-50' : ''
              }`}
              onClick={() => !notification.readAt && markAsRead(notification.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {notification.title && (
                    <h3 className="text-lg font-semibold text-primary-700 mb-1">
                      {notification.title}
                    </h3>
                  )}
                  <p className="text-secondary-600">{notification.content}</p>
                  <p className="text-xs text-secondary-500 mt-2">
                    {new Date(notification.sentAt).toLocaleString()}
                    {notification.channel && ` • via ${notification.channel}`}
                  </p>
                </div>
                {!notification.readAt && (
                  <span className="ml-4 w-2 h-2 bg-primary-600 rounded-full"></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


