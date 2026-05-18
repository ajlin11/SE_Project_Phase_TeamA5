import React, { useEffect, useState } from "react";
import {
  jobApi,
  applicationApi,
  studentApi,
  notificationApi,
} from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import { Job } from "../../types";

const REPORT_REASONS = [
  "Inappropriate or offensive job posting",
  "Fake or misleading job description",
  "Suspicious or fraudulent employer",
  "Unprofessional behavior",
  "Other",
];

const JobsBrowse: React.FC = () => {
  const { role, user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [matching, setMatching] = useState(false);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [msg, setMsg] = useState("");
  const [studentId, setStudentId] = useState<number | null>(null);
  const [reportJob, setReportJob] = useState<Job | null>(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDesc, setReportDesc] = useState("");
  const [reportMsg, setReportMsg] = useState("");

  useEffect(() => {
    if (role === "STUDENT") {
      studentApi
        .getMe()
        .then((r) => setStudentId(r.data.data.id))
        .catch(() => {});
    }
  }, [role]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      let res;
      if (matching && role === "STUDENT") {
        res = await jobApi.getMatching(page);
      } else if (search.trim()) {
        res = await jobApi.search(search, page);
      } else {
        res = await jobApi.getActive(page);
      }
      setJobs(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [page, matching]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadJobs();
  };

  const handleApply = async () => {
    if (!selectedJob) return;
    try {
      await applicationApi.apply({ jobId: selectedJob.id, coverLetter });
      setMsg("Application submitted successfully!");
      setApplyingId(null);
      setCoverLetter("");
      loadJobs();
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Failed to apply.");
    }
  };

  const handleReport = async () => {
    if (!reportJob) return;
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
            jobId: reportJob.id,
            jobTitle: reportJob.title,
            reason: reportReason,
            description: reportDesc,
          }),
        },
      );
      if (res.ok) {
        setReportMsg(
          "Report submitted. Our admin team will review it shortly.",
        );
        setTimeout(() => {
          setReportJob(null);
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
        <div className="page-title">Browse Jobs</div>
        {role === "STUDENT" && (
          <button
            className={`btn ${matching ? "btn-primary" : "btn-outline"}`}
            onClick={() => {
              setMatching(!matching);
              setPage(0);
            }}
          >
            {matching ? "✨ Showing Matched Jobs" : "✨ Show Matching Jobs"}
          </button>
        )}
      </div>

      {msg && (
        <div className={msg.includes("success") ? "success-msg" : "error-msg"}>
          {msg}
        </div>
      )}

      <form
        onSubmit={handleSearch}
        className="flex-gap"
        style={{ marginBottom: 20 }}
      >
        <input
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: "0.95rem",
          }}
          placeholder="Search jobs by title, description or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">
          Search
        </button>
        {search && (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => {
              setSearch("");
              setPage(0);
              loadJobs();
            }}
          >
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <div className="loading">Loading jobs...</div>
      ) : (
        <>
          {jobs.length === 0 ? (
            <div className="empty-state">No jobs found.</div>
          ) : (
            <div className="card-grid">
              {jobs.map((job) => (
                <div key={job.id} className="card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                      {job.title}
                    </div>
                    <span className={`badge badge-${job.status.toLowerCase()}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="text-muted" style={{ marginBottom: 8 }}>
                    {job.companyName} {job.location && `· ${job.location}`}
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      marginBottom: 8,
                      color: "#444",
                    }}
                  >
                    {job.description.length > 120
                      ? job.description.slice(0, 120) + "..."
                      : job.description}
                  </div>
                  {job.hourlyRate && (
                    <div className="text-muted">💰 {job.hourlyRate} ALL/hr</div>
                  )}
                  {job.hoursPerWeek && (
                    <div className="text-muted">⏱ {job.hoursPerWeek}h/week</div>
                  )}
                  {job.shiftStartTime && (
                    <div className="text-muted">
                      🕐 {job.shiftStartTime} – {job.shiftEndTime}
                    </div>
                  )}
                  {job.workDays?.length > 0 && (
                    <div className="flex-gap mt-2">
                      {job.workDays.map((d) => (
                        <span key={d} className="tag">
                          {d.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  )}
                  {job.requiredSkills?.length > 0 && (
                    <div className="flex-gap mt-2">
                      {job.requiredSkills.map((s) => (
                        <span key={s} className="tag">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {role === "STUDENT" && (
                    <div
                      className="mt-4"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      {job.alreadyApplied ? (
                        <span className="badge badge-accepted">✓ Applied</span>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSelectedJob(job);
                            setApplyingId(job.id);
                            setMsg("");
                          }}
                        >
                          Apply Now
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setReportJob(job);
                          setReportReason(REPORT_REASONS[0]);
                          setReportDesc("");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#9ca3af",
                          fontSize: "0.8rem",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                        title="Report this job"
                      >
                        🚩 Report
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

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
        </>
      )}

      {/* Apply Modal */}
      {applyingId && selectedJob && (
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
          <div className="card" style={{ width: 480, maxWidth: "95vw" }}>
            <div className="card-title">Apply for: {selectedJob.title}</div>
            <div className="text-muted" style={{ marginBottom: 12 }}>
              {selectedJob.companyName}
            </div>
            <div className="form-group">
              <label>Cover Letter (optional)</label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell the employer why you're a great fit..."
              />
            </div>
            <div className="flex-gap">
              <button className="btn btn-primary" onClick={handleApply}>
                Submit Application
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setApplyingId(null);
                  setCoverLetter("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportJob && (
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
                🚩 Report Job Posting
              </div>
              <button
                onClick={() => setReportJob(null)}
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
                {reportJob.title}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                {reportJob.companyName}
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
                      fontSize: "0.95rem",
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
                    placeholder="Describe the issue in more detail..."
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: "0.95rem",
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
                    onClick={() => setReportJob(null)}
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

export default JobsBrowse;
