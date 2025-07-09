import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../hooks/useAuth';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface OrderStats {
  total: number;
  by_status: {
    received: number;
    confirmed: number;
    in_kitchen: number;
    ready_for_pickup: number;
    delivered: number;
    cancelled: number;
  };
  today_total: number;
  today_revenue: number;
}

interface PopularItem {
  name: string;
  quantity: number;
  revenue: number;
  orders: number;
}

interface CustomerAnalytics {
  total_customers: number;
  returning_customers: number;
  guest_orders: number;
  customer_retention_rate: number;
  average_orders_per_customer: number;
  average_customer_value: number;
}

interface PeakHour {
  hour: number;
  orders: number;
  revenue: number;
}

interface RevenueTrend {
  date: string;
  revenue: number;
  orders: number;
}

interface AnalyticsData {
  revenue_trends: RevenueTrend[];
  popular_items: PopularItem[];
  customer_analytics: CustomerAnalytics;
  peak_hours: PeakHour[];
  summary: {
    total_orders: number;
    total_revenue: number;
    average_order_value: number;
    completed_orders: number;
    cancelled_orders: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const router = useRouter();
  const { restaurantId } = router.query;
  const { user } = useAuth();
  
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0]
  });
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    if (restaurantId && user) {
      fetchAnalyticsData();
    }
  }, [restaurantId, user, dateRange, period]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch order statistics
      const statsResponse = await fetch(`/api/orders/restaurant/${restaurantId}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch order statistics');
      }

      const statsData = await statsResponse.json();
      setOrderStats(statsData);

      // Fetch analytics data
      const analyticsResponse = await fetch(
        `/api/orders/restaurant/${restaurantId}/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&period=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!analyticsResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const analyticsData = await analyticsResponse.json();
      setAnalyticsData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportData = (type: 'csv' | 'json') => {
    if (!analyticsData) return;

    const data = {
      exported_at: new Date().toISOString(),
      date_range: dateRange,
      period,
      ...analyticsData
    };

    if (type === 'csv') {
      // Convert to CSV format
      const csvData = [
        ['Metric', 'Value'],
        ['Total Orders', analyticsData.summary.total_orders],
        ['Total Revenue', `$${analyticsData.summary.total_revenue.toFixed(2)}`],
        ['Average Order Value', `$${analyticsData.summary.average_order_value.toFixed(2)}`],
        ['Completed Orders', analyticsData.summary.completed_orders],
        ['Cancelled Orders', analyticsData.summary.cancelled_orders],
        ['Customer Retention Rate', `${analyticsData.customer_analytics.customer_retention_rate.toFixed(1)}%`],
        ['Total Customers', analyticsData.customer_analytics.total_customers],
        ['Guest Orders', analyticsData.customer_analytics.guest_orders],
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${restaurantId}-${dateRange.startDate}-${dateRange.endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Export as JSON
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${restaurantId}-${dateRange.startDate}-${dateRange.endDate}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchAnalyticsData}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!orderStats || !analyticsData) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </Layout>
    );
  }

  // Chart configurations
  const revenueChartData = {
    labels: analyticsData.revenue_trends.map(trend => trend.date),
    datasets: [
      {
        label: 'Revenue',
        data: analyticsData.revenue_trends.map(trend => trend.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const ordersChartData = {
    labels: analyticsData.revenue_trends.map(trend => trend.date),
    datasets: [
      {
        label: 'Orders',
        data: analyticsData.revenue_trends.map(trend => trend.orders),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  const popularItemsChartData = {
    labels: analyticsData.popular_items.slice(0, 5).map(item => item.name),
    datasets: [
      {
        label: 'Quantity Sold',
        data: analyticsData.popular_items.slice(0, 5).map(item => item.quantity),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const peakHoursChartData = {
    labels: analyticsData.peak_hours.map(hour => `${hour.hour}:00`),
    datasets: [
      {
        label: 'Orders',
        data: analyticsData.peak_hours.map(hour => hour.orders),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2">Business insights and reporting</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => exportData('csv')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
              >
                📊 Export CSV
              </button>
              <button
                onClick={() => exportData('json')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
              >
                📋 Export JSON
              </button>
            </div>
          </div>

          {/* Date Range and Period Controls */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="text-2xl">📊</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.summary.total_orders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="text-2xl">💰</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">${analyticsData.summary.total_revenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="text-2xl">🛒</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-blue-600">${analyticsData.summary.average_order_value.toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="text-2xl">👥</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Customer Retention</p>
                  <p className="text-2xl font-bold text-purple-600">{analyticsData.customer_analytics.customer_retention_rate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Revenue Trends */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
              <Line data={revenueChartData} options={chartOptions} />
            </div>

            {/* Order Volume */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Volume</h3>
              <Bar data={ordersChartData} options={chartOptions} />
            </div>

            {/* Popular Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Popular Items</h3>
              <Doughnut data={popularItemsChartData} options={{ responsive: true }} />
            </div>

            {/* Peak Hours */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours</h3>
              <Bar data={peakHoursChartData} options={chartOptions} />
            </div>
          </div>

          {/* Popular Items Table */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Items Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.popular_items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.revenue.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Analytics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{analyticsData.customer_analytics.total_customers}</p>
                <p className="text-sm text-gray-600">Total Customers</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{analyticsData.customer_analytics.returning_customers}</p>
                <p className="text-sm text-gray-600">Returning Customers</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{analyticsData.customer_analytics.guest_orders}</p>
                <p className="text-sm text-gray-600">Guest Orders</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{analyticsData.customer_analytics.average_orders_per_customer.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Avg Orders per Customer</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">${analyticsData.customer_analytics.average_customer_value.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Avg Customer Value</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-600">{analyticsData.customer_analytics.customer_retention_rate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Retention Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsDashboard; 