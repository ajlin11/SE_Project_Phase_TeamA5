import React, { useEffect, useState } from 'react';
import { notificationApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getAll(0);
      setNotifications(res.data.data.content);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await notificationApi.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id: number) => {
    await notificationApi.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getIcon = (type: string) => {
    if (type.includes('ACCEPTED')) return '✅';
    if (type.includes('REJECTED')) return '❌';
    if (type.includes('INTERVIEW')) return '📅';
    if (type.includes('MESSAGE')) return '💬';
    if (type.includes('SUBMITTED')) return '📋';
    return '🔔';
  };

  if (loading) return <div className="loading">Loading notifications...</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🔔 Notifications</div>
        <button className="btn btn-outline btn-sm" onClick={markAllRead}>Mark all as read</button>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">No notifications yet.</div>
      ) : (
        <div className="card">
          {notifications.map(n => (
            <div key={n.id}
              style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #f3f4f6', background: n.read ? 'transparent' : '#eff6ff', cursor: 'pointer' }}
              onClick={() => !n.read && markRead(n.id)}>
              <div style={{ fontSize: '1.3rem' }}>{getIcon(n.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: n.read ? 400 : 600 }}>{n.message}</div>
                <div className="text-muted">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a56db', marginTop: 6 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
