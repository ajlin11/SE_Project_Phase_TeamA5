import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/services';
import { Job } from '../../types';

const AdminJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllJobs(page);
      setJobs(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const removeJob = async (id: number) => {
    if (!window.confirm('Remove this job posting?')) return;
    try {
      await adminApi.removeJob(id);
      setMsg('Job removed.');
      load();
    } catch (err: any) { setMsg('Failed to remove job.'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">💼 Job Moderation</div>
      </div>
      {msg && <div className="success-msg">{msg}</div>}
      {loading ? <div className="loading">Loading...</div> : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Title</th><th>Company</th><th>Status</th><th>Applications</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id}>
                    <td style={{ fontWeight: 600 }}>{job.title}</td>
                    <td>{job.companyName}</td>
                    <td><span className={`badge badge-${job.status.toLowerCase()}`}>{job.status}</span></td>
                    <td>{job.applicationCount}</td>
                    <td className="text-muted">{new Date(job.createdAt).toLocaleDateString()}</td>
                    <td>
                      {job.status === 'ACTIVE' && (
                        <button className="btn btn-danger btn-sm" onClick={() => removeJob(job.id)}>Remove</button>
                      )}
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
    </div>
  );
};

export default AdminJobs;
