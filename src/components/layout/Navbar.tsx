import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../api/services';

const Navbar: React.FC = () => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    notificationApi.getUnreadCount()
      .then(r => setUnread(r.data.data.count))
      .catch(() => {});
    const interval = setInterval(() => {
      notificationApi.getUnreadCount()
        .then(r => setUnread(r.data.data.count))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🎓 TESS</Link>
      <div className="navbar-links">
        {role === 'STUDENT' && <>
          <Link to="/student/dashboard">Dashboard</Link>
          <Link to="/student/jobs">Browse Jobs</Link>
          <Link to="/student/applications">My Applications</Link>
          <Link to="/student/interviews">Interviews</Link>
          <Link to="/messages">Messages</Link>
        </>}
        {role === 'EMPLOYER' && <>
          <Link to="/employer/dashboard">Dashboard</Link>
          <Link to="/employer/jobs">My Jobs</Link>
          <Link to="/employer/applications">Applications</Link>
          <Link to="/employer/interviews">Interviews</Link>
          <Link to="/messages">Messages</Link>
        </>}
        {role === 'ADMIN' && <>
          <Link to="/admin/dashboard">Dashboard</Link>
          <Link to="/admin/users">Users</Link>
          <Link to="/admin/jobs">Jobs</Link>
        </>}
        <Link to="/notifications">
          🔔 {unread > 0 && <span className="navbar-badge">{unread}</span>}
        </Link>
        <Link to="/profile">👤 {user.firstName}</Link>
        <button className="btn-logout" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
