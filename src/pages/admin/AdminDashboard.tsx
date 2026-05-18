import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/services";
import { Link } from "react-router-dom";

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getStats()
      .then((r) => setStats(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading stats...</div>;

  const statCards = [
    {
      key: "totalUsers",
      label: "Total Users",
      icon: "👥",
      color: "#1a56db",
      bg: "#eff6ff",
    },
    {
      key: "totalStudents",
      label: "Students",
      icon: "🎓",
      color: "#059669",
      bg: "#d1fae5",
    },
    {
      key: "totalEmployers",
      label: "Employers",
      icon: "🏢",
      color: "#7c3aed",
      bg: "#ede9fe",
    },
    {
      key: "totalJobs",
      label: "Total Jobs",
      icon: "💼",
      color: "#d97706",
      bg: "#fef3c7",
    },
    {
      key: "activeJobs",
      label: "Active Jobs",
      icon: "✅",
      color: "#059669",
      bg: "#d1fae5",
    },
    {
      key: "totalApplications",
      label: "Applications",
      icon: "📋",
      color: "#dc2626",
      bg: "#fee2e2",
    },
    {
      key: "totalInterviews",
      label: "Interviews",
      icon: "🎥",
      color: "#0891b2",
      bg: "#e0f2fe",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#111" }}>
          Admin Dashboard
        </div>
        <div style={{ color: "#6b7280", marginTop: 4 }}>
          Platform overview and management: TESS System
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.key}
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
                {stats[card.key] ?? 0}
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

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "#111",
            marginBottom: 16,
          }}
        >
          Quick Actions
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {[
            {
              to: "/admin/users",
              icon: "👥",
              label: "Manage Users",
              desc: "View, activate or deactivate accounts",
              color: "#1a56db",
            },
            {
              to: "/admin/users",
              icon: "✓",
              label: "Verify Students",
              desc: "Review and verify student accounts",
              color: "#059669",
            },
            {
              to: "/admin/users",
              icon: "🏢",
              label: "Verify Employers",
              desc: "Review and verify employer accounts",
              color: "#7c3aed",
            },
            {
              to: "/admin/jobs",
              icon: "💼",
              label: "Moderate Jobs",
              desc: "Review and remove inappropriate jobs",
              color: "#dc2626",
            },
          ].map((action) => (
            <Link
              key={action.to + action.label}
              to={action.to}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: 12,
                  padding: "16px 20px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  border: "1px solid #f3f4f6",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(-2px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 1px 4px rgba(0,0,0,0.08)";
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: action.color + "15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                    color: action.color,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {action.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#111",
                      fontSize: "0.95rem",
                    }}
                  >
                    {action.label}
                  </div>
                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: "0.8rem",
                      marginTop: 2,
                    }}
                  >
                    {action.desc}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Platform Summary */}
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          border: "1px solid #f3f4f6",
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
          Platform Summary
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: 16,
              background: "#f9fafb",
              borderRadius: 8,
            }}
          >
            <div
              style={{ fontSize: "2rem", fontWeight: 700, color: "#1a56db" }}
            >
              {stats.totalApplications > 0 && stats.totalJobs > 0
                ? Math.round(stats.totalApplications / stats.totalJobs)
                : 0}
            </div>
            <div
              style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 4 }}
            >
              Avg. Applications per Job
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: 16,
              background: "#f9fafb",
              borderRadius: 8,
            }}
          >
            <div
              style={{ fontSize: "2rem", fontWeight: 700, color: "#059669" }}
            >
              {stats.activeJobs ?? 0}
            </div>
            <div
              style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 4 }}
            >
              Jobs Currently Active
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: 16,
              background: "#f9fafb",
              borderRadius: 8,
            }}
          >
            <div
              style={{ fontSize: "2rem", fontWeight: 700, color: "#7c3aed" }}
            >
              {stats.totalInterviews ?? 0}
            </div>
            <div
              style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 4 }}
            >
              Interviews Scheduled
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
