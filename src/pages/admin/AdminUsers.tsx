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

  return (
    <div>
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
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>
                        {u.firstName} {u.lastName}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className="tag">{u.role}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${u.active ? "badge-accepted" : "badge-rejected"}`}
                        >
                          {u.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="text-muted">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <div className="flex-gap">
                          <button
                            className={`btn btn-sm ${u.active ? "btn-warning" : "btn-success"}`}
                            onClick={() => toggleActive(u.id)}
                          >
                            {u.active ? "Deactivate" : "Activate"}
                          </button>
                          {(u.role === "STUDENT" || u.role === "EMPLOYER") && (
                            <button
                              className="btn btn-primary btn-sm"
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
