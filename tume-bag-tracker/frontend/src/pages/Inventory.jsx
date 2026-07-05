import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import DataTable from '../components/DataTable';
import { useToast } from '../context/ToastContext';
import { 
  Download, 
  Search, 
  Layers, 
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Boxes
} from 'lucide-react';

const Inventory = () => {
  const { addToast } = useToast();
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchProduct, setSearchProduct] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterRegion, setFilterRegion] = useState('');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/inventory');
      setInventory(response.data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      addToast('Error loading inventory levels.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [prodRes, locRes] = await Promise.all([
        axiosInstance.get('/api/products'),
        axiosInstance.get('/api/locations')
      ]);
      setProducts(prodRes.data.products || []);
      setLocations(locRes.data || []);
    } catch (err) {
      console.error('Error loading filters in inventory page:', err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchFilters();
  }, []);

  // Filter logic on client-side (real-time filtering for better experience)
  const filteredInventory = inventory.filter((item) => {
    const matchesProduct = searchProduct
      ? item.product_name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        item.product_sku.toLowerCase().includes(searchProduct.toLowerCase())
      : true;

    const matchesType = filterType ? item.location_type === filterType : true;
    const matchesRegion = filterRegion ? item.location_region === filterRegion : true;

    return matchesProduct && matchesType && matchesRegion;
  });

  // Calculate stock health status
  const getStockHealth = (qty, reorderLevel) => {
    if (qty < reorderLevel) return { label: 'CRITICAL', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: ShieldAlert };
    if (qty < reorderLevel * 1.5) return { label: 'WARNING', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: AlertTriangle };
    return { label: 'HEALTHY', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 };
  };

  // Client-side CSV export
  const handleExportCSV = () => {
    if (filteredInventory.length === 0) {
      addToast('No data available to export.', 'warning');
      return;
    }

    const csvHeaders = ['Product SKU', 'Product Name', 'Product Category', 'Location Name', 'Location Type', 'Region', 'Current Quantity', 'Reorder Level', 'Status'];
    const rows = filteredInventory.map(item => {
      const health = getStockHealth(item.current_quantity, item.product_reorder_level);
      return [
        item.product_sku,
        item.product_name,
        item.product_category,
        item.location_name,
        item.location_type,
        item.location_region,
        item.current_quantity,
        item.product_reorder_level,
        health.label
      ];
    });

    const csvContent = [
      csvHeaders.join(','),
      ...rows.map(row => row.map(val => {
        const str = String(val);
        return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tume_inventory_levels_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Downloaded inventory levels CSV successfully.', 'success');
  };

  const tableColumns = [
    { key: 'product_sku', label: 'Product SKU', render: (row) => (
      <span className="font-bold text-slate-200">{row.product_sku}</span>
    )},
    { key: 'product_name', label: 'Product Name', render: (row) => (
      <div>
        <div className="font-semibold text-slate-350">{row.product_name}</div>
        <span className="text-[10px] text-slate-500 font-bold uppercase">{row.product_category}</span>
      </div>
    )},
    { key: 'location_name', label: 'Location', render: (row) => (
      <div>
        <div className="font-semibold text-slate-350">{row.location_name}</div>
        <span className="text-[10px] text-slate-500 font-bold uppercase mr-2">{row.location_type}</span>
        <span className="text-[10px] text-cyan-400 font-bold">{row.location_region}</span>
      </div>
    )},
    { key: 'current_quantity', label: 'Current Qty', render: (row) => (
      <span className="font-bold text-slate-100">{row.current_quantity.toLocaleString()}</span>
    )},
    { key: 'product_reorder_level', label: 'Reorder Level', render: (row) => (
      <span className="font-medium text-slate-400">{row.product_reorder_level.toLocaleString()}</span>
    )},
    { key: 'health_status', label: 'Stock Health', render: (row) => {
      const health = getStockHealth(row.current_quantity, row.product_reorder_level);
      const HealthIcon = health.icon;
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${health.color}`}>
          <HealthIcon size={12} />
          {health.label}
        </span>
      );
    }},
    { key: 'last_updated', label: 'Last Sync', render: (row) => (
      <span className="text-xs text-slate-500">
        {new Date(row.last_updated).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
      </span>
    )}
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide">
            Inventory Grid
          </h2>
          <p className="text-xs text-slate-400">
            Real-time tracking of current bag quantities across all supply destinations.
          </p>
        </div>

        <button onClick={handleExportCSV} className="btn-secondary text-xs self-start">
          <Download size={14} />
          <span>Export Inventory CSV</span>
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-xl border border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Tracked Items</span>
            <span className="text-2xl font-black text-slate-100 mt-1 block">{filteredInventory.length}</span>
          </div>
          <Boxes className="text-cyan-400" size={24} />
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Low Stock Alert Items</span>
            <span className="text-2xl font-black text-rose-450 mt-1 block">
              {filteredInventory.filter(i => i.current_quantity < i.product_reorder_level).length}
            </span>
          </div>
          <AlertTriangle className="text-rose-500" size={24} />
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Healthy Stock Items</span>
            <span className="text-2xl font-black text-emerald-450 mt-1 block">
              {filteredInventory.filter(i => i.current_quantity >= i.product_reorder_level * 1.5).length}
            </span>
          </div>
          <CheckCircle2 className="text-emerald-400" size={24} />
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="glass-card p-5 rounded-xl border border-slate-850">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search bar */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Search SKU or Bag Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search bags..."
                className="form-input text-xs py-2 pl-8"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
              />
              <Search size={14} className="absolute left-2.5 top-3 text-slate-500" />
            </div>
          </div>

          {/* Location Type */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Location Type
            </label>
            <select
              className="form-input text-xs py-2"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="WAREHOUSE">WAREHOUSE</option>
              <option value="DISTRIBUTOR">DISTRIBUTOR</option>
              <option value="RETAILER">RETAILER</option>
            </select>
          </div>

          {/* Region */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Region
            </label>
            <select
              className="form-input text-xs py-2"
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
            >
              <option value="">All Regions</option>
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Nashik">Nashik</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card p-4 rounded-xl border border-slate-850">
        <DataTable
          columns={tableColumns}
          data={filteredInventory}
          loading={loading}
          emptyMessage="No inventory entries match your criteria."
        />
      </div>
    </div>
  );
};

export default Inventory;
