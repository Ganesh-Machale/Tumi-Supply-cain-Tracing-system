import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import KPICard from '../components/KPICard';
import DataTable from '../components/DataTable';
import { 
  TrendingUp, 
  MapPin, 
  Clock, 
  Layers, 
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        summaryRes,
        trendRes,
        regionRes,
        statusRes,
        recordsRes
      ] = await Promise.all([
        axiosInstance.get('/api/reports/summary'),
        axiosInstance.get('/api/reports/trend?range=30'),
        axiosInstance.get('/api/reports/by-region'),
        axiosInstance.get('/api/reports/by-status'),
        axiosInstance.get('/api/supply?limit=5&page=1')
      ]);

      setSummary(summaryRes.data);
      setTrendData(trendRes.data);
      setRegionData(regionRes.data);
      setStatusData(statusRes.data);
      setRecentRecords(recordsRes.data.records || []);
    } catch (err) {
      console.error('Error fetching dashboard datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format Currency (INR)
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Chart 1: Line Chart - Supply Quantity Trend (Last 30 Days)
  const lineChartConfig = {
    labels: trendData.map((d) => d.date),
    datasets: [
      {
        label: 'Quantity Distributed',
        data: trendData.map((d) => d.total_qty),
        borderColor: '#06b6d4', // Cyan accent
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#06b6d4',
        borderWidth: 2,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#94a3b8',
        bodyColor: '#f1f5f9',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      }
    }
  };

  // Chart 2: Bar Chart - Quantity by Region
  const barChartConfig = {
    labels: regionData.slice(0, 5).map((d) => d.region),
    datasets: [
      {
        label: 'Quantity',
        data: regionData.slice(0, 5).map((d) => d.total_qty),
        backgroundColor: '#3b82f6', // Indigo-blue
        borderRadius: 6,
        hoverBackgroundColor: '#60a5fa'
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      }
    }
  };

  // Chart 3: Pie Chart - Status breakdown
  const pieChartConfig = {
    labels: statusData.map((d) => d.status),
    datasets: [
      {
        data: statusData.map((d) => d.count),
        backgroundColor: [
          '#f59e0b', // PENDING -> Amber
          '#3b82f6', // DISPATCHED -> Blue
          '#06b6d4', // IN_TRANSIT -> Cyan
          '#10b981', // DELIVERED -> Emerald
          '#ef4444'  // CANCELLED -> Rose
        ],
        borderWidth: 1,
        borderColor: '#0f172a'
      }
    ]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#cbd5e1',
          font: { size: 10 },
          boxWidth: 12
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
      }
    }
  };

  // Recent Table Columns
  const tableColumns = [
    { key: 'reference_no', label: 'Ref No', render: (row) => (
      <span className="font-mono text-cyan-400 font-bold">{row.reference_no}</span>
    )},
    { key: 'product_name', label: 'Product', render: (row) => (
      <div>
        <div className="font-semibold text-slate-200">{row.product_name}</div>
        <span className="text-[10px] text-slate-500">{row.product_sku}</span>
      </div>
    )},
    { key: 'from_location_name', label: 'From / Origin', render: (row) => (
      <span className="text-xs">{row.from_location_name}</span>
    )},
    { key: 'to_location_name', label: 'To / Destination', render: (row) => (
      <span className="text-xs">{row.to_location_name}</span>
    )},
    { key: 'quantity', label: 'Qty', render: (row) => (
      <span className="font-bold">{row.quantity.toLocaleString()}</span>
    )},
    { key: 'total_value', label: 'Value', render: (row) => (
      <span className="font-bold text-slate-200">{formatCurrency(row.total_value)}</span>
    )},
    { key: 'status', label: 'Status', render: (row) => (
      <span className={`inline-block px-2.5 py-1 text-[10px] font-extrabold rounded-full ${
        row.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
        row.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
        row.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
        'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
      }`}>
        {row.status}
      </span>
    )}
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide">
            Enterprise Dashboard
          </h2>
          <p className="text-xs text-slate-400">
            Real-time logistical tracking analytics for Tume Bag Supply network.
          </p>
        </div>
        <button 
          onClick={fetchDashboardData} 
          disabled={loading}
          className="btn-secondary self-start flex items-center gap-2"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="Supply Qty (This Month)"
          value={summary?.month_qty?.toLocaleString() || '0'}
          icon={Layers}
          description="Total physical bags distributed"
          loading={loading}
        />
        <KPICard
          title="Supply Value (This Month)"
          value={formatCurrency(summary?.month_value || 0)}
          icon={TrendingUp}
          description="Total financial turnover of dispatches"
          loading={loading}
        />
        <KPICard
          title="Active Locations"
          value={summary?.active_locations || '0'}
          icon={MapPin}
          description="Warehouses & retail networks"
          loading={loading}
        />
        <KPICard
          title="Pending Shipments"
          value={summary?.pending_shipments || '0'}
          icon={Clock}
          description="Transit & dispatched status"
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend line chart */}
        <div className="lg:col-span-2 glass-card p-5 rounded-xl flex flex-col h-[320px]">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
            Quantity Trend (Last 30 Days)
          </h3>
          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="w-full h-full bg-slate-900/50 rounded animate-pulse"></div>
            ) : (
              <Line data={lineChartConfig} options={lineChartOptions} />
            )}
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="glass-card p-5 rounded-xl flex flex-col h-[320px]">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
            Status Distribution
          </h3>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {loading ? (
              <div className="w-40 h-40 rounded-full bg-slate-900/50 animate-pulse"></div>
            ) : (
              <div className="w-full h-full relative">
                <Pie data={pieChartConfig} options={pieChartOptions} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bar Chart & Recent Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Regions bar chart */}
        <div className="glass-card p-5 rounded-xl flex flex-col h-[320px]">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
            Top 5 Distribution Regions
          </h3>
          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="w-full h-full bg-slate-900/50 rounded animate-pulse"></div>
            ) : (
              <Bar data={barChartConfig} options={barChartOptions} />
            )}
          </div>
        </div>

        {/* Recent dispatches table */}
        <div className="lg:col-span-2 glass-card p-5 rounded-xl flex flex-col h-[320px] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Recent Supply Records
            </h3>
            <Link 
              to="/supply" 
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <DataTable
              columns={tableColumns}
              data={recentRecords}
              loading={loading}
              emptyMessage="No recent supply records found."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
