import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { studentApi, applicationApi, jobApi } from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import { Student, Application, Job } from "../../types";

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [matchingJobs, setMatchingJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      studentApi.getMe(),
      applicationApi.getMyApplications(0),
      jobApi.getMatching(0),
    ])
      .then(([s, a, j]) => {
        setStudent(s.data.data);
        setApplications(a.data.data.content.slice(0, 5));
        setMatchingJobs(j.data.data.content.slice(0, 4));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const statusCounts = {
    pending: applications.filter((a) => a.status === "PENDING").length,
    accepted: applications.filter((a) => a.status === "ACCEPTED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Welcome back, {user?.firstName}! 👋</div>
        <Link to="/student/jobs" className="btn btn-primary">
          Browse Jobs
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{applications.length}</div>
          <div className="stat-label">Total Applications</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: "#d97706" }}>
            {statusCounts.pending}
          </div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: "#059669" }}>
            {statusCounts.accepted}
          </div>
          <div className="stat-label">Accepted</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: "#dc2626" }}>
            {statusCounts.rejected}
          </div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-title">📋 Recent Applications</div>
          {applications.length === 0 ? (
            <p className="text-muted">
              No applications yet. <Link to="/student/jobs">Browse jobs</Link>
            </p>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{app.jobTitle}</div>
                  <div className="text-muted">{app.companyName}</div>
                </div>
                <span className={`badge badge-${app.status.toLowerCase()}`}>
                  {app.status}
                </span>
              </div>
            ))
          )}
          <Link
            to="/student/applications"
            className="btn btn-outline btn-sm mt-4"
          >
            View all
          </Link>
        </div>

        <div className="card">
          <div className="card-title">✨ Matching Jobs</div>
          {matchingJobs.length === 0 ? (
            <p className="text-muted">
              Set your availability to get matched jobs.
            </p>
          ) : (
            matchingJobs.map((job) => (
              <div
                key={job.id}
                style={{ padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}
              >
                <div style={{ fontWeight: 600 }}>{job.title}</div>
                <div className="text-muted">
                  {job.companyName} · {job.location}
                </div>
                {job.hourlyRate && (
                  <div className="text-muted">{job.hourlyRate} ALL/hr</div>
                )}
              </div>
            ))
          )}
          <Link to="/student/jobs" className="btn btn-outline btn-sm mt-4">
            Browse all
          </Link>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-title">👤 My Profile</div>
        {student && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <span className="text-muted">University:</span>{" "}
              {student.university}
            </div>
            <div>
              <span className="text-muted">Faculty:</span>{" "}
              {student.faculty || "—"}
            </div>
            <div>
              <span className="text-muted">Major:</span> {student.major || "—"}
            </div>
            <div>
              <span className="text-muted">Year:</span>{" "}
              {student.yearOfStudy || "—"}
            </div>
            <div>
              <span className="text-muted">CV:</span>{" "}
              {student.cvPath ? "✅ Uploaded" : "❌ Not uploaded"}
            </div>
            <div>
              <span className="text-muted">Verified:</span>{" "}
              {student.studentVerified ? "✅" : "⏳ Pending"}
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <span className="text-muted">Skills: </span>
              {student.skills.length > 0
                ? student.skills.map((s) => (
                    <span key={s} className="tag">
                      {s}
                    </span>
                  ))
                : "—"}
            </div>
          </div>
        )}
        <div className="flex-gap mt-4">
          <Link to="/profile" className="btn btn-outline btn-sm">
            Edit Profile
          </Link>
          <Link to="/student/availability" className="btn btn-outline btn-sm">
            Manage Schedule
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
