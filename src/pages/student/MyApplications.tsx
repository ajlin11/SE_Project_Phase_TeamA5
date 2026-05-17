import React, { useEffect, useState } from "react";
import { applicationApi } from "../../api/services";
import { Application } from "../../types";

const REPORT_REASONS = [
  "Inappropriate or offensive job posting",
  "Unprofessional employer behavior",
  "Fake or misleading company information",
  "Interview was cancelled without notice",
  "Other",
];

const MyApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selected, setSelected] = useState<Application | null>(null);
  const [reportApp, setReportApp] = useState<Application | null>(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDesc, setReportDesc] = useState("");
  const [reportMsg, setReportMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await applicationApi.getMyApplications(page);
      setApplications(res.data.data.content);
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

  const handleReport = async () => {
    if (!reportApp) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        "http://localhost:8080/api/notifications/report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            companyName: reportApp.companyName,
            jobTitle: reportApp.jobTitle,
            reason: reportReason,
            description: reportDesc,
            reportType: "EMPLOYER",
          }),
        },
      );
      if (res.ok) {
        setReportMsg(
          "Report submitted. Our admin team will review it shortly.",
        );
        setTimeout(() => {
          setReportApp(null);
          setReportMsg("");
          setReportDesc("");
        }, 2000);
      } else {
        setReportMsg("Failed to submit report.");
      }
    } catch {
      setReportMsg("Failed to submit report.");
    }
  };

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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>{app.jobTitle}</td>
                    <td>{app.companyName}</td>
                    <td>
                      <span
                        className={`badge badge-${app.status.toLowerCase()}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="text-muted">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>
                    <td>
                      {app.interview ? (
                        <span
                          className={`badge badge-${app.interview.status.toLowerCase()}`}
                        >
                          {app.interview.status}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <div className="flex-gap">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelected(app)}
                        >
                          Details
                        </button>
                        <button
                          onClick={() => {
                            setReportApp(app);
                            setReportReason(REPORT_REASONS[0]);
                            setReportDesc("");
                            setReportMsg("");
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#9ca3af",
                            fontSize: "0.8rem",
                          }}
                          title="Report this employer"
                        >
                          🚩 Report
                        </button>
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

      {/* Detail Modal */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div className="card" style={{ width: 520, maxWidth: "95vw" }}>
            <div className="card-title">{selected.jobTitle}</div>
            <div className="text-muted">{selected.companyName}</div>
            <div className="divider" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <div>
                <span className="text-muted">Status:</span>{" "}
                <span
                  className={`badge badge-${selected.status.toLowerCase()}`}
                >
                  {selected.status}
                </span>
              </div>
              <div>
                <span className="text-muted">Applied:</span>{" "}
                {new Date(selected.appliedAt).toLocaleDateString()}
              </div>
            </div>
            {selected.coverLetter && (
              <div className="mt-4">
                <div className="text-muted" style={{ marginBottom: 4 }}>
                  Cover Letter:
                </div>
                <div
                  style={{
                    background: "#f9fafb",
                    padding: 12,
                    borderRadius: 8,
                    fontSize: "0.9rem",
                  }}
                >
                  {selected.coverLetter}
                </div>
              </div>
            )}
            {selected.employerNote && (
              <div className="mt-4">
                <div className="text-muted" style={{ marginBottom: 4 }}>
                  Employer Note:
                </div>
                <div
                  style={{
                    background: "#fffbeb",
                    padding: 12,
                    borderRadius: 8,
                    fontSize: "0.9rem",
                  }}
                >
                  {selected.employerNote}
                </div>
              </div>
            )}
            {selected.interview && (
              <div className="mt-4">
                <div className="card-title">🎥 Interview</div>
                <div>
                  <span className="text-muted">Scheduled:</span>{" "}
                  {new Date(selected.interview.scheduledAt).toLocaleString()}
                </div>
                <div>
                  <span className="text-muted">Status:</span>{" "}
                  <span
                    className={`badge badge-${selected.interview.status.toLowerCase()}`}
                  >
                    {selected.interview.status}
                  </span>
                </div>
                <div className="mt-2">
                  <a
                    href={selected.interview.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-success btn-sm"
                  >
                    Join Interview Room
                  </a>
                </div>
              </div>
            )}
            <button
              className="btn btn-secondary mt-4"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Report Employer Modal */}
      {reportApp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 32,
              width: 460,
              maxWidth: "95vw",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
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
              <div
                style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111" }}
              >
                🚩 Report Employer
              </div>
              <button
                onClick={() => setReportApp(null)}
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
            <div
              style={{
                padding: "10px 14px",
                background: "#f9fafb",
                borderRadius: 8,
                marginBottom: 20,
              }}
            >
              <div style={{ fontWeight: 600, color: "#111" }}>
                {reportApp.companyName}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                Job: {reportApp.jobTitle}
              </div>
            </div>
            {reportMsg ? (
              <div
                style={{
                  padding: 16,
                  background: "#d1fae5",
                  borderRadius: 8,
                  color: "#059669",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                ✅ {reportMsg}
              </div>
            ) : (
              <>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 6,
                      display: "block",
                    }}
                  >
                    Reason
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                    }}
                  >
                    {REPORT_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 6,
                      display: "block",
                    }}
                  >
                    Additional Details (optional)
                  </label>
                  <textarea
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    placeholder="Describe the issue..."
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      minHeight: 80,
                      resize: "vertical",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1 }}
                    onClick={handleReport}
                  >
                    Submit Report
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setReportApp(null)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
