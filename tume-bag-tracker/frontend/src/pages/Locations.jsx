import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Search, Edit3, Phone, User as UserIcon } from 'lucide-react';

const Locations = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filterType, setFilterType] = useState('');
  const [filterRegion, setFilterRegion] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('WAREHOUSE');
  const [region, setRegion] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const params = {
        type: filterType || undefined,
        region: filterRegion || undefined
      };
      const response = await axiosInstance.get('/api/locations', { params });
      setLocations(response.data || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
      addToast('Error loading locations directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [filterType, filterRegion]);

  const handleOpenAddModal = () => {
    setEditingLocation(null);
    setName('');
    setType('WAREHOUSE');
    setRegion('Pune');
    setState('Maharashtra');
    setContactPerson('');
    setPhone('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (loc) => {
    setEditingLocation(loc);
    setName(loc.name);
    setType(loc.type);
    setRegion(loc.region);
    setState(loc.state);
    setContactPerson(loc.contact_person);
    setPhone(loc.phone);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !type || !region || !state || !contactPerson || !phone) {
      addToast('All fields are required.', 'warning');
      return;
    }

    try {
      const body = {
        name,
        type,
        region,
        state,
        contact_person: contactPerson,
        phone
      };

      if (editingLocation) {
        await axiosInstance.put(`/api/locations/${editingLocation.id}`, body);
        addToast('Location updated successfully.', 'success');
      } else {
        await axiosInstance.post('/api/locations', body);
        addToast('Location added successfully.', 'success');
      }

      setIsModalOpen(false);
      fetchLocations();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving location details.';
      addToast(msg, 'error');
    }
  };

  const tableColumns = [
    { key: 'name', label: 'Name', render: (row) => (
      <span className="font-bold text-slate-100">{row.name}</span>
    )},
    { key: 'type', label: 'Type', render: (row) => (
      <span className={`inline-block px-2.5 py-1 text-[9px] font-extrabold rounded-full ${
        row.type === 'WAREHOUSE' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
        row.type === 'DISTRIBUTOR' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      }`}>
        {row.type}
      </span>
    )},
    { key: 'region', label: 'Region & State', render: (row) => (
      <div>
        <div className="font-bold text-slate-350">{row.region}</div>
        <span className="text-[10px] text-slate-500 block">{row.state}</span>
      </div>
    )},
    { key: 'contact_person', label: 'Contact Representative', render: (row) => (
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-xs text-slate-300">
          <UserIcon size={12} className="text-slate-500" />
          {row.contact_person}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
          <Phone size={11} />
          {row.phone}
        </span>
      </div>
    )},
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => handleOpenEditModal(row)}
            title="Edit Location"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 rounded border border-slate-700 transition-colors"
          >
            <Edit3 size={14} />
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
            Locations Registry
          </h2>
          <p className="text-xs text-slate-400">
            Establish and audit warehouses, distributor channels, and partner retailers.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button onClick={handleOpenAddModal} className="btn-primary text-xs self-start">
            <Plus size={14} />
            <span>Register Location</span>
          </button>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="glass-card p-4 rounded-xl border border-slate-850">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
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

      {/* Table */}
      <div className="glass-card p-4 rounded-xl border border-slate-850">
        <DataTable
          columns={tableColumns}
          data={locations}
          loading={loading}
          emptyMessage="No locations found matching the criteria."
        />
      </div>

      {/* Modal: Add/Edit Location */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLocation ? 'Edit Location Details' : 'Register New Hub Location'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Location Name */}
            <div className="col-span-2">
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                Location Name <span className="text-cyan-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pune Central Depot"
                className="form-input text-xs"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Type */}
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                Category Type <span className="text-cyan-500">*</span>
              </label>
              <select
                required
                className="form-input text-xs"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="WAREHOUSE">WAREHOUSE</option>
                <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                <option value="RETAILER">RETAILER</option>
              </select>
            </div>

            {/* Region */}
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                Logistical Region <span className="text-cyan-500">*</span>
              </label>
              <select
                required
                className="form-input text-xs"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Nashik">Nashik</option>
              </select>
            </div>

            {/* State */}
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                State <span className="text-cyan-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maharashtra"
                className="form-input text-xs"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                Phone Number <span className="text-cyan-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 9876543210"
                className="form-input text-xs"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Contact Person */}
            <div className="col-span-2">
              <label className="form-label font-bold text-xs uppercase text-slate-400">
                Primary Contact Representative <span className="text-cyan-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sanjay Kale"
                className="form-input text-xs"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
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
              Save Location details
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Locations;
