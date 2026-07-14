import React, { useState, useEffect } from 'react';
import { BARANGAYS } from '../api/_utils/constants';

export default function ScholarFormModal({ isOpen, onClose, application = null, onSave }) {
  const isEditMode = !!application;
  
  const [formData, setFormData] = useState({
    studentFullName: '',
    dateOfBirth: '',
    sex: 'Male',
    barangay: BARANGAYS[0],
    contactNumber: '',
    email: '',
    school: '',
    schoolYear: '2026-2027',
    isSoloParentBeneficiary: false,
    isOrphan: false,
    isPwd: false,
    isIp: false,
    isOutOfSchoolYouth: false,
    specialCircumstancesSpecify: '',
    status: 'Pending'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isBarangayDropdownOpen, setIsBarangayDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync data on open / mode change
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && application) {
        setFormData({
          id: application.id,
          studentFullName: application.student_full_name || '',
          dateOfBirth: application.date_of_birth ? new Date(application.date_of_birth).toISOString().split('T')[0] : '',
          sex: application.sex || 'Male',
          barangay: application.barangay || BARANGAYS[0],
          contactNumber: application.contact_number || '',
          email: application.email || '',
          school: application.school || '',
          schoolYear: application.school_year || '2026-2027',
          isSoloParentBeneficiary: application.is_solo_parent_beneficiary || false,
          isOrphan: application.is_orphan || false,
          isPwd: application.is_pwd || false,
          isIp: application.is_ip || false,
          isOutOfSchoolYouth: application.is_out_of_school_youth || false,
          specialCircumstancesSpecify: application.special_circumstances_specify || '',
          status: application.status || 'Pending'
        });
        setSearchQuery(application.barangay || '');
      } else {
        // Reset
        setFormData({
          studentFullName: '',
          dateOfBirth: '',
          sex: 'Male',
          barangay: BARANGAYS[0],
          contactNumber: '',
          email: '',
          school: '',
          schoolYear: '2026-2027',
          isSoloParentBeneficiary: false,
          isOrphan: false,
          isPwd: false,
          isIp: false,
          isOutOfSchoolYouth: false,
          specialCircumstancesSpecify: '',
          status: 'Pending'
        });
        setSearchQuery(BARANGAYS[0]);
      }
      setError('');
    }
  }, [isOpen, isEditMode, application]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBarangaySelect = (barangayName) => {
    setFormData(prev => ({ ...prev, barangay: barangayName }));
    setSearchQuery(barangayName);
    setIsBarangayDropdownOpen(false);
  };

  const filteredBarangays = BARANGAYS.filter(b => 
    b.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const url = isEditMode ? '/api/admin/updateScholar' : '/api/admin/encodeScholar';
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save application');
      }

      onSave(data.applicationNo); // Pass back generated AFS if new
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-sans animate-in fade-in duration-200">
      <div className="glass-panel border border-gold/30 w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gold-gradient">
              {isEditMode ? 'Correct Scholar Profile' : 'Encode New Scholar'}
            </h2>
            <p className="text-xs text-white/50">
              {isEditMode ? `Editing ${application.application_no}` : 'System will auto-generate application number'}
            </p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white rounded-full p-1 bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {error && (
            <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
              {error}
            </div>
          )}

          <form id="scholarForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Full Name */}
            <div className="flex flex-col">
              <label className="input-label">Student Full Name *</label>
              <input 
                type="text" 
                name="studentFullName" 
                required 
                placeholder="e.g. Juan A. Dela Cruz" 
                value={formData.studentFullName} 
                onChange={handleChange} 
                className="input-field" 
                disabled={loading} 
              />
            </div>

            {/* Date of Birth & Sex */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="input-label">Date of Birth *</label>
                <input 
                  type="date" 
                  name="dateOfBirth" 
                  required 
                  value={formData.dateOfBirth} 
                  onChange={handleChange} 
                  className="input-field cursor-pointer" 
                  disabled={loading} 
                />
              </div>
              <div className="flex flex-col">
                <label className="input-label">Sex *</label>
                <select 
                  name="sex" 
                  value={formData.sex} 
                  onChange={handleChange} 
                  className="input-field cursor-pointer" 
                  disabled={loading}
                >
                  <option value="Male" className="bg-forest-dark text-white">Male</option>
                  <option value="Female" className="bg-forest-dark text-white">Female</option>
                </select>
              </div>
            </div>

            {/* Address (searchable dropdown) */}
            <div className="flex flex-col relative">
              <label className="input-label">Barangay Address *</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search and select barangay..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsBarangayDropdownOpen(true);
                  }}
                  onFocus={() => setIsBarangayDropdownOpen(true)}
                  className="input-field w-full"
                  disabled={loading}
                />
                {isBarangayDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-forest-dark border border-gold/25 rounded-lg shadow-xl z-50 divide-y divide-white/5">
                    {filteredBarangays.length > 0 ? (
                      filteredBarangays.map(b => (
                        <div 
                          key={b} 
                          onClick={() => handleBarangaySelect(b)}
                          className="px-4 py-2 hover:bg-gold/15 cursor-pointer text-white/80 hover:text-white transition-all text-sm"
                        >
                          {b}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-white/40 text-sm">No barangays found</div>
                    )}
                  </div>
                )}
              </div>
              {/* Backdrop-like closing click handler */}
              {isBarangayDropdownOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsBarangayDropdownOpen(false)} />
              )}
            </div>

            {/* Contact & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="input-label">Contact Number *</label>
                <input 
                  type="tel" 
                  name="contactNumber" 
                  required 
                  placeholder="09XXXXXXXXX"
                  value={formData.contactNumber} 
                  onChange={handleChange} 
                  className="input-field" 
                  disabled={loading} 
                />
              </div>
              <div className="flex flex-col">
                <label className="input-label">Email Address *</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  placeholder="name@domain.com"
                  value={formData.email} 
                  onChange={handleChange} 
                  className="input-field" 
                  disabled={loading} 
                />
              </div>
            </div>

            {/* School & School Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="input-label">School *</label>
                <input 
                  type="text" 
                  name="school" 
                  required 
                  placeholder="School Name"
                  value={formData.school} 
                  onChange={handleChange} 
                  className="input-field" 
                  disabled={loading} 
                />
              </div>
              <div className="flex flex-col">
                <label className="input-label">School Year *</label>
                <input 
                  type="text" 
                  name="schoolYear" 
                  required 
                  placeholder="e.g. 2026-2027"
                  value={formData.schoolYear} 
                  onChange={handleChange} 
                  className="input-field" 
                  disabled={loading} 
                />
              </div>
            </div>

            {/* Special Circumstances */}
            <div className="flex flex-col gap-3">
              <label className="input-label">Special Circumstances</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-white/5 rounded-lg border border-white/5">
                <label className="flex items-center gap-2.5 text-xs text-white/80 cursor-pointer hover:text-white">
                  <input type="checkbox" name="isSoloParentBeneficiary" checked={formData.isSoloParentBeneficiary} onChange={handleChange} className="w-4 h-4 accent-gold" disabled={loading} />
                  Solo Parent Beneficiary
                </label>
                <label className="flex items-center gap-2.5 text-xs text-white/80 cursor-pointer hover:text-white">
                  <input type="checkbox" name="isOrphan" checked={formData.isOrphan} onChange={handleChange} className="w-4 h-4 accent-gold" disabled={loading} />
                  Orphan
                </label>
                <label className="flex items-center gap-2.5 text-xs text-white/80 cursor-pointer hover:text-white">
                  <input type="checkbox" name="isPwd" checked={formData.isPwd} onChange={handleChange} className="w-4 h-4 accent-gold" disabled={loading} />
                  Person with Disability (PWD)
                </label>
                <label className="flex items-center gap-2.5 text-xs text-white/80 cursor-pointer hover:text-white">
                  <input type="checkbox" name="isIp" checked={formData.isIp} onChange={handleChange} className="w-4 h-4 accent-gold" disabled={loading} />
                  Indigenous People (IP)
                </label>
                <label className="flex items-center gap-2.5 text-xs text-white/80 cursor-pointer hover:text-white sm:col-span-2">
                  <input type="checkbox" name="isOutOfSchoolYouth" checked={formData.isOutOfSchoolYouth} onChange={handleChange} className="w-4 h-4 accent-gold" disabled={loading} />
                  Out-of-School Youth Returnee
                </label>
              </div>
            </div>

            {/* Specify Why */}
            <div className="flex flex-col">
              <label className="input-label">If applicable, specify details/why:</label>
              <textarea 
                name="specialCircumstancesSpecify" 
                rows="2" 
                placeholder="Details of special circumstances..."
                value={formData.specialCircumstancesSpecify} 
                onChange={handleChange} 
                className="input-field resize-none" 
                disabled={loading} 
              />
            </div>

            {/* Status */}
            <div className="flex flex-col w-full max-w-xs">
              <label className="input-label">Status</label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange} 
                className="input-field font-bold cursor-pointer" 
                disabled={loading}
              >
                <option value="Pending" className="bg-forest-dark text-yellow-400">For Review</option>
                <option value="Approved" className="bg-forest-dark text-green-400">Approve</option>
                <option value="Rejected" className="bg-forest-dark text-red-400">Disapprove</option>
              </select>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-white/5 shrink-0">
          <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/10 font-semibold text-sm transition-all cursor-pointer disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" form="scholarForm" disabled={loading} className="px-5 py-2.5 rounded-lg bg-gold-gradient text-forest-dark hover:shadow-lg font-bold text-sm transition-all cursor-pointer glow-btn disabled:opacity-50 flex items-center gap-2">
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-forest-dark" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : isEditMode ? 'Save Changes' : 'Encode Scholar'}
          </button>
        </div>
      </div>
    </div>
  );
}
