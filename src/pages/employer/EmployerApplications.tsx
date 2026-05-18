import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { applicationApi, jobApi, interviewApi } from "../../api/services";
import { Application, Job, InterviewRequest } from "../../types";

const REPORT_REASONS = [
  "No-show to scheduled interview",
  "Fake or misleading student profile",
  "Inappropriate or offensive behavior",
  "Unresponsive after acceptance",
  "Other",
];

const EmployerApplications: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const preselectedJobId = params.get("jobId")
    ? Number(params.get("jobId"))
    : null;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(
    preselectedJobId,
  );
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [scheduleFor, setScheduleFor] = useState<Application | null>(null);
  const [interviewForm, setInterviewForm] = useState<InterviewRequest>({
    applicationId: 0,
    scheduledAt: "",
    durationMinutes: 30,
  });
  const [reportApp, setReportApp] = useState<Application | null>(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDesc, setReportDesc] = useState("");
  const [reportMsg, setReportMsg] = useState("");

  useEffect(() => {
    jobApi.getMyJobs(0).then((r) => {
      setJobs(r.data.data.content);
      if (!selectedJobId && r.data.data.content.length > 0) {
        setSelectedJobId(r.data.data.content[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedJobId) return;
    setLoading(true);
    applicationApi
      .getByJob(selectedJobId, 0)
      .then((r) => setApplications(r.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedJobId]);

  const updateStatus = async (appId: number, status: string, note?: string) => {
    setMsg("");
    try {
      await applicationApi.updateStatus(appId, status, note);
      setApplications((apps) =>
        apps.map((a) => (a.id === appId ? { ...a, status: status as any } : a)),
      );
      setMsg(`Application ${status.toLowerCase()} successfully.`);
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Failed.");
    }
  };

  const scheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleFor) return;
    try {
      await interviewApi.schedule({
        ...interviewForm,
        applicationId: scheduleFor.id,
      });
      setMsg("Interview scheduled!");
      setScheduleFor(null);
      if (selectedJobId) {
        const res = await applicationApi.getByJob(selectedJobId, 0);
        setApplications(res.data.data.content);
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Failed to schedule interview.");
    }
  };

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
            studentName: reportApp.studentFullName,
            jobTitle: reportApp.jobTitle,
            reason: reportReason,
            description: reportDesc,
            reportType: "STUDENT",
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

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Applications</div>
      </div>

      {msg && (
        <div className={msg.includes("!") ? "success-msg" : "error-msg"}>
          {msg}
        </div>
      )}

      <div className="form-group" style={{ maxWidth: 360 }}>
        <label>Select Job</label>
        <select
          value={selectedJobId || ""}
          onChange={(e) => setSelectedJobId(Number(e.target.value))}
        >
          <option value="">-- Select a job --</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="card">
          {applications.length === 0 ? (
            <div className="empty-state">No applications for this job yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>University</th>
                    <th>Status</th>
                    <th>Applied</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {app.studentFullName}
                        </div>
                        <div className="text-muted">{app.studentEmail}</div>
                      </td>
                      <td>{app.studentUniversity}</td>
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
                        <div className="flex-gap">
                          {app.status === "PENDING" && (
                            <>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => updateStatus(app.id, "ACCEPTED")}
                              >
                                Accept
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => updateStatus(app.id, "REJECTED")}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {app.status === "ACCEPTED" && !app.interview && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setScheduleFor(app);
                                setInterviewForm({
                                  applicationId: app.id,
                                  scheduledAt: "",
                                  durationMinutes: 30,
                                });
                              }}
                            >
                              📅 Schedule Interview
                            </button>
                          )}
                          {app.interview && (
                            <span
                              className={`badge badge-${app.interview.status.toLowerCase()}`}
                            >
                              Interview: {app.interview.status}
                            </span>
                          )}
                          {app.status === "ACCEPTED" && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => updateStatus(app.id, "REJECTED")}
                            >
                              Reject
                            </button>
                          )}
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
                            title="Report this student"
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
          )}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {scheduleFor && (
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
          <div className="card" style={{ width: 460, maxWidth: "95vw" }}>
            <div className="card-title">📅 Schedule Interview</div>
            <div className="text-muted" style={{ marginBottom: 12 }}>
              Candidate: <strong>{scheduleFor.studentFullName}</strong>
            </div>
            <form onSubmit={scheduleInterview}>
              <div className="form-group">
                <label>Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewForm.scheduledAt}
                  onChange={(e) =>
                    setInterviewForm({
                      ...interviewForm,
                      scheduledAt: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  value={interviewForm.durationMinutes}
                  onChange={(e) =>
                    setInterviewForm({
                      ...interviewForm,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  value={interviewForm.notes || ""}
                  onChange={(e) =>
                    setInterviewForm({
                      ...interviewForm,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex-gap">
                <button type="submit" className="btn btn-primary">
                  Schedule
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setScheduleFor(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Student Modal */}
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
                🚩 Report Student
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
                {reportApp.studentFullName}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                Applied for: {reportApp.jobTitle}
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

export default EmployerApplications;
