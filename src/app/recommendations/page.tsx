'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';

export default function RecommendationsPage() {
  const { user, loading: authLoading } = useAuth(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  useEffect(() => {
    if (!authLoading && user) {
      fetchRecommendations();
    }
  }, [authLoading, user, filterStatus]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const url = filterStatus !== 'all'
        ? `/api/recommendations?status=${filterStatus}`
        : '/api/recommendations';
      const response = await apiClient.get(url);
      if (response.data.success) {
        setRecommendations(response.data.data.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: number) => {
    try {
      const response = await apiClient.post(`/api/recommendations/${id}/accept`);
      if (response.data.success) {
        fetchRecommendations();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to accept recommendation');
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      const response = await apiClient.post(`/api/recommendations/${id}/dismiss`);
      if (response.data.success) {
        fetchRecommendations();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to dismiss recommendation');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      appointment_time: 'Appointment Time',
      service: 'Service',
      preventive_care: 'Preventive Care',
      treatment: 'Treatment',
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-700';
    if (priority >= 5) return 'bg-orange-100 text-orange-700';
    if (priority >= 3) return 'bg-yellow-100 text-yellow-700';
    return 'bg-blue-100 text-blue-700';
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading recommendations...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const pendingRecommendations = recommendations.filter(r => r.status === 'pending');
  const otherRecommendations = recommendations.filter(r => r.status !== 'pending');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-responsive font-bold text-primary-700">
            Recommendations
          </h1>
          <p className="text-secondary-600 mt-2">
            Personalized recommendations for your dental care
          </p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="dismissed">Dismissed</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-secondary-600">No recommendations found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingRecommendations.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-primary-700 mb-4">
                Pending Recommendations ({pendingRecommendations.length})
              </h2>
              <div className="space-y-4">
                {pendingRecommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white rounded-lg shadow-md p-6 border border-secondary-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-primary-700">
                            {rec.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(rec.priority)}`}>
                            Priority {rec.priority}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {getTypeLabel(rec.recommendationType)}
                          </span>
                        </div>
                        <p className="text-secondary-600 mb-3">{rec.description}</p>
                        {rec.expiresAt && (
                          <p className="text-xs text-secondary-500 mb-3">
                            Expires: {new Date(rec.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleAccept(rec.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDismiss(rec.id)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherRecommendations.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-primary-700 mb-4">
                Other Recommendations
              </h2>
              <div className="space-y-4">
                {otherRecommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white rounded-lg shadow-md p-6 border border-secondary-200 opacity-75"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-primary-700">
                            {rec.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(rec.priority)}`}>
                            Priority {rec.priority}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            {rec.status}
                          </span>
                        </div>
                        <p className="text-secondary-600 mb-2">{rec.description}</p>
                        <p className="text-xs text-secondary-500">
                          Updated: {new Date(rec.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

