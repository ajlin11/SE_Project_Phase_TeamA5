import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { applicationApi, jobApi, interviewApi } from '../../api/services';
import { Application, Job, InterviewRequest } from '../../types';

const EmployerApplications: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const preselectedJobId = params.get('jobId') ? Number(params.get('jobId')) : null;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(preselectedJobId);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [scheduleFor, setScheduleFor] = useState<Application | null>(null);
  const [interviewForm, setInterviewForm] = useState<InterviewRequest>({ applicationId: 0, scheduledAt: '', durationMinutes: 30 });

  useEffect(() => {
    jobApi.getMyJobs(0).then(r => {
      setJobs(r.data.data.content);
      if (!selectedJobId && r.data.data.content.length > 0) {
        setSelectedJobId(r.data.data.content[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedJobId) return;
    setLoading(true);
    applicationApi.getByJob(selectedJobId, 0)
      .then(r => setApplications(r.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedJobId]);

  const updateStatus = async (appId: number, status: string, note?: string) => {
    setMsg('');
    try {
      await applicationApi.updateStatus(appId, status, note);
      setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: status as any } : a));
      setMsg(`Application ${status.toLowerCase()} successfully.`);
    } catch (err: any) { setMsg(err.response?.data?.message || 'Failed.'); }
  };

  const scheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleFor) return;
    try {
      await interviewApi.schedule({ ...interviewForm, applicationId: scheduleFor.id });
      setMsg('Interview scheduled!');
      setScheduleFor(null);
      if (selectedJobId) {
        const res = await applicationApi.getByJob(selectedJobId, 0);
        setApplications(res.data.data.content);
      }
    } catch (err: any) { setMsg(err.response?.data?.message || 'Failed to schedule interview.'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Applications</div>
      </div>

      {msg && <div className={msg.includes('!') ? 'success-msg' : 'error-msg'}>{msg}</div>}

      <div className="form-group" style={{ maxWidth: 360 }}>
        <label>Select Job</label>
        <select value={selectedJobId || ''} onChange={e => setSelectedJobId(Number(e.target.value))}>
          <option value="">-- Select a job --</option>
          {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
      </div>

      {loading ? <div className="loading">Loading...</div> : (
        <div className="card">
          {applications.length === 0 ? (
            <div className="empty-state">No applications for this job yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Student</th><th>University</th><th>Status</th><th>Applied</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{app.studentFullName}</div>
                        <div className="text-muted">{app.studentEmail}</div>
                      </td>
                      <td>{app.studentUniversity}</td>
                      <td><span className={`badge badge-${app.status.toLowerCase()}`}>{app.status}</span></td>
                      <td className="text-muted">{new Date(app.appliedAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex-gap">
                          {app.status === 'PENDING' && <>
                            <button className="btn btn-success btn-sm" onClick={() => updateStatus(app.id, 'ACCEPTED')}>Accept</button>
                            <button className="btn btn-danger btn-sm" onClick={() => updateStatus(app.id, 'REJECTED')}>Reject</button>
                          </>}
                          {app.status === 'ACCEPTED' && !app.interview && (
                            <button className="btn btn-primary btn-sm"
                              onClick={() => { setScheduleFor(app); setInterviewForm({ applicationId: app.id, scheduledAt: '', durationMinutes: 30 }); }}>
                              📅 Schedule Interview
                            </button>
                          )}
                          {app.interview && (
                            <span className={`badge badge-${app.interview.status.toLowerCase()}`}>
                              Interview: {app.interview.status}
                            </span>
                          )}
                          {app.status === 'ACCEPTED' && (
                            <button className="btn btn-danger btn-sm" onClick={() => updateStatus(app.id, 'REJECTED')}>Reject</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {scheduleFor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 460, maxWidth: '95vw' }}>
            <div className="card-title">📅 Schedule Interview</div>
            <div className="text-muted" style={{ marginBottom: 12 }}>Candidate: <strong>{scheduleFor.studentFullName}</strong></div>
            <form onSubmit={scheduleInterview}>
              <div className="form-group">
                <label>Date & Time</label>
                <input type="datetime-local" required
                  value={interviewForm.scheduledAt}
                  onChange={e => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input type="number" value={interviewForm.durationMinutes}
                  onChange={e => setInterviewForm({ ...interviewForm, durationMinutes: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea value={interviewForm.notes || ''}
                  onChange={e => setInterviewForm({ ...interviewForm, notes: e.target.value })} />
              </div>
              <div className="flex-gap">
                <button type="submit" className="btn btn-primary">Schedule</button>
                <button type="button" className="btn btn-secondary" onClick={() => setScheduleFor(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerApplications;
