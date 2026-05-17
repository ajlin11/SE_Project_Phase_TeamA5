import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/services";
import { Job } from "../../types";

const AdminJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllJobs(page);
      setJobs(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const removeJob = async (id: number) => {
    if (!window.confirm("Remove this job posting?")) return;
    try {
      await adminApi.removeJob(id);
      setMsg("Job removed.");
      load();
    } catch (err: any) {
      setMsg("Failed to remove job.");
    }
  };

  const statusColor: Record<string, string> = {
    ACTIVE: "#059669",
    DRAFT: "#6b7280",
    CLOSED: "#dc2626",
    EXPIRED: "#9ca3af",
  };

  return (
    <div>
      {/* View Job Modal */}
      {selectedJob && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setSelectedJob(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 32,
              width: 520,
              maxWidth: "90vw",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div
                style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111" }}
              >
                💼 Job Details
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.4rem",
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                ✕
              </button>
            </div>

            {/* Title + Status */}
            <div
              style={{
                padding: 16,
                background: "#f9fafb",
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  color: "#111",
                  marginBottom: 8,
                }}
              >
                {selectedJob.title}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  style={{
                    background:
                      (statusColor[selectedJob.status] || "#6b7280") + "18",
                    color: statusColor[selectedJob.status] || "#6b7280",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  {selectedJob.status}
                </span>
                <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                  🏢 {(selectedJob as any).companyName || "—"}
                </span>
              </div>
            </div>

            {/* Job Info Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {[
                { label: "Location", value: selectedJob.location || "—" },
                {
                  label: "Hourly Rate",
                  value: selectedJob.hourlyRate
                    ? `${selectedJob.hourlyRate} ALL/hr`
                    : "—",
                },
                {
                  label: "Hours/Week",
                  value: selectedJob.hoursPerWeek
                    ? `${selectedJob.hoursPerWeek}h`
                    : "—",
                },
                {
                  label: "Max Applicants",
                  value: (selectedJob as any).maxApplicants || "—",
                },
                {
                  label: "Shift Start",
                  value: selectedJob.shiftStartTime || "—",
                },
                { label: "Shift End", value: selectedJob.shiftEndTime || "—" },
                {
                  label: "Applications",
                  value: (selectedJob as any).applicationCount ?? 0,
                },
                {
                  label: "Deadline",
                  value: (selectedJob as any).applicationDeadline
                    ? new Date(
                        (selectedJob as any).applicationDeadline,
                      ).toLocaleDateString()
                    : "—",
                },
                {
                  label: "Created",
                  value: (selectedJob as any).createdAt
                    ? new Date(
                        (selectedJob as any).createdAt,
                      ).toLocaleDateString()
                    : "—",
                },
                { label: "Job ID", value: `#${selectedJob.id}` },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "10px 14px",
                    background: "#f9fafb",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontWeight: 600, color: "#111", marginTop: 4 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Work Days */}
            {selectedJob.workDays && selectedJob.workDays.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{ fontWeight: 600, color: "#111", marginBottom: 8 }}
                >
                  📅 Work Days
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {selectedJob.workDays.map((day) => (
                    <span
                      key={day}
                      style={{
                        background: "#eff6ff",
                        color: "#1a56db",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Required Skills */}
            {selectedJob.requiredSkills &&
              selectedJob.requiredSkills.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{ fontWeight: 600, color: "#111", marginBottom: 8 }}
                  >
                    🛠 Required Skills
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {selectedJob.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          background: "#d1fae5",
                          color: "#059669",
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Description */}
            {selectedJob.description && (
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{ fontWeight: 600, color: "#111", marginBottom: 8 }}
                >
                  📄 Description
                </div>
                <div
                  style={{
                    color: "#4b5563",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                    padding: 12,
                    background: "#f9fafb",
                    borderRadius: 8,
                  }}
                >
                  {selectedJob.description}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              {selectedJob.status === "ACTIVE" && (
                <button
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  onClick={() => {
                    removeJob(selectedJob.id);
                    setSelectedJob(null);
                  }}
                >
                  Remove Job
                </button>
              )}
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setSelectedJob(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="page-title">💼 Job Moderation</div>
      </div>
      {msg && <div className="success-msg">{msg}</div>}
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.95rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f9fafb",
                    borderBottom: "2px solid #e5e7eb",
                  }}
                >
                  <th
                    style={{
                      padding: "14px 20px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Title
                  </th>
                  <th
                    style={{
                      padding: "14px 20px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Company
                  </th>
                  <th
                    style={{
                      padding: "14px 20px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "14px 20px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Applications
                  </th>
                  <th
                    style={{
                      padding: "14px 20px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Created
                  </th>
                  <th
                    style={{
                      padding: "14px 20px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    style={{ borderBottom: "1px solid #f3f4f6" }}
                    onMouseEnter={(e) =>
                      ((
                        e.currentTarget as HTMLTableRowElement
                      ).style.background = "#f9fafb")
                    }
                    onMouseLeave={(e) =>
                      ((
                        e.currentTarget as HTMLTableRowElement
                      ).style.background = "white")
                    }
                  >
                    <td
                      style={{
                        padding: "14px 20px",
                        fontWeight: 600,
                        color: "#111",
                      }}
                    >
                      {job.title}
                    </td>
                    <td style={{ padding: "14px 20px", color: "#4b5563" }}>
                      {(job as any).companyName}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          background:
                            (statusColor[job.status] || "#6b7280") + "18",
                          color: statusColor[job.status] || "#6b7280",
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                        }}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", color: "#4b5563" }}>
                      {(job as any).applicationCount ?? 0}
                    </td>
                    <td style={{ padding: "14px 20px", color: "#6b7280" }}>
                      {(job as any).createdAt
                        ? new Date((job as any).createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-sm"
                          style={{
                            background: "#f3f4f6",
                            color: "#374151",
                            border: "1px solid #e5e7eb",
                          }}
                          onClick={() => setSelectedJob(job)}
                        >
                          👁 View
                        </button>
                        {job.status === "ACTIVE" && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => removeJob(job.id)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex-gap mt-4" style={{ justifyContent: "center" }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <span className="text-muted">
                Page {page + 1} of {totalPages}
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminJobs;
