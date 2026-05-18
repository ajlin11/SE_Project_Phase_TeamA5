import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { User } from "../../types";

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const url = search.trim()
        ? `/admin/users/search?query=${encodeURIComponent(search)}`
        : `/admin/users?page=${page}&size=20`;
      const res = await api.get(url);
      const raw = res.data;
      let userList: User[] = [];
      let pages = 0;
      if (raw?.data?.content) {
        userList = raw.data.content;
        pages = raw.data.totalPages || 1;
      } else if (Array.isArray(raw?.data)) {
        userList = raw.data;
        pages = 1;
      } else if (raw?.content) {
        userList = raw.content;
        pages = raw.totalPages || 1;
      } else if (Array.isArray(raw)) {
        userList = raw;
        pages = 1;
      }
      setUsers(userList);
      setTotalPages(pages);
    } catch (e) {
      console.error("Error loading users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const toggleActive = async (userId: number) => {
    try {
      const res = await api.post(`/admin/users/${userId}/toggle-active`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? res.data.data : u)),
      );
      setMsg(res.data.message);
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Failed.");
    }
  };

  const deleteUser = async (userId: number) => {
    if (!window.confirm("Permanently delete this user?")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setMsg("User deleted.");
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Failed.");
    }
  };

  const verifyUser = async (userId: number, role: string) => {
    try {
      if (role === "STUDENT") {
        await api.post(`/admin/students/${userId}/verify`);
        setMsg("Student verified successfully!");
      } else if (role === "EMPLOYER") {
        await api.post(`/admin/employers/${userId}/verify`);
        setMsg("Employer verified successfully!");
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Failed to verify.");
    }
  };

  const roleColor: Record<string, string> = {
    STUDENT: "#1a56db",
    EMPLOYER: "#7c3aed",
    ADMIN: "#059669",
  };

  return (
    <div>
      {/* View User Modal */}
      {selectedUser && (
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
          onClick={() => setSelectedUser(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 32,
              width: 480,
              maxWidth: "90vw",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
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
                👤 User Details
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.4rem",
                  cursor: "pointer",
                  color: "#6b7280",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Avatar + Name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 24,
                padding: 16,
                background: "#f9fafb",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: roleColor[selectedUser.role] || "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {selectedUser.firstName?.[0]}
                {selectedUser.lastName?.[0]}
              </div>
              <div>
                <div
                  style={{ fontWeight: 700, fontSize: "1.1rem", color: "#111" }}
                >
                  {selectedUser.firstName} {selectedUser.lastName}
                </div>
                <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                  {selectedUser.email}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {[
                { label: "Role", value: selectedUser.role },
                {
                  label: "Status",
                  value: selectedUser.active ? "✅ Active" : "❌ Inactive",
                },
                { label: "Phone", value: (selectedUser as any).phone || "—" },
                {
                  label: "Joined",
                  value: selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleDateString()
                    : "—",
                },
                {
                  label: "Email Verified",
                  value: (selectedUser as any).emailVerified
                    ? "✅ Yes"
                    : "❌ No",
                },
                { label: "User ID", value: `#${selectedUser.id}` },
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
                      letterSpacing: "0.05em",
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

            {/* Role-specific info */}
            {selectedUser.role === "STUDENT" &&
              (selectedUser as any).student && (
                <div
                  style={{
                    borderTop: "1px solid #f3f4f6",
                    paddingTop: 16,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{ fontWeight: 600, color: "#111", marginBottom: 12 }}
                  >
                    🎓 Student Info
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    {[
                      {
                        label: "University",
                        value: (selectedUser as any).student?.university || "—",
                      },
                      {
                        label: "Faculty",
                        value: (selectedUser as any).student?.faculty || "—",
                      },
                      {
                        label: "Major",
                        value: (selectedUser as any).student?.major || "—",
                      },
                      {
                        label: "Year",
                        value:
                          (selectedUser as any).student?.yearOfStudy || "—",
                      },
                      {
                        label: "Age",
                        value: (selectedUser as any).student?.age || "—",
                      },
                      {
                        label: "Verified",
                        value: (selectedUser as any).student?.studentVerified
                          ? "✅ Yes"
                          : "⏳ Pending",
                      },
                      {
                        label: "CV",
                        value: (selectedUser as any).student?.cvPath
                          ? "✅ Uploaded"
                          : "❌ Not uploaded",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          padding: "10px 14px",
                          background: "#eff6ff",
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
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#111",
                            marginTop: 4,
                          }}
                        >
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {selectedUser.role === "EMPLOYER" &&
              (selectedUser as any).employer && (
                <div
                  style={{
                    borderTop: "1px solid #f3f4f6",
                    paddingTop: 16,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{ fontWeight: 600, color: "#111", marginBottom: 12 }}
                  >
                    🏢 Employer Info
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    {[
                      {
                        label: "Company",
                        value:
                          (selectedUser as any).employer?.companyName || "—",
                      },
                      {
                        label: "Industry",
                        value: (selectedUser as any).employer?.industry || "—",
                      },
                      {
                        label: "City",
                        value: (selectedUser as any).employer?.city || "—",
                      },
                      {
                        label: "Verified",
                        value: (selectedUser as any).employer?.verified
                          ? "✅ Yes"
                          : "⏳ Pending",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          padding: "10px 14px",
                          background: "#ede9fe",
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
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#111",
                            marginTop: 4,
                          }}
                        >
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <button
              className="btn btn-secondary"
              style={{ width: "100%" }}
              onClick={() => setSelectedUser(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="page-title">👥 User Management</div>
      </div>
      {msg && (
        <div className={msg.includes("!") ? "success-msg" : "error-msg"}>
          {msg}
        </div>
      )}
      <div className="flex-gap" style={{ marginBottom: 16 }}>
        <input
          placeholder="Search by name or email..."
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button className="btn btn-primary" onClick={load}>
          Search
        </button>
        {search && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearch("");
              setPage(0);
            }}
          >
            Clear
          </button>
        )}
      </div>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="card">
          {users.length === 0 ? (
            <div className="empty-state">No users found.</div>
          ) : (
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
                        width: "16%",
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        padding: "14px 20px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#374151",
                        width: "20%",
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        padding: "14px 20px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#374151",
                        width: "10%",
                      }}
                    >
                      Role
                    </th>
                    <th
                      style={{
                        padding: "14px 20px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#374151",
                        width: "10%",
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
                        width: "10%",
                      }}
                    >
                      Joined
                    </th>
                    <th
                      style={{
                        padding: "14px 20px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#374151",
                        width: "34%",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
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
                        {u.firstName} {u.lastName}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#4b5563" }}>
                        {u.email}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span className="tag">{u.role}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          className={`badge ${u.active ? "badge-accepted" : "badge-rejected"}`}
                        >
                          {u.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", color: "#6b7280" }}>
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div
                          className="flex-gap"
                          style={{ flexWrap: "nowrap", gap: 6 }}
                        >
                          <button
                            className="btn btn-sm"
                            style={{
                              background: "#f3f4f6",
                              color: "#374151",
                              border: "1px solid #e5e7eb",
                            }}
                            onClick={() => setSelectedUser(u)}
                          >
                            👁 View
                          </button>
                          <button
                            className={`btn btn-sm ${u.active ? "btn-warning" : "btn-success"}`}
                            onClick={() => toggleActive(u.id)}
                          >
                            {u.active ? "Deactivate" : "Activate"}
                          </button>
                          {(u.role === "STUDENT" || u.role === "EMPLOYER") && (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ whiteSpace: "nowrap", minWidth: 70 }}
                              onClick={() => verifyUser(u.id, u.role)}
                            >
                              ✓ Verify
                            </button>
                          )}
                          {u.role !== "ADMIN" && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => deleteUser(u.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
