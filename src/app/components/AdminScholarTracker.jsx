import React, { useState, useEffect } from 'react';
import { BARANGAYS } from '../api/_utils/constants';
import EvaluationModal from './EvaluationModal';

export default function AdminScholarTracker() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBarangay, setFilterBarangay] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Modal Evaluation States
  const [selectedApp, setSelectedApp] = useState(null);
  const [isEvalOpen, setIsEvalOpen] = useState(false);

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
    'Under Evaluation': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Approved': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Rejected': 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  return (
    <div className="flex flex-col gap-6 w-full font-sans">
      {/* Tracker Headers & Filters */}
      <div className="glass-panel rounded-xl p-6 border border-gold/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gold-gradient">Scholar Applications Tracker</h2>
          <p className="text-xs text-white/50 mt-1">Review applicant profiles and submit official grading scores</p>
        </div>

        <div className="flex flex-wrap gap-3">
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
              <option value="Pending" className="bg-forest-dark text-white">Pending</option>
              <option value="Under Evaluation" className="bg-forest-dark text-white">Under Evaluation</option>
              <option value="Approved" className="bg-forest-dark text-white">Approved</option>
              <option value="Rejected" className="bg-forest-dark text-white">Rejected</option>
            </select>
          </div>

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={fetchApplications}
              className="p-2.5 rounded-lg border border-gold/25 text-gold hover:bg-gold/10 transition-all cursor-pointer"
              title="Refresh logs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="glass-panel rounded-xl p-6 border border-gold/15 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <svg className="animate-spin h-8 w-8 text-gold" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-white/40 text-xs">Fetching applications list...</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center text-white/30 flex flex-col items-center gap-3">
            <svg className="w-12 h-12 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>No financial assistance applications found matching filters.</span>
          </div>
        ) : (
          <div className="overflow-x-auto w-full border border-white/5 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-gold/80 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Scholar Name</th>
                  <th className="py-4 px-6">Barangay</th>
                  <th className="py-4 px-6">School / Course</th>
                  <th className="py-4 px-6">GWA</th>
                  <th className="py-4 px-6">Score</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-white/80">
                {applications.map((app, i) => (
                  <tr key={app.id} className="hover:bg-white/5 transition-all">
                    <td className="py-4 px-6 font-semibold text-white">
                      {app.last_name}, {app.first_name}
                      <p className="text-[10px] text-white/40 font-mono mt-0.5">{app.username}</p>
                    </td>
                    <td className="py-4 px-6 text-white/70">{app.barangay}</td>
                    <td className="py-4 px-6 text-white/70 max-w-[200px] truncate">
                      {app.school_enrolled}
                      <p className="text-xs text-white/40 truncate">{app.course_program} ({app.year_level})</p>
                    </td>
                    <td className="py-4 px-6 font-semibold text-gold">{app.gwa}</td>
                    <td className="py-4 px-6 font-bold">
                      {app.score_total > 0 ? `${app.score_total} / 100` : '—'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusBadges[app.status]}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setIsEvalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded bg-gold-gradient text-forest-dark font-bold text-xs hover:shadow-md transition-all cursor-pointer glow-btn"
                      >
                        Evaluate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Evaluation Scoring Panel modal */}
      {isEvalOpen && selectedApp && (
        <EvaluationModal
          isOpen={isEvalOpen}
          application={selectedApp}
          onClose={() => {
            setIsEvalOpen(false);
            setSelectedApp(null);
          }}
          onSave={() => {
            setIsEvalOpen(false);
            setSelectedApp(null);
            fetchApplications();
          }}
        />
      )}
    </div>
  );
}
