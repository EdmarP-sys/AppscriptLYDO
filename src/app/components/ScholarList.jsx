import React, { useState, useEffect } from 'react';
import { BARANGAYS } from '../api/_utils/constants';
import ScholarFormModal from './ScholarFormModal';

export default function ScholarList({ user }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBarangay, setFilterBarangay] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Modal States
  const [selectedApp, setSelectedApp] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedAfs, setGeneratedAfs] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [filterBarangay, filterStatus]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filterBarangay !== 'All') queryParams.append('barangay', filterBarangay);
      if (filterStatus !== 'All') queryParams.append('status', filterStatus);

      const res = await fetch(`/api/admin/listApplications?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setApplications(data);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusBadges = {
    'Pending': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Approved': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Rejected': 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  const handleOpenEncode = () => {
    setSelectedApp(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (app) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = (newAfs = null) => {
    setIsModalOpen(false);
    setSelectedApp(null);
    if (newAfs) {
      setGeneratedAfs(newAfs);
    }
    fetchApplications();
  };

  return (
    <div className="flex flex-col gap-6 w-full font-sans">
      {/* Header & Main Actions */}
      <div className="glass-panel rounded-xl p-6 border border-gold/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gold-gradient">Scholar List & Directory</h2>
          <p className="text-xs text-white/50 mt-1">Manage scholar profiles, encode physical applications, and edit details</p>
        </div>

        <button 
          onClick={handleOpenEncode}
          className="px-5 py-3 bg-gold-gradient text-forest-dark font-black tracking-wider uppercase text-xs rounded-lg flex items-center gap-2 hover:shadow-lg transition-all cursor-pointer glow-btn shrink-0"
        >
          <svg className="w-4 h-4 text-forest-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          Encode New Scholar
        </button>
      </div>

      {/* Generated Application No Notification */}
      {generatedAfs && (
        <div className="p-6 bg-gold/10 border border-gold/30 rounded-xl text-center flex flex-col gap-2 items-center relative animate-in zoom-in-95">
          <button 
            onClick={() => setGeneratedAfs(null)} 
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-all cursor-pointer"
          >
            &times;
          </button>
          <p className="text-xs text-white/60 uppercase tracking-widest font-semibold">Scholar Encoded Successfully!</p>
          <p className="text-[10px] text-white/40">Generated Application Number:</p>
          <h1 className="text-3xl font-black text-gold tracking-tight">{generatedAfs}</h1>
          <p className="text-xs text-white/50 mt-1">Please write this number down on the physical application form.</p>
        </div>
      )}

      {/* Filters Box */}
      <div className="glass-panel rounded-xl p-5 border border-gold/15 flex flex-wrap gap-4 items-center">
        {/* Barangay Filter */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40 uppercase font-semibold">Filter by Barangay</span>
          <select
            value={filterBarangay}
            onChange={e => setFilterBarangay(e.target.value)}
            className="input-field text-xs py-2 px-3 min-w-[160px] cursor-pointer"
          >
            <option value="All" className="bg-forest-dark text-white">All Barangays</option>
            {BARANGAYS.map(b => (
              <option key={b} value={b} className="bg-forest-dark text-white">{b}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40 uppercase font-semibold">Filter by Status</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="input-field text-xs py-2 px-3 min-w-[140px] cursor-pointer"
          >
            <option value="All" className="bg-forest-dark text-white">All Statuses</option>
            <option value="Pending" className="bg-forest-dark text-white">For Review</option>
            <option value="Approved" className="bg-forest-dark text-white">Approved</option>
            <option value="Rejected" className="bg-forest-dark text-white">Disapproved</option>
          </select>
        </div>

        {/* Refresh Button */}
        <div className="flex items-end self-end h-[38px]">
          <button
            onClick={fetchApplications}
            className="p-2 rounded-lg border border-gold/25 text-gold hover:bg-gold/10 transition-all cursor-pointer"
            title="Refresh logs"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grid List Table */}
      <div className="glass-panel rounded-xl p-6 border border-gold/15 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <svg className="animate-spin h-8 w-8 text-gold" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-white/40 text-xs">Fetching scholar records...</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center text-white/30 flex flex-col items-center gap-3">
            <svg className="w-12 h-12 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>No scholar applications found in system.</span>
          </div>
        ) : (
          <div className="overflow-x-auto w-full border border-white/5 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-gold/80 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Application No.</th>
                  <th className="py-4 px-6">Student Name</th>
                  <th className="py-4 px-6">Birthdate / Sex</th>
                  <th className="py-4 px-6">Barangay</th>
                  <th className="py-4 px-6">School Details</th>
                  <th className="py-4 px-6">Circumstances</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-white/80">
                {applications.map((app) => {
                  // Circumstances labels
                  const circs = [];
                  if (app.is_solo_parent_beneficiary) circs.push('Solo Parent');
                  if (app.is_orphan) circs.push('Orphan');
                  if (app.is_pwd) circs.push('PWD');
                  if (app.is_ip) circs.push('IP');
                  if (app.is_out_of_school_youth) circs.push('OSY');

                  const bdate = app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : '—';

                  return (
                    <tr key={app.id} className="hover:bg-white/5 transition-all">
                      <td className="py-4 px-6 font-semibold text-gold font-mono">{app.application_no}</td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-white">{app.student_full_name}</span>
                        <p className="text-xs text-white/40 mt-0.5">{app.email} • {app.contact_number}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span>{bdate}</span>
                        <p className="text-xs text-white/40 mt-0.5">{app.sex}</p>
                      </td>
                      <td className="py-4 px-6 text-white/70">{app.barangay}</td>
                      <td className="py-4 px-6">
                        <span>{app.school}</span>
                        <p className="text-xs text-white/40 mt-0.5">SY {app.school_year}</p>
                      </td>
                      <td className="py-4 px-6">
                        {circs.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {circs.map(c => (
                              <span key={c} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-white/60">
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-white/30 text-xs">None</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusBadges[app.status]}`}>
                          {app.status === 'Pending' ? 'For Review' : (app.status === 'Approved' ? 'Approved' : 'Disapproved')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenEdit(app)}
                          className="px-3 py-1.5 rounded border border-gold/40 text-gold hover:bg-gold/10 font-bold text-xs hover:shadow-md transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal (handles both Create and Edit) */}
      <ScholarFormModal
        isOpen={isModalOpen}
        application={selectedApp}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedApp(null);
        }}
        onSave={handleSaveSuccess}
      />
    </div>
  );
}
