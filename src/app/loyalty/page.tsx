'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';

export default function LoyaltyPage() {
  const { user, loading: authLoading } = useAuth(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchLoyaltyData();
    }
  }, [authLoading, user]);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      const [pointsResponse, transactionsResponse] = await Promise.all([
        apiClient.get('/api/loyalty/points'),
        apiClient.get('/api/loyalty/transactions'),
      ]);

      if (pointsResponse.data.success) {
        setLoyaltyPoints(pointsResponse.data.data.loyaltyPoints);
      }
      if (transactionsResponse.data.success) {
        setTransactions(transactionsResponse.data.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'gold':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'silver':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-orange-100 text-orange-700 border-orange-300';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return '💎';
      case 'gold':
        return '🥇';
      case 'silver':
        return '🥈';
      default:
        return '🥉';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'earned':
      case 'bonus':
        return 'text-green-600';
      case 'redeemed':
        return 'text-red-600';
      case 'expired':
        return 'text-gray-600';
      default:
        return 'text-secondary-600';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading loyalty information...</div>
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
          Loyalty Program
        </h1>
        <p className="text-secondary-600 mt-2">
          Earn points with every visit and redeem rewards
        </p>
      </div>

      {loyaltyPoints && (
        <div className="bg-white rounded-lg shadow-md p-8 border border-secondary-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-primary-700 mb-2">
                {loyaltyPoints.points} Points
              </h2>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getTierColor(loyaltyPoints.tier)}`}>
                <span className="text-xl">{getTierIcon(loyaltyPoints.tier)}</span>
                <span className="font-semibold capitalize">{loyaltyPoints.tier} Tier</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-secondary-50 rounded-lg p-4">
              <p className="text-sm text-secondary-600 mb-1">Total Earned</p>
              <p className="text-2xl font-bold text-primary-700">
                {loyaltyPoints.pointsEarned || 0}
              </p>
            </div>
            <div className="bg-secondary-50 rounded-lg p-4">
              <p className="text-sm text-secondary-600 mb-1">Total Redeemed</p>
              <p className="text-2xl font-bold text-primary-700">
                {loyaltyPoints.pointsRedeemed || 0}
              </p>
            </div>
            <div className="bg-secondary-50 rounded-lg p-4">
              <p className="text-sm text-secondary-600 mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-primary-700">
                {loyaltyPoints.points || 0}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-secondary-200">
            <h3 className="text-lg font-semibold text-primary-700 mb-2">
              How to Earn Points
            </h3>
            <ul className="space-y-2 text-sm text-secondary-600">
              <li>• 10 points for each appointment</li>
              <li>• 5 points for completing treatment plans</li>
              <li>• 20 points for referrals</li>
              <li>• Bonus points for special promotions</li>
            </ul>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-primary-700 mb-4">
          Transaction History
        </h2>
        {transactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-secondary-600">No transactions found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-secondary-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium capitalize ${getTransactionTypeColor(transaction.transaction_type)}`}>
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                        {transaction.transaction_type === 'earned' || transaction.transaction_type === 'bonus' ? '+' : '-'}
                        {transaction.points}
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary-600">
                        {transaction.description || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

