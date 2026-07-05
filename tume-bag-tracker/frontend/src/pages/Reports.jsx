import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { downloadCsv } from '../api/downloadCsv';
import KPICard from '../components/KPICard';
import { useToast } from '../context/ToastContext';
import { 
  BarChart3, 
  Download, 
  Calendar,
  Layers,
  TrendingUp,
  Clock,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';

const Reports = () => {
  const { addToast } = useToast();

  const [preset, setPreset] = useState('month'); // today, week, month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Report states
  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Set dates based on preset
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date();

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'week') {
      const lastWeek = new Date(today.setDate(today.getDate() - 7));
      setStartDate(lastWeek.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      // adjust for timezone offset
      const firstOfMonthOffset = new Date(firstOfMonth.getTime() - firstOfMonth.getTimezoneOffset() * 60000);
      setStartDate(firstOfMonthOffset.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
    // For 'custom', don't overwrite user's selected dates
  }, [preset]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };

      const [
        summaryRes,
        trendRes,
        regionRes,
        productRes,
        statusRes
      ] = await Promise.all([
        axiosInstance.get('/api/reports/summary', { params }),
        axiosInstance.get('/api/reports/trend', { params }),
        axiosInstance.get('/api/reports/by-region', { params }),
        axiosInstance.get('/api/reports/by-product', { params }),
        axiosInstance.get('/api/reports/by-status', { params })
      ]);

      setSummary(summaryRes.data);
      setTrendData(trendRes.data || []);
      setRegionData(regionRes.data || []);
      setProductData(productRes.data || []);
      setStatusData(statusRes.data || []);
    } catch (err) {
      console.error('Error fetching reports datasets:', err);
      addToast('Error loading report analytics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Re-run report queries when date filters are locked
  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData();
    }
  }, [startDate, endDate]);

  const handleDownloadCSV = async () => {
    try {
      await downloadCsv(
        '/api/reports/export',
        { startDate: startDate || undefined, endDate: endDate || undefined },
        `tume_supply_report_${new Date().toISOString().split('T')[0]}.csv`
      );
      addToast('Report downloaded successfully.', 'success');
    } catch (err) {
      addToast('Failed to download CSV report.', 'error');
    }
  };

  // Format Currency (INR)
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // 1. Line Chart - Qty Trend over time
  const lineChartData = {
    labels: trendData.map(d => d.date),
    datasets: [
      {
        label: 'Quantity Distributed',
        data: trendData.map(d => d.total_qty),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.05)',
        fill: true,
        tension: 0.2,
        pointBackgroundColor: '#06b6d4'
      }
    ]
  };

  // 2. Bar Chart - Distribution by Region
  const regionChartData = {
    labels: regionData.map(d => d.region),
    datasets: [
      {
        label: 'Quantity',
        data: regionData.map(d => d.total_qty),
        backgroundColor: '#3b82f6',
        borderRadius: 4
      }
    ]
  };

  // 3. Bar Chart - Distribution by Product SKU
  const productChartData = {
    labels: productData.map(d => d.sku_code),
    datasets: [
      {
        label: 'Quantity Dispatched',
        data: productData.map(d => d.total_qty),
        backgroundColor: '#a855f7', // Purple
        borderRadius: 4
      }
    ]
  };

  // 4. Pie Chart - Status breakdown
  const statusChartData = {
    labels: statusData.map(d => d.status),
    datasets: [
      {
        data: statusData.map(d => d.total_qty),
        backgroundColor: ['#f59e0b', '#3b82f6', '#06b6d4', '#10b981', '#ef4444'],
        borderWidth: 1,
        borderColor: '#0f172a'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#0f172a', padding: 8 }
    },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 9 } }, grid: { display: false } },
      y: { ticks: { color: '#64748b', font: { size: 9 } }, grid: { color: 'rgba(255, 255, 255, 0.04)' } }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide">
            Distribution Reports
          </h2>
          <p className="text-xs text-slate-400">
            Formulate date-filtered logistical reports and audit stock distributions.
          </p>
        </div>

        <button onClick={handleDownloadCSV} className="btn-primary text-xs self-start">
          <Download size={14} />
          <span>Export Filtered CSV</span>
        </button>
      </div>

      {/* Date Range Controller toolbar */}
      <div className="glass-card p-5 rounded-xl border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Preset selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 self-start">
          <button
            onClick={() => setPreset('today')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${preset === 'today' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Today
          </button>
          <button
            onClick={() => setPreset('week')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${preset === 'week' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
          >
            This Week
          </button>
          <button
            onClick={() => setPreset('month')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${preset === 'month' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
          >
            This Month
          </button>
          <button
            onClick={() => setPreset('custom')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${preset === 'custom' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Custom Range
          </button>
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold uppercase">From</span>
            <input
              type="date"
              disabled={preset !== 'custom'}
              className="form-input text-xs py-1.5 w-36 disabled:opacity-50 disabled:cursor-not-allowed"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold uppercase">To</span>
            <input
              type="date"
              disabled={preset !== 'custom'}
              className="form-input text-xs py-1.5 w-36 disabled:opacity-50 disabled:cursor-not-allowed"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button 
            onClick={fetchReportData} 
            disabled={loading}
            title="Reload reports"
            className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="Period Total Qty"
          value={summary?.total_qty?.toLocaleString() || '0'}
          icon={Layers}
          description="Total physical bags distributed"
          loading={loading}
        />
        <KPICard
          title="Period Turnover Value"
          value={formatCurrency(summary?.total_value || 0)}
          icon={TrendingUp}
          description="Turnover value of deliveries"
          loading={loading}
        />
        <KPICard
          title="Period Log Entries"
          value={summary?.total_records || '0'}
          icon={BarChart3}
          description="Total supply records logged"
          loading={loading}
        />
        <KPICard
          title="Shipments Pending"
          value={summary?.pending_shipments || '0'}
          icon={Clock}
          description="Transit & dispatched status"
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Qty Trend Chart */}
        <div className="glass-card p-5 rounded-xl flex flex-col h-80">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Calendar size={14} className="text-cyan-400" />
            <span>Quantity Trend over time</span>
          </h3>
          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="w-full h-full bg-slate-900/50 rounded animate-pulse"></div>
            ) : trendData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">No trend data available for this range.</div>
            ) : (
              <Line data={lineChartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Region Breakdown Chart */}
        <div className="glass-card p-5 rounded-xl flex flex-col h-80">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <MapPin size={14} className="text-cyan-400" />
            <span>Distribution by Region</span>
          </h3>
          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="w-full h-full bg-slate-900/50 rounded animate-pulse"></div>
            ) : regionData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">No regional data available.</div>
            ) : (
              <Bar data={regionChartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Product SKU Distribution Chart */}
        <div className="glass-card p-5 rounded-xl flex flex-col h-80">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Layers size={14} className="text-cyan-400" />
            <span>Distribution by Product SKU</span>
          </h3>
          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="w-full h-full bg-slate-900/50 rounded animate-pulse"></div>
            ) : productData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">No product SKU data available.</div>
            ) : (
              <Bar data={productChartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Status distribution chart */}
        <div className="glass-card p-5 rounded-xl flex flex-col h-80">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Clock size={14} className="text-cyan-400" />
            <span>Status breakdown (by Quantity)</span>
          </h3>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {loading ? (
              <div className="w-40 h-40 rounded-full bg-slate-900/50 animate-pulse"></div>
            ) : statusData.length === 0 ? (
              <div className="text-xs text-slate-500">No status data available.</div>
            ) : (
              <div className="w-full h-full relative">
                <Pie 
                  data={statusChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'right', labels: { color: '#cbd5e1', font: { size: 10 } } }
                    }
                  }} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
