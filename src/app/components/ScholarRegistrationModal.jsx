import React, { useState } from 'react';
import { BARANGAYS } from '../api/_utils/constants';

export default function ScholarRegistrationModal({ isOpen, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [barangay, setBarangay] = useState(BARANGAYS[0]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName, barangay })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccess(data.message || 'Registration successful! You can now log in.');
      setTimeout(() => {
        onClose();
        // Reset states
        setUsername('');
        setPassword('');
        setDisplayName('');
        setBarangay(BARANGAYS[0]);
        setSuccess('');
      }, 2500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-panel border border-gold/25 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-gold-gradient font-sans">Register as Scholar</h2>
            <p className="text-xs text-white/50 font-sans">Create your student account to apply</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white rounded-full p-1 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 font-sans">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}

          <div className="flex flex-col">
            <label className="input-label">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Juan Dela Cruz"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="input-field text-sm"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col">
            <label className="input-label">Barangay Address</label>
            <select
              value={barangay}
              onChange={e => setBarangay(e.target.value)}
              className="input-field text-sm cursor-pointer"
              disabled={loading}
            >
              {BARANGAYS.map(b => (
                <option key={b} value={b} className="bg-forest-dark text-white">
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="input-label">Username</label>
            <input
              type="text"
              required
              placeholder="e.g. juan_delacruz"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              className="input-field text-sm font-mono"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col">
            <label className="input-label">Password</label>
            <input
              type="password"
              required
              placeholder="Minimum 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field text-sm"
              disabled={loading}
              minLength={8}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gold-gradient hover:shadow-lg text-forest-dark font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer glow-btn disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-forest-dark" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              'Complete Registration'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
