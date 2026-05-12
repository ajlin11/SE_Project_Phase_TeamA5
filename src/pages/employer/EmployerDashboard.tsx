import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { employerApi, jobApi, applicationApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { Employer, Job, Application } from '../../types';

const EmployerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      employerApi.getMe(),
      jobApi.getMyJobs(0),
    ]).then(async ([e, j]) => {
      setEmployer(e.data.data);
      const myJobs = j.data.data.content;
      setJobs(myJobs.slice(0, 5));
      if (myJobs.length > 0) {
        const appsRes = await applicationApi.getByJob(myJobs[0].id, 0).catch(() => null);
        if (appsRes) setRecentApps(appsRes.data.data.content.slice(0, 5));
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const activeJobs = jobs.filter(j => j.status === 'ACTIVE').length;
  const draftJobs = jobs.filter(j => j.status === 'DRAFT').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Welcome, {employer?.companyName}! 🏢</div>
        <Link to="/employer/jobs/new" className="btn btn-primary">+ Post New Job</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{jobs.length}</div>
          <div className="stat-label">Total Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#059669' }}>{activeJobs}</div>
          <div className="stat-label">Active Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#6b7280' }}>{draftJobs}</div>
          <div className="stat-label">Drafts</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{recentApps.length}</div>
          <div className="stat-label">New Applications</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-title">📋 My Job Postings</div>
          {jobs.length === 0 ? (
            <p className="text-muted">No jobs posted yet. <Link to="/employer/jobs/new">Post one now</Link></p>
          ) : jobs.map(job => (
            <div key={job.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{job.title}</div>
                <div className="text-muted">{job.applicationCount} applications</div>
              </div>
              <span className={`badge badge-${job.status.toLowerCase()}`}>{job.status}</span>
            </div>
          ))}
          <Link to="/employer/jobs" className="btn btn-outline btn-sm mt-4">View all jobs</Link>
        </div>

        <div className="card">
          <div className="card-title">👥 Recent Applications</div>
          {recentApps.length === 0 ? (
            <p className="text-muted">No applications yet.</p>
          ) : recentApps.map(app => (
            <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{app.studentFullName}</div>
                <div className="text-muted">{app.jobTitle}</div>
              </div>
              <span className={`badge badge-${app.status.toLowerCase()}`}>{app.status}</span>
            </div>
          ))}
          <Link to="/employer/applications" className="btn btn-outline btn-sm mt-4">View all</Link>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
