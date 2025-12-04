'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';
import Link from 'next/link';

interface ComplianceItem {
  id: number;
  treatmentPlanId?: number;
  treatmentPlanItemId?: number;
  scheduledDate: string;
  completedDate?: string;
  status: string;
  reminderSent?: boolean;
  reminderCount?: number;
  notes?: string;
  treatmentDescription?: string;
  serviceName?: string;
  serviceDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function CompliancePage() {
  const { user, loading: authLoading } = useAuth(true);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    overallRate: 0,
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchCompliance();
    }
  }, [authLoading, user, filterStatus]);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      const url = filterStatus !== 'all'
        ? `/api/compliance?status=${filterStatus}`
        : '/api/compliance';
      const response = await apiClient.get(url);
      if (response.data.success) {
        const items = response.data.data.complianceItems || [];
        setComplianceItems(items);
        
        // Calculate statistics
        const total = items.length;
        const completed = items.filter((i: ComplianceItem) => i.status === 'completed').length;
        const pending = items.filter((i: ComplianceItem) => i.status === 'pending').length;
        const overdue = items.filter((i: ComplianceItem) => {
          if (i.status === 'completed') return false;
          return new Date(i.scheduledDate) < new Date();
        }).length;
        const overallRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        setStats({ total, completed, pending, overdue, overallRate });
      }
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response = await apiClient.put(`/api/compliance/${id}`, { status });
      if (response.data.success) {
        fetchCompliance();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update compliance status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isOverdue = (scheduledDate: string, status: string) => {
    if (status === 'completed') return false;
    return new Date(scheduledDate) < new Date();
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading compliance data...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="heading-responsive font-bold text-primary-700">
          Treatment Compliance
        </h1>
        <p className="text-secondary-600 mt-2">
          Track your treatment compliance and follow-up appointments
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border border-secondary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Overall Compliance</p>
              <p className="text-3xl font-bold text-primary-700">{stats.overallRate}%</p>
            </div>
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-secondary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Total Items</p>
              <p className="text-3xl font-bold text-primary-700">{stats.total}</p>
            </div>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-secondary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-700">{stats.completed}</p>
            </div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-secondary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Overdue</p>
              <p className="text-3xl font-bold text-red-700">{stats.overdue}</p>
            </div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-secondary-700">Filter by status:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Compliance Items List */}
      {complianceItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center border border-secondary-200">
          <svg className="w-16 h-16 text-secondary-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-secondary-600 mb-2">No compliance items found</p>
          <p className="text-sm text-secondary-500">Your treatment compliance items will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complianceItems.map((item) => {
            const overdue = isOverdue(item.scheduledDate, item.status);
            return (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                  overdue ? 'border-red-300 bg-red-50' : 'border-secondary-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-primary-700">
                        {item.serviceName || item.treatmentDescription || 'Treatment Compliance'}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      {overdue && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          Overdue
                        </span>
                      )}
                    </div>
                    {item.treatmentDescription && (
                      <p className="text-sm text-secondary-600 mb-2">
                        <strong>Treatment:</strong> {item.treatmentDescription}
                      </p>
                    )}
                    {item.serviceName && (
                      <p className="text-sm text-secondary-600 mb-2">
                        <strong>Service:</strong> {item.serviceName}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-secondary-600 mb-2">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Scheduled: {new Date(item.scheduledDate).toLocaleDateString()}</span>
                      </div>
                      {item.completedDate && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Completed: {new Date(item.completedDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-sm text-secondary-600 mb-2">
                        <strong>Notes:</strong> {item.notes}
                      </p>
                    )}
                    {item.reminderCount !== undefined && item.reminderCount > 0 && (
                      <p className="text-xs text-secondary-500 mb-2">
                        Reminders sent: {item.reminderCount}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {item.status !== 'completed' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'in_progress')}
                          className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Mark In Progress
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'completed')}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Mark Complete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compliance Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          About Treatment Compliance
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Compliance tracking helps ensure you complete recommended treatments</li>
          <li>• Follow-up appointments and treatments are tracked here</li>
          <li>• Mark items as complete when you've finished the treatment</li>
          <li>• Overdue items are highlighted in red</li>
          <li>• Your overall compliance rate is calculated based on completed items</li>
        </ul>
      </div>
    </div>
  );
}

