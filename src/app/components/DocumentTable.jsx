import React, { useState } from 'react';

export default function DocumentTable({ documents, title, onRefresh }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filteredDocs = (documents || []).filter(doc => {
    const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || 
                       (doc.uploadedBy && doc.uploadedBy.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === 'All' || doc.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  // Extract unique categories
  const categories = ['All', ...new Set((documents || []).map(d => d.category))];

  return (
    <div className="glass-panel rounded-xl p-6 border border-gold/15 w-full flex flex-col gap-4">
      {/* Table Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gold-gradient">{title || 'Document Portal'}</h2>
          <p className="text-xs text-white/50">{filteredDocs.length} documents found</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-grow sm:flex-grow-0">
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field w-full sm:w-64 pl-10 text-sm"
            />
            <svg className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="input-field text-sm cursor-pointer min-w-[150px]"
          >
            {categories.map(cat => (
              <option key={cat} value={cat} className="bg-forest-dark text-white">
                {cat}
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-2.5 rounded-lg border border-gold/20 hover:bg-gold/10 text-gold text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
              title="Refresh lists"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto w-full border border-white/5 rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-gold/80 text-xs font-semibold uppercase tracking-wider">
              <th className="py-4 px-6">Document Name</th>
              <th className="py-4 px-6">Category</th>
              <th className="py-4 px-6">Uploaded By</th>
              <th className="py-4 px-6">Upload Date</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-white/80 font-medium">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-3m-3 0h-3m-2 0H4" />
                    </svg>
                    <span>No verified files available.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc, i) => (
                <tr key={i} className="hover:bg-white/5 transition-all">
                  <td className="py-4 px-6 text-white truncate max-w-xs">{doc.name}</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gold/10 text-gold border border-gold/20">
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-white/60 font-mono text-xs">{doc.uploadedBy}</td>
                  <td className="py-4 px-6 text-white/60">
                    {new Date(doc.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-gold-gradient text-forest-dark font-bold text-xs hover:shadow-md transition-all glow-btn cursor-pointer"
                    >
                      View Link
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
