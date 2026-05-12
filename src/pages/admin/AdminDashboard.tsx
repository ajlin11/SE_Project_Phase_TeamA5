import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/services';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats().then(r => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading stats...</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">⚙️ Admin Dashboard</div>
      </div>
      <div className="stats-grid">
        {Object.entries(stats).map(([key, val]) => (
          <div key={key} className="stat-card">
            <div className="stat-number">{val}</div>
            <div className="stat-label">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
