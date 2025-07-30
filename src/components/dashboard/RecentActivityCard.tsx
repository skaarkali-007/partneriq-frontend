import React from 'react'
import { RecentActivity } from '../../store/slices/dashboardSlice'

interface RecentActivityCardProps {
  activities: RecentActivity[]
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ activities }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'commission':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'referral':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
        )
      case 'payout':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'
      }`}>
        {status}
      </span>
    )
  }

  // Use real activities data only
  const displayActivities = activities || []

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
        
        {displayActivities.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first referral link.</p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {displayActivities.map((activity, index) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {index !== displayActivities.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                    )}
                    <div className="relative flex space-x-3">
                      {getActivityIcon(activity.type)}
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {activity.description}
                            {activity.amount && (
                              <span className="font-medium text-gray-900">
                                {' '}• {formatCurrency(activity.amount)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500 flex flex-col items-end space-y-1">
                          <time>{formatDate(activity.timestamp)}</time>
                          {getStatusBadge(activity.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {displayActivities.length > 0 && (
          <div className="mt-6">
            <button className="w-full text-center text-sm text-blue-600 hover:text-blue-500 font-medium">
              View all activity
            </button>
          </div>
        )}
      </div>
    </div>
  )
}