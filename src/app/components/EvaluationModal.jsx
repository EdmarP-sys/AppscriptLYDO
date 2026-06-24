import React, { useState, useEffect } from 'react';

export default function EvaluationModal({ isOpen, application, onClose, onSave }) {
  const [scoreAcademic, setScoreAcademic] = useState(0);
  const [scoreSocioEconomic, setScoreSocioEconomic] = useState(0);
  const [scoreLeadership, setScoreLeadership] = useState(0);
  const [scoreInterview, setScoreInterview] = useState(0);
  const [scoreSpecialCircumstances, setScoreSpecialCircumstances] = useState(0);
  const [evaluatorRemarks, setEvaluatorRemarks] = useState('');
  const [status, setStatus] = useState('Under Evaluation');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Suggest GWA academic raw score based on GWA and scale from the PDF
  useEffect(() => {
    if (application) {
      const gwa = parseFloat(application.gwa);
      const scale = application.gwa_scale || '100';
      let suggestion = 0;

      if (!isNaN(gwa)) {
        if (scale === '100') {
          if (gwa >= 96) suggestion = 30;
          else if (gwa >= 93) suggestion = 28;
          else if (gwa >= 90) suggestion = 26;
          else if (gwa >= 87) suggestion = 24;
          else if (gwa >= 84) suggestion = 12; // Following the exact PDF typo (84-86.99 is 12)
          else if (gwa >= 81) suggestion = 22;
          else if (gwa >= 78) suggestion = 20;
          else if (gwa >= 75) suggestion = 18;
          else suggestion = 15;
        } else { // 1.00-5.00 Scale (UP scale, lower is better)
          if (gwa <= 1.25) suggestion = 30;
          else if (gwa <= 1.50) suggestion = 28;
          else if (gwa <= 1.75) suggestion = 26;
          else if (gwa <= 2.00) suggestion = 24;
          else if (gwa <= 2.25) suggestion = 22;
          else if (gwa <= 2.50) suggestion = 20;
          else if (gwa <= 2.75) suggestion = 18;
          else if (gwa <= 3.00) suggestion = 15;
          else suggestion = 15;
        }
      }

      setScoreAcademic(suggestion);
      setScoreSocioEconomic(Number(application.score_socio_economic || 0));
      setScoreLeadership(Number(application.score_leadership || 0));
      setScoreInterview(Number(application.score_interview || 0));
      setScoreSpecialCircumstances(Number(application.score_special_circumstances || 0));
      setEvaluatorRemarks(application.evaluator_remarks || '');
      setStatus(application.status || 'Under Evaluation');
    }
  }, [application]);

  if (!isOpen || !application) return null;

  // Running Total out of 100
  const scoreTotal = 
    Number(scoreAcademic || 0) + 
    Number(scoreSocioEconomic || 0) + 
    Number(scoreLeadership || 0) + 
    Number(scoreInterview || 0) + 
    Number(scoreSpecialCircumstances || 0);

  const getTier = (score) => {
    if (score >= 90) return { label: 'Highly Qualified', color: 'text-green-400' };
    if (score >= 80) return { label: 'Qualified', color: 'text-gold' };
    if (score >= 70) return { label: 'Moderately Qualified', color: 'text-yellow-400' };
    return { label: 'Needs Further Evaluation', color: 'text-red-400' };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/evaluateApplication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: application.id,
          scoreAcademic,
          scoreSocioEconomic,
          scoreLeadership,
          scoreInterview,
          scoreSpecialCircumstances,
          evaluatorRemarks,
          status
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Evaluation save failed.');

      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="glass-panel border border-gold/25 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-gold-gradient">Assessment Scorecard & Review</h2>
            <p className="text-xs text-white/50">Applicant: {application.first_name} {application.last_name} ({application.barangay})</p>
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

        {/* Scrollable Layout */}
        <form onSubmit={handleSave} className="p-6 flex flex-col lg:flex-row gap-6 max-h-[75vh] overflow-y-auto">
          {/* Left Column: Applicant Dossier & Attachments */}
          <div className="flex-1 flex flex-col gap-5 border-b lg:border-b-0 lg:border-r border-white/10 pb-6 lg:pb-0 lg:pr-6">
            <div>
              <h3 className="text-xs font-bold text-gold uppercase tracking-wider mb-2">I. Academic Profile Summary</h3>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 grid grid-cols-2 gap-2.5 text-xs text-white/80">
                <div><span className="text-white/45">School:</span> <p className="font-semibold truncate">{application.school_enrolled}</p></div>
                <div><span className="text-white/45">Course:</span> <p className="font-semibold truncate">{application.course_program}</p></div>
                <div><span className="text-white/45">Year:</span> <p className="font-semibold">{application.year_level}</p></div>
                <div><span className="text-white/45">Student ID:</span> <p className="font-semibold">{application.student_id_no || '—'}</p></div>
                <div><span className="text-white/45">GWA Grade:</span> <p className="font-semibold text-gold">{application.gwa} ({application.gwa_scale === '5' ? '1.0-5.0' : '100-pt'})</p></div>
                <div><span className="text-white/45">Income:</span> <p className="font-semibold">Php {Number(application.monthly_income).toLocaleString()}</p></div>
              </div>
            </div>

            {application.leadership_activities && (
              <div>
                <h3 className="text-xs font-bold text-gold uppercase tracking-wider mb-2">II. Leadership Involvement</h3>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white/80 max-h-[80px] overflow-y-auto italic">
                  "{application.leadership_activities}"
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xs font-bold text-gold uppercase tracking-wider mb-2">III. Documentary Requirements</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: 'Letter to Mayor', url: application.letter_to_mayor_url },
                  { label: 'Student Valid ID', url: application.valid_id_url },
                  { label: 'Enrollment Cert', url: application.enrollment_cert_url },
                  { label: 'Report Card / GWA', url: application.grade_transcript_url },
                  { label: 'Barangay Clearance', url: application.barangay_clearance_url },
                  { label: 'PWD/IP/Parent ID', url: application.special_id_url }
                ].map((doc, idx) => doc.url && (
                  <a
                    key={idx}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-white/5 border border-white/5 hover:border-gold/30 rounded-lg text-[10px] font-semibold text-white/70 hover:text-white truncate transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-gold shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    {doc.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Scoring Inputs */}
          <div className="w-full lg:w-96 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-gold uppercase tracking-wider">IV. Official Scoring Details</h3>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                {error}
              </div>
            )}

            {/* Academic (Max 30) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="input-label mb-0">Academic Performance (Max 30) *</span>
                <span className="text-[10px] text-white/55">Suggested: GWA Score</span>
              </div>
              <input
                type="number"
                required
                min="0"
                max="30"
                value={scoreAcademic}
                onChange={e => setScoreAcademic(Math.min(30, Math.max(0, Number(e.target.value))))}
                className="input-field text-sm"
              />
            </div>

            {/* Socio-Economic (Max 30) */}
            <div className="flex flex-col gap-1.5">
              <label className="input-label mb-0">Socio-Economic Status (Max 30) *</label>
              <input
                type="number"
                required
                min="0"
                max="30"
                value={scoreSocioEconomic}
                onChange={e => setScoreSocioEconomic(Math.min(30, Math.max(0, Number(e.target.value))))}
                className="input-field text-sm"
              />
            </div>

            {/* Leadership (Max 15) */}
            <div className="flex flex-col gap-1.5">
              <label className="input-label mb-0">Leadership & Community (Max 15) *</label>
              <input
                type="number"
                required
                min="0"
                max="15"
                value={scoreLeadership}
                onChange={e => setScoreLeadership(Math.min(15, Math.max(0, Number(e.target.value))))}
                className="input-field text-sm"
              />
            </div>

            {/* Interview (Max 15) */}
            <div className="flex flex-col gap-1.5">
              <label className="input-label mb-0">Interview / Character (Max 15) *</label>
              <input
                type="number"
                required
                min="0"
                max="15"
                value={scoreInterview}
                onChange={e => setScoreInterview(Math.min(15, Math.max(0, Number(e.target.value))))}
                className="input-field text-sm"
              />
            </div>

            {/* Special Circumstances (Max 10) */}
            <div className="flex flex-col gap-1.5">
              <label className="input-label mb-0">Special Circumstances (Max 10) *</label>
              <input
                type="number"
                required
                min="0"
                max="10"
                value={scoreSpecialCircumstances}
                onChange={e => setScoreSpecialCircumstances(Math.min(10, Math.max(0, Number(e.target.value))))}
                className="input-field text-sm"
              />
            </div>

            {/* Evaluator Remarks */}
            <div className="flex flex-col gap-1.5">
              <label className="input-label mb-0">Evaluator Remarks</label>
              <textarea
                rows="2"
                value={evaluatorRemarks}
                onChange={e => setEvaluatorRemarks(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            {/* Decision Status */}
            <div className="flex flex-col gap-1.5">
              <label className="input-label mb-0">Final Decision *</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="input-field text-sm cursor-pointer"
              >
                <option value="Under Evaluation" className="bg-forest-dark text-white">Under Evaluation</option>
                <option value="Approved" className="bg-forest-dark text-white">Approve / Award Assistance</option>
                <option value="Rejected" className="bg-forest-dark text-white">Reject Application</option>
              </select>
            </div>

            {/* running Total Indicator */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center mt-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-white/50">Calculated Score</span>
                <p className="text-2xl font-extrabold text-gold">{scoreTotal} / 100</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-white/50">Qualification Status</span>
                <p className={`text-xs font-bold mt-1 ${getTier(scoreTotal).color}`}>{getTier(scoreTotal).label}</p>
              </div>
            </div>

            {/* Submit scoring buttons */}
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-white/15 hover:bg-white/5 text-white/80 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gold-gradient text-forest-dark font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer glow-btn hover:shadow-lg flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-forest-dark" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  'Save Scoring'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
