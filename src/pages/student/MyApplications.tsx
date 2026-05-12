import React, { useEffect, useState } from 'react';
import { applicationApi } from '../../api/services';
import { Application } from '../../types';

const MyApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selected, setSelected] = useState<Application | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await applicationApi.getMyApplications(page);
      setApplications(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  if (loading) return <div className="loading">Loading applications...</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">My Applications</div>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">You haven't applied to any jobs yet.</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th>Interview</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>{app.jobTitle}</td>
                    <td>{app.companyName}</td>
                    <td><span className={`badge badge-${app.status.toLowerCase()}`}>{app.status}</span></td>
                    <td className="text-muted">{new Date(app.appliedAt).toLocaleDateString()}</td>
                    <td>
                      {app.interview ? (
                        <span className={`badge badge-${app.interview.status.toLowerCase()}`}>
                          {app.interview.status}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => setSelected(app)}>Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex-gap mt-4" style={{ justifyContent: 'center' }}>
              <button className="btn btn-outline btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="text-muted">Page {page + 1} of {totalPages}</span>
              <button className="btn btn-outline btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 520, maxWidth: '95vw' }}>
            <div className="card-title">{selected.jobTitle}</div>
            <div className="text-muted">{selected.companyName}</div>
            <div className="divider" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><span className="text-muted">Status:</span> <span className={`badge badge-${selected.status.toLowerCase()}`}>{selected.status}</span></div>
              <div><span className="text-muted">Applied:</span> {new Date(selected.appliedAt).toLocaleDateString()}</div>
            </div>
            {selected.coverLetter && (
              <div className="mt-4">
                <div className="text-muted" style={{ marginBottom: 4 }}>Cover Letter:</div>
                <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, fontSize: '0.9rem' }}>{selected.coverLetter}</div>
              </div>
            )}
            {selected.employerNote && (
              <div className="mt-4">
                <div className="text-muted" style={{ marginBottom: 4 }}>Employer Note:</div>
                <div style={{ background: '#fffbeb', padding: 12, borderRadius: 8, fontSize: '0.9rem' }}>{selected.employerNote}</div>
              </div>
            )}
            {selected.interview && (
              <div className="mt-4">
                <div className="card-title">🎥 Interview</div>
                <div><span className="text-muted">Scheduled:</span> {new Date(selected.interview.scheduledAt).toLocaleString()}</div>
                <div><span className="text-muted">Status:</span> <span className={`badge badge-${selected.interview.status.toLowerCase()}`}>{selected.interview.status}</span></div>
                <div className="mt-2">
                  <a href={selected.interview.meetingLink} target="_blank" rel="noreferrer"
                    className="btn btn-success btn-sm">Join Interview Room</a>
                </div>
              </div>
            )}
            <button className="btn btn-secondary mt-4" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
