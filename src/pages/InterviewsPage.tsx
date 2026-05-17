import React, { useEffect, useState } from 'react';
import { interviewApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Interview } from '../types';

const InterviewsPage: React.FC = () => {
  const { role } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await interviewApi.getMy(page);
      setInterviews(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleCancel = async (id: number) => {
    if (!window.confirm('Cancel this interview?')) return;
    try {
      await interviewApi.cancel(id);
      setMsg('Interview cancelled.');
      load();
    } catch (err: any) { setMsg(err.response?.data?.message || 'Failed.'); }
  };

  const handleComplete = async (id: number) => {
    try {
      await interviewApi.complete(id);
      setMsg('Interview marked as completed.');
      load();
    } catch (err: any) { setMsg(err.response?.data?.message || 'Failed.'); }
  };

  if (loading) return <div className="loading">Loading interviews...</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🎥 Interviews</div>
      </div>

      {msg && <div className={msg.includes('!') || msg.includes('completed') ? 'success-msg' : 'error-msg'}>{msg}</div>}

      {interviews.length === 0 ? (
        <div className="empty-state">No interviews scheduled yet.</div>
      ) : (
        <div className="card-grid">
          {interviews.map(iv => (
            <div key={iv.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontWeight: 700 }}>{iv.jobTitle}</div>
                <span className={`badge badge-${iv.status.toLowerCase()}`}>{iv.status}</span>
              </div>
              <div className="text-muted">{role === 'EMPLOYER' ? `Candidate: ${iv.studentFullName}` : `Company: ${iv.employerCompanyName}`}</div>
              <div className="divider" />
              <div><span className="text-muted">📅 Scheduled:</span> {new Date(iv.scheduledAt).toLocaleString()}</div>
              <div><span className="text-muted">⏱ Duration:</span> {iv.durationMinutes} minutes</div>
              {iv.notes && <div className="mt-2 text-muted">{iv.notes}</div>}
              <div className="flex-gap mt-4">
                {(iv.status === 'SCHEDULED' || iv.status === 'ONGOING') && (
                  <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="btn btn-success btn-sm">
                    🔗 Join Meeting
                  </a>
                )}
                {role === 'EMPLOYER' && iv.status === 'SCHEDULED' && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleCancel(iv.id)}>Cancel</button>
                )}
                {role === 'EMPLOYER' && iv.status === 'ONGOING' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleComplete(iv.id)}>Mark Complete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex-gap mt-4" style={{ justifyContent: 'center' }}>
          <button className="btn btn-outline btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="text-muted">Page {page + 1} of {totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
};

export default InterviewsPage;
