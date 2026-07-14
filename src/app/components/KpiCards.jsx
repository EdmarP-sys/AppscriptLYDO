import React from 'react';

export default function KpiCards({ data }) {
  if (!data) return null;

  const cardItems = [
    {
      title: 'Total Verified Files',
      value: data.totalFiles || 0,
      description: 'Approved documents in system',
      color: 'border-green-500/25 text-green-400',
      icon: (
        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'Awaiting Verification',
      value: data.pendingApprovals || 0,
      description: 'Files in approval queue',
      color: 'border-yellow-500/25 text-yellow-400',
      icon: (
        <svg className="w-8 h-8 text-yellow-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Registered Scholars',
      value: data.totalActiveYouth || 0,
      description: 'Active scholarship profiles',
      color: 'border-gold/25 text-gold',
      icon: (
        <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: 'Annual Budget',
      value: '₱4,500,000.00',
      description: 'Static Annual Allocation',
      color: 'border-blue-500/25 text-blue-400',
      icon: (
        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {cardItems.map((card, i) => (
        <div
          key={i}
          className={`glass-panel border-l-4 p-6 flex items-center justify-between rounded-xl hover:shadow-lg transition-all ${card.color}`}
        >
          <div className="flex flex-col gap-2">
            <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">{card.title}</span>
            <span className="text-3xl font-bold text-white tracking-tight">{card.value}</span>
            <span className="text-white/45 text-xs">{card.description}</span>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 shadow-inner">
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
