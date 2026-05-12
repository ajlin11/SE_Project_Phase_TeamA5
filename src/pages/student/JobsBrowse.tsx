import React, { useEffect, useState } from 'react';
import { jobApi, applicationApi, studentApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { Job } from '../../types';

const JobsBrowse: React.FC = () => {
  const { role, user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [matching, setMatching] = useState(false);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [msg, setMsg] = useState('');
  const [studentId, setStudentId] = useState<number | null>(null);

  useEffect(() => {
    if (role === 'STUDENT') {
      studentApi.getMe().then(r => setStudentId(r.data.data.id)).catch(() => {});
    }
  }, [role]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      let res;
      if (matching && role === 'STUDENT') {
        res = await jobApi.getMatching(page);
      } else if (search.trim()) {
        res = await jobApi.search(search, page);
      } else {
        res = await jobApi.getActive(page);
      }
      setJobs(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadJobs(); }, [page, matching]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadJobs();
  };

  const handleApply = async () => {
    if (!selectedJob) return;
    try {
      await applicationApi.apply({ jobId: selectedJob.id, coverLetter });
      setMsg('Application submitted successfully!');
      setApplyingId(null);
      setCoverLetter('');
      loadJobs();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to apply.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Browse Jobs</div>
        {role === 'STUDENT' && (
          <button
            className={`btn ${matching ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setMatching(!matching); setPage(0); }}>
            {matching ? '✨ Showing Matched Jobs' : '✨ Show Matching Jobs'}
          </button>
        )}
      </div>

      {msg && <div className={msg.includes('success') ? 'success-msg' : 'error-msg'}>{msg}</div>}

      <form onSubmit={handleSearch} className="flex-gap" style={{ marginBottom: 20 }}>
        <input
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.95rem' }}
          placeholder="Search jobs by title, description or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">Search</button>
        {search && <button className="btn btn-secondary" type="button" onClick={() => { setSearch(''); setPage(0); loadJobs(); }}>Clear</button>}
      </form>

      {loading ? <div className="loading">Loading jobs...</div> : (
        <>
          {jobs.length === 0 ? (
            <div className="empty-state">No jobs found.</div>
          ) : (
            <div className="card-grid">
              {jobs.map(job => (
                <div key={job.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{job.title}</div>
                    <span className={`badge badge-${job.status.toLowerCase()}`}>{job.status}</span>
                  </div>
                  <div className="text-muted" style={{ marginBottom: 8 }}>{job.companyName} {job.location && `· ${job.location}`}</div>
                  <div style={{ fontSize: '0.9rem', marginBottom: 8, color: '#444' }}>
                    {job.description.length > 120 ? job.description.slice(0, 120) + '...' : job.description}
                  </div>
                  {job.hourlyRate && <div className="text-muted">💰 ${job.hourlyRate}/hr</div>}
                  {job.hoursPerWeek && <div className="text-muted">⏱ {job.hoursPerWeek}h/week</div>}
                  {job.shiftStartTime && <div className="text-muted">🕐 {job.shiftStartTime} – {job.shiftEndTime}</div>}
                  {job.workDays?.length > 0 && (
                    <div className="flex-gap mt-2">
                      {job.workDays.map(d => <span key={d} className="tag">{d.slice(0,3)}</span>)}
                    </div>
                  )}
                  {job.requiredSkills?.length > 0 && (
                    <div className="flex-gap mt-2">
                      {job.requiredSkills.map(s => <span key={s} className="tag">{s}</span>)}
                    </div>
                  )}
                  {role === 'STUDENT' && (
                    <div className="mt-4">
                      {job.alreadyApplied ? (
                        <span className="badge badge-accepted">✓ Applied</span>
                      ) : (
                        <button className="btn btn-primary btn-sm"
                          onClick={() => { setSelectedJob(job); setApplyingId(job.id); setMsg(''); }}>
                          Apply Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex-gap mt-4" style={{ justifyContent: 'center' }}>
              <button className="btn btn-outline btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="text-muted">Page {page + 1} of {totalPages}</span>
              <button className="btn btn-outline btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Apply Modal */}
      {applyingId && selectedJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 480, maxWidth: '95vw' }}>
            <div className="card-title">Apply for: {selectedJob.title}</div>
            <div className="text-muted" style={{ marginBottom: 12 }}>{selectedJob.companyName}</div>
            <div className="form-group">
              <label>Cover Letter (optional)</label>
              <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                placeholder="Tell the employer why you're a great fit..." />
            </div>
            <div className="flex-gap">
              <button className="btn btn-primary" onClick={handleApply}>Submit Application</button>
              <button className="btn btn-secondary" onClick={() => { setApplyingId(null); setCoverLetter(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsBrowse;
