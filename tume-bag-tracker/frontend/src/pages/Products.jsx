import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

const Products = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form states
  const [skuCode, setSkuCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Jute');
  const [unitSize, setUnitSize] = useState('50kg');
  const [unitPrice, setUnitPrice] = useState(0.00);
  const [reorderLevel, setReorderLevel] = useState(100);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/products?search=${search}`);
      setProducts(response.data.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      addToast('Error loading product SKUs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setSkuCode('');
    setName('');
    setCategory('Jute');
    setUnitSize('50kg');
    setUnitPrice(0.00);
    setReorderLevel(100);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setSkuCode(product.sku_code);
    setName(product.name);
    setCategory(product.category);
    setUnitSize(product.unit_size);
    setUnitPrice(product.unit_price);
    setReorderLevel(product.reorder_level);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!skuCode || !name || !category || !unitSize || unitPrice === undefined || reorderLevel === undefined) {
      addToast('Please fill out all required fields.', 'warning');
      return;
    }

    try {
      const body = {
        sku_code: skuCode,
        name,
        category,
        unit_size: unitSize,
        unit_price: parseFloat(unitPrice),
        reorder_level: parseInt(reorderLevel)
      };

      if (editingProduct) {
        await axiosInstance.put(`/api/products/${editingProduct.id}`, body);
        addToast('Product SKU updated successfully.', 'success');
      } else {
        await axiosInstance.post('/api/products', body);
        addToast('Product SKU created successfully.', 'success');
      }
      
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving product SKU.';
      addToast(msg, 'error');
    }
  };

  const handleDelete = async (product) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete product SKU ${product.sku_code}? This is a soft-delete and will hide the product from new logs.`);
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`/api/products/${product.id}`);
      addToast('Product SKU deleted successfully.', 'success');
      fetchProducts();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete product.';
      addToast(msg, 'error');
    }
  };

  // Format Currency (INR)
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  const tableColumns = [
    { key: 'sku_code', label: 'SKU Code', render: (row) => (
      <span className="font-mono text-cyan-400 font-bold">{row.sku_code}</span>
    )},
    { key: 'name', label: 'Product Details', render: (row) => (
      <div>
        <div className="font-bold text-slate-200">{row.name}</div>
        <span className="text-[10px] text-slate-500 font-bold uppercase">{row.category} — Size: {row.unit_size}</span>
      </div>
    )},
    { key: 'unit_price', label: 'Unit Price', render: (row) => (
      <span className="font-bold text-slate-350">{formatCurrency(row.unit_price)}</span>
    )},
    { key: 'reorder_level', label: 'Reorder Level', render: (row) => (
      <span className="font-semibold text-slate-400">{row.reorder_level.toLocaleString()} units</span>
    )},
    { key: 'total_stock', label: 'Total Current Stock', render: (row) => {
      const isLow = row.total_stock < row.reorder_level;
      return (
        <span className={`font-black ${isLow ? 'text-rose-450' : 'text-slate-100'}`}>
          {row.total_stock.toLocaleString()} units
          {isLow && <span className="text-[9px] block text-rose-500 font-bold">(BELOW REORDER THRESHOLD)</span>}
        </span>
      );
    }},
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        {user?.role !== 'VIEWER' && (
          <button
            onClick={() => handleOpenEditModal(row)}
            title="Edit SKU"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 rounded border border-slate-700 transition-colors"
          >
            <Edit size={14} />
          </button>
        )}

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => handleDelete(row)}
            title="Soft Delete SKU"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide">
            Product SKUs catalog
          </h2>
          <p className="text-xs text-slate-400">
            Define manufacturing bags, pricing matrix, and safety stock thresholds.
          </p>
        </div>

        {user?.role !== 'VIEWER' && (
          <button onClick={handleOpenAddModal} className="btn-primary text-xs self-start">
            <Plus size={14} />
            <span>Register New SKU</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-850 max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Search SKU code, name or category..."
            className="form-input text-xs py-2 pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={14} className="absolute left-2.5 top-3 text-slate-500" />
        </div>
      </div>

      {/* Datatable */}
      <div className="glass-card p-4 rounded-xl border border-slate-850">
        <DataTable
          columns={tableColumns}
          data={products}
          loading={loading}
          emptyMessage="No bag products found."
        />
      </div>

      {/* Modal: Add/Edit Product */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product SKU' : 'Register New Bag SKU'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* SKU Code */}
            <div className="col-span-2">
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                SKU Code <span className="text-cyan-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!!editingProduct} // SKU code should not be editable after creation
                placeholder="e.g. TB-JUTE-50"
                className="form-input text-xs disabled:opacity-50 disabled:bg-slate-800 disabled:cursor-not-allowed"
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value.toUpperCase())}
              />
            </div>

            {/* Product Name */}
            <div className="col-span-2">
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                Bag Description Name <span className="text-cyan-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tume Premium Jute Bag 50kg"
                className="form-input text-xs"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Category */}
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                Category <span className="text-cyan-500">*</span>
              </label>
              <select
                required
                className="form-input text-xs"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Jute">Jute</option>
                <option value="Plastic">Plastic</option>
                <option value="Cloth">Cloth</option>
                <option value="Paper">Paper</option>
              </select>
            </div>

            {/* Unit Size */}
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                Unit Size Capacity <span className="text-cyan-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 50kg, 25kg, 10kg"
                className="form-input text-xs"
                value={unitSize}
                onChange={(e) => setUnitSize(e.target.value)}
              />
            </div>

            {/* Unit Price */}
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                Standard Unit Price (₹) <span className="text-cyan-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="form-input text-xs"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>

            {/* Reorder Level */}
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                Safety Reorder level <span className="text-cyan-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                className="form-input text-xs"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Math.max(1, parseInt(e.target.value) || 0))}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Product SKU
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;
