import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { employerApi, jobApi, applicationApi } from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import { Employer, Job, Application } from "../../types";

const EmployerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([employerApi.getMe(), jobApi.getMyJobs(0)])
      .then(async ([e, j]) => {
        setEmployer(e.data.data);
        const myJobs = j.data.data.content;
        setJobs(myJobs.slice(0, 5));
        if (myJobs.length > 0) {
          const appsRes = await applicationApi
            .getByJob(myJobs[0].id, 0)
            .catch(() => null);
          if (appsRes) setRecentApps(appsRes.data.data.content.slice(0, 5));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const activeJobs = jobs.filter((j) => j.status === "ACTIVE").length;
  const draftJobs = jobs.filter((j) => j.status === "DRAFT").length;

  const statCards = [
    {
      label: "Total Jobs",
      value: jobs.length,
      icon: "💼",
      color: "#1a56db",
      bg: "#eff6ff",
    },
    {
      label: "Active Jobs",
      value: activeJobs,
      icon: "✅",
      color: "#059669",
      bg: "#d1fae5",
    },
    {
      label: "Drafts",
      value: draftJobs,
      icon: "📝",
      color: "#6b7280",
      bg: "#f3f4f6",
    },
    {
      label: "New Applications",
      value: recentApps.length,
      icon: "👥",
      color: "#d97706",
      bg: "#fef3c7",
    },
  ];

  const statusColor: Record<string, string> = {
    ACTIVE: "#059669",
    DRAFT: "#6b7280",
    CLOSED: "#dc2626",
    EXPIRED: "#9ca3af",
    PENDING: "#d97706",
    ACCEPTED: "#059669",
    REJECTED: "#dc2626",
    COMPLETED: "#1a56db",
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
        }}
      >
        <div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#111" }}>
            Welcome, {employer?.companyName}!
          </div>
          <div style={{ color: "#6b7280", marginTop: 4 }}>
            Manage your job postings and applicants from here
          </div>
        </div>
        <Link
          to="/employer/jobs/new"
          className="btn btn-primary"
          style={{ whiteSpace: "nowrap" }}
        >
          📋 My Jobs
        </Link>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: "white",
              borderRadius: 12,
              padding: "20px 24px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              borderLeft: `4px solid ${card.color}`,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: card.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                flexShrink: 0,
              }}
            >
              {card.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: card.color,
                  lineHeight: 1,
                }}
              >
                {card.value}
              </div>
              <div
                style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 4 }}
              >
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* My Job Postings */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "#111" }}>
              📋 My Job Postings
            </div>
            <Link
              to="/employer/jobs"
              style={{
                fontSize: "0.85rem",
                color: "#1a56db",
                textDecoration: "none",
              }}
            >
              View all →
            </Link>
          </div>
          {jobs.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "#6b7280",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>💼</div>
              <div>No jobs posted yet.</div>
              <Link
                to="/employer/jobs/new"
                style={{ color: "#1a56db", fontSize: "0.9rem" }}
              >
                Post your first job →
              </Link>
            </div>
          ) : (
            <div>
              {jobs.map((job, i) => (
                <div
                  key={job.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom:
                      i < jobs.length - 1 ? "1px solid #f3f4f6" : "none",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#111",
                        fontSize: "0.95rem",
                      }}
                    >
                      {job.title}
                    </div>
                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: "0.82rem",
                        marginTop: 2,
                      }}
                    >
                      {job.applicationCount ?? 0} applications
                    </div>
                  </div>
                  <span
                    style={{
                      background: (statusColor[job.status] || "#6b7280") + "18",
                      color: statusColor[job.status] || "#6b7280",
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "#111" }}>
              👥 Recent Applications
            </div>
            <Link
              to="/employer/applications"
              style={{
                fontSize: "0.85rem",
                color: "#1a56db",
                textDecoration: "none",
              }}
            >
              View all →
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "#6b7280",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>📭</div>
              <div>No applications yet.</div>
            </div>
          ) : (
            <div>
              {recentApps.map((app, i) => (
                <div
                  key={app.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom:
                      i < recentApps.length - 1 ? "1px solid #f3f4f6" : "none",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#111",
                        fontSize: "0.95rem",
                      }}
                    >
                      {app.studentFullName}
                    </div>
                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: "0.82rem",
                        marginTop: 2,
                      }}
                    >
                      {app.jobTitle}
                    </div>
                  </div>
                  <span
                    style={{
                      background: (statusColor[app.status] || "#6b7280") + "18",
                      color: statusColor[app.status] || "#6b7280",
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#111",
            marginBottom: 16,
          }}
        >
          ⚡ Quick Actions
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {[
            {
              to: "/employer/jobs/new",
              icon: "➕",
              label: "My Jobs",
              color: "#1a56db",
            },
            {
              to: "/employer/jobs",
              icon: "💼",
              label: "Manage Jobs",
              color: "#7c3aed",
            },
            {
              to: "/employer/applications",
              icon: "📋",
              label: "View Applications",
              color: "#059669",
            },
            {
              to: "/employer/interviews",
              icon: "🎥",
              label: "My Interviews",
              color: "#d97706",
            },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  padding: "16px",
                  borderRadius: 10,
                  textAlign: "center",
                  background: action.color + "10",
                  border: `1px solid ${action.color}25`,
                  cursor: "pointer",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(0)")
                }
              >
                <div style={{ fontSize: "1.6rem", marginBottom: 8 }}>
                  {action.icon}
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    color: action.color,
                    fontSize: "0.85rem",
                  }}
                >
                  {action.label}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
