'use client';

import React, { useState, useEffect } from 'react';

export default function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/getGlobalAnalyticsData');
      if (!res.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'Failed to retrieve analytics');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white/60 text-sm font-semibold">Compiling analytics reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel border-red-500/20 bg-red-500/5 rounded-xl p-8 text-center flex flex-col items-center gap-4">
        <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="font-bold text-white text-md">Failed to Load Analytics</h3>
        <p className="text-xs text-white/50 max-w-md">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-2 px-4 py-2 bg-gold-gradient text-forest-dark font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer hover:shadow-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Filter trend table rows based on search and status (green/red)
  const filteredRows = (data?.trendTable || []).filter(row => {
    const matchesSearch = row.entity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && row.status === 'green') ||
      (statusFilter === 'inactive' && row.status === 'red');
    return matchesSearch && matchesStatus;
  });

  const categories = Object.entries(data?.categoryCounts || {});

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-gold-gradient uppercase tracking-wider">Analytics & Trends</h1>
        <p className="text-xs text-white/50">Submission statistics and 3-month reporting trends across all Barangays & SK Centers</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Documents */}
        <div className="glass-panel border-white/10 p-5 rounded-xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-white/40 uppercase font-semibold">Total Verified Files</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">{data?.totalFiles || 0}</h3>
            <p className="text-[10px] text-green-400 font-semibold mt-1">✓ Active in Cloud Storage</p>
          </div>
          <div className="p-3 rounded-lg bg-gold/10 border border-gold/20 text-gold">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="glass-panel border-white/10 p-5 rounded-xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-white/40 uppercase font-semibold">Pending Verification Queue</span>
            <h3 className="text-2xl font-extrabold text-gold mt-1">{data?.pendingApprovals || 0}</h3>
            <p className="text-[10px] text-white/40 font-semibold mt-1">Requires reviewer evaluation</p>
          </div>
          <div className="p-3 rounded-lg bg-gold/10 border border-gold/20 text-gold">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Active Scholars */}
        <div className="glass-panel border-white/10 p-5 rounded-xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-white/40 uppercase font-semibold">Registered Scholars</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">{data?.totalActiveYouth || 0}</h3>
            <p className="text-[10px] text-gold font-semibold mt-1">Scholar Profile Gateways</p>
          </div>
          <div className="p-3 rounded-lg bg-gold/10 border border-gold/20 text-gold">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Breakdown by Category */}
        <div className="glass-panel border-white/10 p-5 rounded-xl lg:col-span-1 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-gold-gradient uppercase tracking-wider">Documents by Category</h3>
            <p className="text-[10px] text-white/40">Total verified files split by folder classification</p>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            {categories.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-xs">No categorised files found.</div>
            ) : (
              categories.map(([cat, count]) => {
                // Calculate percentage
                const total = data?.totalFiles || 1;
                const percentage = Math.round((count / total) * 100);

                return (
                  <div key={cat} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-white/80">{cat}</span>
                      <span className="text-gold">{count} ({percentage}%)</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-2 w-full bg-forest-dark/50 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gold rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3-Month Upload Trends Table */}
        <div className="glass-panel border-white/10 p-5 rounded-xl lg:col-span-2 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-gold-gradient uppercase tracking-wider">3-Month Upload Trend Grid</h3>
              <p className="text-[10px] text-white/40">Traffic lights show recent activity (Active status implies uploads within 30 days)</p>
            </div>
            
            {/* Quick Status Filters */}
            <div className="flex items-center gap-1.5 bg-forest-dark/40 border border-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded ${statusFilter === 'all' ? 'bg-gold-gradient text-forest-dark' : 'text-white/60 hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded ${statusFilter === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'text-white/60 hover:text-white'}`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded ${statusFilter === 'inactive' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'text-white/60 hover:text-white'}`}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search Barangay or SK Portfolio..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field text-xs py-2 pl-8 pr-4 w-full"
            />
            <svg className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Grid Table */}
          <div className="overflow-x-auto border border-white/10 rounded-lg max-h-[350px] overflow-y-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-xs">
              <thead className="bg-forest-dark/85 text-white/50 font-bold uppercase tracking-wider text-[10px] sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="px-4 py-3">Sector Entity</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Last Upload</th>
                  <th className="px-4 py-3 text-center">{data?.monthLabels?.[0] || 'Month 3'}</th>
                  <th className="px-4 py-3 text-center">{data?.monthLabels?.[1] || 'Month 2'}</th>
                  <th className="px-4 py-3 text-center">{data?.monthLabels?.[2] || 'Month 1'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-forest-dark/20">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-white/30">
                      No matching sectors or uploading trends found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(row => {
                    const hasUploaded = row.status === 'green';
                    return (
                      <tr key={row.entity} className="hover:bg-white/5 transition-all">
                        <td className="px-4 py-3 font-bold text-white whitespace-nowrap">{row.entity}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <span className={`w-2.5 h-2.5 rounded-full ${hasUploaded ? 'bg-green-500 animate-pulse glow-green' : 'bg-red-500 glow-red'}`}></span>
                            <span className={`text-[10px] font-bold uppercase ${hasUploaded ? 'text-green-400' : 'text-red-400'}`}>
                              {hasUploaded ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white/60 whitespace-nowrap">
                          {row.lastUpload ? new Date(row.lastUpload).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          }) : (
                            <span className="text-white/20 italic">No uploads</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-white/80 whitespace-nowrap">{row.m3}</td>
                        <td className="px-4 py-3 text-center font-bold text-white/80 whitespace-nowrap">{row.m2}</td>
                        <td className="px-4 py-3 text-center font-bold text-white whitespace-nowrap text-gold">{row.m1}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
