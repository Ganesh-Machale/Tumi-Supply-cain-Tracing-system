import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { downloadCsv } from '../api/downloadCsv';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2, 
  Download, 
  Calendar,
  X 
} from 'lucide-react';

const Supply = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  // Data lists
  const [records, setRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filters State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  
  const [searchProduct, setSearchProduct] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);

  // Form States (Add Supply)
  const [formProduct, setFormProduct] = useState('');
  const [formFromLoc, setFormFromLoc] = useState('');
  const [formToLoc, setFormToLoc] = useState('');
  const [formQty, setFormQty] = useState(1);
  const [formPrice, setFormPrice] = useState(0);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState('PENDING');

  // Form State (Edit Status)
  const [newStatus, setNewStatus] = useState('PENDING');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        status: filterStatus || undefined,
        region: filterRegion || undefined,
        product: searchProduct || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };
      
      const response = await axiosInstance.get('/api/supply', { params });
      setRecords(response.data.records);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching supply records:', err);
      addToast('Failed to load supply records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiltersOptions = async () => {
    try {
      const [prodRes, locRes] = await Promise.all([
        axiosInstance.get('/api/products'),
        axiosInstance.get('/api/locations')
      ]);
      setProducts(prodRes.data.products || []);
      setLocations(locRes.data || []);
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, filterStatus, filterRegion, startDate, endDate]);

  useEffect(() => {
    fetchFiltersOptions();
  }, []);

  // Trigger search on debounce or text input submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const handleClearFilters = () => {
    setSearchProduct('');
    setFilterStatus('');
    setFilterRegion('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Populate unit price when product is selected in Form
  useEffect(() => {
    if (formProduct) {
      const selected = products.find(p => p.id === parseInt(formProduct));
      if (selected) {
        setFormPrice(selected.unit_price);
      }
    }
  }, [formProduct, products]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formProduct || !formFromLoc || !formToLoc || !formQty || !formPrice || !formDate) {
      addToast('Please fill out all required fields.', 'warning');
      return;
    }

    if (parseInt(formQty) <= 0) {
      addToast('Quantity must be greater than zero.', 'warning');
      return;
    }

    try {
      const body = {
        product_id: parseInt(formProduct),
        from_location_id: parseInt(formFromLoc),
        to_location_id: parseInt(formToLoc),
        quantity: parseInt(formQty),
        unit_price: parseFloat(formPrice),
        supply_date: formDate,
        status: formStatus,
        notes: formNotes
      };

      await axiosInstance.post('/api/supply', body);
      addToast('Supply record created successfully.', 'success');
      setIsAddModalOpen(false);
      
      // Reset Form
      setFormProduct('');
      setFormFromLoc('');
      setFormToLoc('');
      setFormQty(1);
      setFormPrice(0);
      setFormNotes('');
      setFormStatus('PENDING');
      setFormDate(new Date().toISOString().split('T')[0]);

      // Sync Navbar & list
      window.dispatchEvent(new Event('alertsUpdated'));
      fetchRecords();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error creating record.';
      addToast(msg, 'error');
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/api/supply/${activeRecord.id}/status`, { status: newStatus });
      addToast(`Status updated to ${newStatus}.`, 'success');
      setIsStatusModalOpen(false);
      window.dispatchEvent(new Event('alertsUpdated'));
      fetchRecords();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error updating status.';
      addToast(msg, 'error');
    }
  };

  const handleCancelRecord = async (record) => {
    const confirmCancel = window.confirm(`Are you sure you want to CANCEL record ${record.reference_no}? This action will adjust inventories and cannot be undone.`);
    if (!confirmCancel) return;

    try {
      await axiosInstance.delete(`/api/supply/${record.id}`);
      addToast('Supply record cancelled successfully.', 'success');
      window.dispatchEvent(new Event('alertsUpdated'));
      fetchRecords();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to cancel record.';
      addToast(msg, 'error');
    }
  };

  const handleExportCSV = async () => {
    try {
      await downloadCsv(
        '/api/reports/export',
        {
          status: filterStatus || undefined,
          region: filterRegion || undefined,
          product: searchProduct || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
        `tume_supply_report_${new Date().toISOString().split('T')[0]}.csv`
      );
      addToast('Supply report downloaded successfully.', 'success');
    } catch (err) {
      addToast('Failed to export CSV report.', 'error');
    }
  };

  // Helper lists for dropdowns
  const warehouses = locations.filter(l => l.type === 'WAREHOUSE');
  const destinations = locations.filter(l => l.type === 'DISTRIBUTOR' || l.type === 'RETAILER');

  // Format Currency (INR)
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  const tableColumns = [
    { key: 'reference_no', label: 'Ref No', render: (row) => (
      <span className="font-mono text-cyan-400 font-bold">{row.reference_no}</span>
    )},
    { key: 'product_name', label: 'Product SKU', render: (row) => (
      <div>
        <div className="font-bold text-slate-200">{row.product_sku}</div>
        <span className="text-[11px] text-slate-500 line-clamp-1">{row.product_name}</span>
      </div>
    )},
    { key: 'from_location_name', label: 'From', render: (row) => (
      <div>
        <div className="font-medium text-slate-300 truncate max-w-[120px]">{row.from_location_name}</div>
        <span className="text-[10px] text-slate-500 uppercase">{row.from_location_type}</span>
      </div>
    )},
    { key: 'to_location_name', label: 'To', render: (row) => (
      <div>
        <div className="font-medium text-slate-300 truncate max-w-[120px]">{row.to_location_name}</div>
        <span className="text-[10px] text-slate-500 uppercase">{row.to_location_type}</span>
      </div>
    )},
    { key: 'quantity', label: 'Qty', render: (row) => (
      <span className="font-bold">{row.quantity.toLocaleString()}</span>
    )},
    { key: 'total_value', label: 'Value', render: (row) => (
      <span className="font-bold text-slate-200">{formatCurrency(row.total_value)}</span>
    )},
    { key: 'supply_date', label: 'Date', render: (row) => (
      <span className="text-xs text-slate-400">
        {new Date(row.supply_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
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
    )},
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setActiveRecord(row);
            setIsViewModalOpen(true);
          }}
          title="View Details"
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 rounded border border-slate-700 transition-colors"
        >
          <Eye size={14} />
        </button>

        {user?.role !== 'VIEWER' && row.status !== 'CANCELLED' && (
          <button
            onClick={() => {
              setActiveRecord(row);
              setNewStatus(row.status);
              setIsStatusModalOpen(true);
            }}
            title="Edit Status"
            className="p-1.5 bg-slate-800 hover:bg-slate-750 text-cyan-400 hover:text-cyan-300 rounded border border-slate-700 transition-colors"
          >
            <Edit3 size={14} />
          </button>
        )}

        {user?.role === 'ADMIN' && row.status !== 'CANCELLED' && (
          <button
            onClick={() => handleCancelRecord(row)}
            title="Cancel Record"
            className="p-1.5 bg-slate-850 hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 rounded border border-slate-700 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    )}
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide">
            Supply Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Monitor and distribute supply quantities across warehouses and retail hubs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="btn-secondary text-xs">
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          
          {user?.role !== 'VIEWER' && (
            <button 
              onClick={() => setIsAddModalOpen(true)} 
              className="btn-primary text-xs"
            >
              <Plus size={14} />
              <span>Add Supply Transfer</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-5 rounded-xl border border-slate-850/80">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Text Search */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Product SKU / Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="form-input text-xs py-2 pl-8"
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                />
                <Search size={14} className="absolute left-2.5 top-3 text-slate-500" />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Status
              </label>
              <select
                className="form-input text-xs py-2"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="DISPATCHED">DISPATCHED</option>
                <option value="IN_TRANSIT">IN TRANSIT</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            {/* Region Filter */}
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

            {/* Date Range Start */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                From Date
              </label>
              <input
                type="date"
                className="form-input text-xs py-2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Date Range End */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                To Date
              </label>
              <input
                type="date"
                className="form-input text-xs py-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
            <span className="text-[10px] text-slate-500 font-medium">
              Filters adjust results dynamically.
            </span>
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={handleClearFilters}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Reset All
              </button>
              <button type="submit" className="btn-secondary text-xs px-5 py-1.5">
                <Filter size={12} />
                <span>Apply Filters</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Main Table */}
      <div className="glass-card p-4 rounded-xl border border-slate-850/80">
        <DataTable
          columns={tableColumns}
          data={records}
          loading={loading}
          emptyMessage="No supply records match the current filters."
          pagination={{
            page,
            totalPages,
            onPageChange: (newPage) => setPage(newPage)
          }}
        />
      </div>

      {/* Modal: Add Supply Transfer */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Supply Transfer"
        size="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product SKU */}
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                Product SKU <span className="text-cyan-500">*</span>
              </label>
              <select
                required
                className="form-input text-xs"
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
              >
                <option value="">Select Bag SKU</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.sku_code} — {p.name} (₹{p.unit_price})
                  </option>
                ))}
              </select>
            </div>

            {/* Supply Date */}
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                Supply Date <span className="text-cyan-500">*</span>
              </label>
              <input
                type="date"
                required
                className="form-input text-xs"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            {/* From Location (WAREHOUSE) */}
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                From Location (Warehouse) <span className="text-cyan-500">*</span>
              </label>
              <select
                required
                className="form-input text-xs"
                value={formFromLoc}
                onChange={(e) => setFormFromLoc(e.target.value)}
              >
                <option value="">Select Source Warehouse</option>
                {warehouses.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.region})</option>
                ))}
              </select>
            </div>

            {/* To Location (DISTRIBUTOR / RETAILER) */}
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                To Location (Distributor/Retailer) <span className="text-cyan-500">*</span>
              </label>
              <select
                required
                className="form-input text-xs"
                value={formToLoc}
                onChange={(e) => setFormToLoc(e.target.value)}
              >
                <option value="">Select Destination Hub</option>
                {destinations.map(l => (
                  <option key={l.id} value={l.id}>{l.name} [{l.type}] ({l.region})</option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                Quantity <span className="text-cyan-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                className="form-input text-xs"
                value={formQty}
                onChange={(e) => setFormQty(Math.max(1, parseInt(e.target.value) || 0))}
              />
            </div>

            {/* Unit Price */}
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                Unit Price (₹) <span className="text-cyan-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="form-input text-xs"
                value={formPrice}
                onChange={(e) => setFormPrice(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>

            {/* Initial Status */}
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                Initial Status
              </label>
              <select
                className="form-input text-xs"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
              >
                <option value="PENDING">PENDING</option>
                <option value="DISPATCHED">DISPATCHED</option>
                <option value="IN_TRANSIT">IN TRANSIT</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>
            </div>

            {/* Calculated Total Value */}
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                Calculated Total Value (₹)
              </label>
              <div className="form-input text-xs bg-slate-800 border-slate-700/60 flex items-center font-bold text-slate-100 select-none">
                {formatCurrency(formQty * formPrice)}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="form-label font-bold text-xs uppercase text-slate-400">
              Transaction Notes
            </label>
            <textarea
              className="form-input text-xs min-h-16 resize-y"
              placeholder="Provide delivery manifests, trucker details, or specific logistics instructions..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button 
              type="button" 
              onClick={() => setIsAddModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Transfer Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Details */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Supply Record Details"
        size="md"
      >
        {activeRecord && (
          <div className="space-y-5 text-sm">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Reference No</span>
                <span className="font-mono text-cyan-400 font-black text-lg">{activeRecord.reference_no}</span>
              </div>
              <span className={`px-3 py-1 text-xs font-black rounded-full ${
                activeRecord.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                activeRecord.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                activeRecord.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
              }`}>
                {activeRecord.status}
              </span>
            </div>

            {/* Grid stats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Product SKU</span>
                <span className="font-bold text-slate-200">{activeRecord.product_sku}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Product Name</span>
                <span className="text-slate-300">{activeRecord.product_name}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Origin (From)</span>
                <span className="text-slate-300 font-bold">{activeRecord.from_location_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Destination (To)</span>
                <span className="text-slate-300 font-bold">{activeRecord.to_location_name}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Quantity</span>
                <span className="font-bold text-slate-200">{activeRecord.quantity.toLocaleString()} units</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Financial Value</span>
                <span className="font-extrabold text-cyan-400">{formatCurrency(activeRecord.total_value)}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Supply Date</span>
                <span className="text-slate-300">
                  {new Date(activeRecord.supply_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Registered By</span>
                <span className="text-slate-350">{activeRecord.creator_name || 'System'}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mt-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Logistics Notes</span>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {activeRecord.notes || 'No notes provided for this transaction.'}
              </p>
            </div>

            <div className="flex items-center justify-end pt-3">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="btn-secondary text-xs px-6 py-2"
              >
                Close View
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Edit Status */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Dispatch Status"
        size="sm"
      >
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          {activeRecord && (
            <div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Update status for <strong className="text-cyan-400">{activeRecord.reference_no}</strong> transferring <strong className="text-slate-200">{activeRecord.quantity}</strong> bags of <strong className="text-slate-200">{activeRecord.product_sku}</strong>.
              </p>

              <label className="form-label font-bold text-xs uppercase text-slate-400">
                New Logistics Status
              </label>
              <select
                className="form-input text-xs"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="PENDING">PENDING</option>
                <option value="DISPATCHED">DISPATCHED</option>
                <option value="IN_TRANSIT">IN TRANSIT</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>

              {newStatus === 'DELIVERED' && (
                <div className="mt-3 p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-400 font-semibold leading-relaxed">
                  Notice: Setting status to DELIVERED will automatically execute inventory deductions at source and additions at destination.
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button 
              type="button" 
              onClick={() => setIsStatusModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Update Status
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Supply;
