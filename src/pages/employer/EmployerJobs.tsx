import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { jobApi } from "../../api/services";
import { Job, JobRequest, AvailabilityDay } from "../../types";

const DAYS: AvailabilityDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const emptyForm = (): JobRequest => ({
  title: "",
  description: "",
  location: "",
  hourlyRate: undefined,
  hoursPerWeek: undefined,
  status: "DRAFT",
  requiredSkills: [],
  workDays: [],
  shiftStartTime: "",
  shiftEndTime: "",
  maxApplicants: undefined,
});

const EmployerJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState<JobRequest>(emptyForm());
  const [skillInput, setSkillInput] = useState("");
  const [msg, setMsg] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await jobApi.getMyJobs(page);
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

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };
  const openEdit = (job: Job) => {
    setEditing(job);
    setForm({
      title: job.title,
      description: job.description,
      location: job.location || "",
      hourlyRate: job.hourlyRate,
      hoursPerWeek: job.hoursPerWeek,
      status: job.status,
      requiredSkills: job.requiredSkills || [],
      workDays: job.workDays || [],
      shiftStartTime: job.shiftStartTime || "",
      shiftEndTime: job.shiftEndTime || "",
      maxApplicants: job.maxApplicants,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    try {
      if (editing) {
        await jobApi.update(editing.id, form);
        setMsg("Job updated!");
      } else {
        await jobApi.create(form);
        setMsg("Job created!");
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Failed to save job.");
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await jobApi.publish(id);
      load();
    } catch (e: any) {
      setMsg(e.response?.data?.message || "Failed.");
    }
  };
  const handleClose = async (id: number) => {
    try {
      await jobApi.close(id);
      load();
    } catch (e: any) {
      setMsg(e.response?.data?.message || "Failed.");
    }
  };
  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this job?")) return;
    try {
      await jobApi.delete(id);
      load();
    } catch (e: any) {
      setMsg("Failed to delete.");
    }
  };

  const toggleDay = (day: AvailabilityDay) => {
    const days = form.workDays || [];
    setForm({
      ...form,
      workDays: days.includes(day)
        ? days.filter((d) => d !== day)
        : [...days, day],
    });
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setForm({
        ...form,
        requiredSkills: [...(form.requiredSkills || []), skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">My Job Postings</div>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Job
        </button>
      </div>

      {msg && (
        <div className={msg.includes("!") ? "success-msg" : "error-msg"}>
          {msg}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="card">
          {jobs.length === 0 ? (
            <div className="empty-state">
              No jobs yet. Create your first job posting!
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Applications</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td style={{ fontWeight: 600 }}>{job.title}</td>
                      <td>{job.location || "—"}</td>
                      <td>
                        <span
                          className={`badge badge-${job.status.toLowerCase()}`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td>{job.applicationCount}</td>
                      <td>
                        <div className="flex-gap">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openEdit(job)}
                          >
                            Edit
                          </button>
                          {job.status === "DRAFT" && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handlePublish(job.id)}
                            >
                              Publish
                            </button>
                          )}
                          {job.status === "ACTIVE" && (
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleClose(job.id)}
                            >
                              Close
                            </button>
                          )}
                          {job.status === "CLOSED" && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handlePublish(job.id)}
                            >
                              Reopen
                            </button>
                          )}
                          <Link
                            to={`/employer/applications?jobId=${job.id}`}
                            className="btn btn-secondary btn-sm"
                          >
                            Applicants
                          </Link>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(job.id)}
                          >
                            Delete
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

      {/* Job Form Modal */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            overflowY: "auto",
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              width: 600,
              maxWidth: "95vw",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div className="card-title">
              {editing ? "Edit Job" : "Create New Job"}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Job Title *</label>
                <input
                  value={form.title}
                  required
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={form.description}
                  required
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Hourly Rate (ALL)</label>
                  <input
                    type="number"
                    value={form.hourlyRate || ""}
                    onChange={(e) =>
                      setForm({ ...form, hourlyRate: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Hours/Week</label>
                  <input
                    type="number"
                    value={form.hoursPerWeek || ""}
                    onChange={(e) =>
                      setForm({ ...form, hoursPerWeek: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Max Applicants</label>
                  <input
                    type="number"
                    value={form.maxApplicants || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxApplicants: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Shift Start</label>
                  <input
                    type="time"
                    value={form.shiftStartTime}
                    onChange={(e) =>
                      setForm({ ...form, shiftStartTime: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Shift End</label>
                  <input
                    type="time"
                    value={form.shiftEndTime}
                    onChange={(e) =>
                      setForm({ ...form, shiftEndTime: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Work Days</label>
                <div className="flex-gap">
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`btn btn-sm ${form.workDays?.includes(d) ? "btn-primary" : "btn-outline"}`}
                      onClick={() => toggleDay(d)}
                    >
                      {d.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Required Skills</label>
                <div className="flex-gap" style={{ marginBottom: 8 }}>
                  <input
                    value={skillInput}
                    placeholder="Add a skill"
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addSkill())
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={addSkill}
                  >
                    Add
                  </button>
                </div>
                <div className="flex-gap">
                  {form.requiredSkills?.map((s) => (
                    <span
                      key={s}
                      className="tag"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setForm({
                          ...form,
                          requiredSkills: form.requiredSkills!.filter(
                            (x) => x !== s,
                          ),
                        })
                      }
                    >
                      {s} ✕
                    </span>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Save as</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as any })
                  }
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active (Publish now)</option>
                </select>
              </div>
              <div className="flex-gap">
                <button type="submit" className="btn btn-primary">
                  {editing ? "Update" : "Create"} Job
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerJobs;
