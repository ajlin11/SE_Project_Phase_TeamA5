import React, { useEffect, useState } from 'react';
import { studentApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { Availability, AvailabilityDay, AvailabilityRequest } from '../../types';

const DAYS: AvailabilityDay[] = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];

const AvailabilityManager: React.FC = () => {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState<AvailabilityRequest>({
    dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '11:00', busy: true, description: '',
  });

  useEffect(() => {
    studentApi.getMe().then(r => {
      const id = r.data.data.id;
      setStudentId(id);
      return studentApi.getAvailability(id);
    }).then(r => setSlots(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addSlot = async () => {
    if (!studentId) return;
    const updated = [...slots, form as any];
    try {
      const res = await studentApi.setAvailability(studentId, updated.map(s => ({
        dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime,
        busy: s.busy ?? s.isBusy ?? false, description: s.description,
      })));
      setSlots(res.data.data);
      setMsg('Schedule updated!');
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to update schedule.');
    }
  };

  const deleteSlot = async (slotId: number) => {
    if (!studentId) return;
    try {
      await studentApi.deleteAvailabilitySlot(studentId, slotId);
      setSlots(slots.filter(s => s.id !== slotId));
      setMsg('Slot deleted.');
    } catch (err: any) {
      setMsg('Failed to delete slot.');
    }
  };

  if (loading) return <div className="loading">Loading schedule...</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📅 My Availability Schedule</div>
      </div>
      <p className="text-muted" style={{ marginBottom: 20 }}>
        Mark your busy slots (class times) so TESS can show you only jobs that fit your schedule.
      </p>

      {msg && <div className={msg.includes('!') ? 'success-msg' : 'error-msg'}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-title">Add Availability Slot</div>
          <div className="form-group">
            <label>Day</label>
            <select value={form.dayOfWeek} onChange={e => setForm({ ...form, dayOfWeek: e.target.value as AvailabilityDay })}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.busy ? 'busy' : 'free'} onChange={e => setForm({ ...form, busy: e.target.value === 'busy' })}>
              <option value="busy">🔴 Busy (Class / Unavailable)</option>
              <option value="free">🟢 Free (Available to work)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <input value={form.description} placeholder="e.g. Software Engineering lecture"
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={addSlot}>Add Slot</button>
        </div>

        <div className="card">
          <div className="card-title">Current Schedule ({slots.length} slots)</div>
          {slots.length === 0 ? (
            <div className="empty-state">No slots added yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DAYS.filter(d => slots.some(s => s.dayOfWeek === d)).map(day => (
                <div key={day}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: '#1a56db' }}>{day}</div>
                  {slots.filter(s => s.dayOfWeek === day).map(slot => (
                    <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: slot.busy ? '#fee2e2' : '#d1fae5', borderRadius: 6, marginBottom: 4 }}>
                      <div>
                        <span>{slot.startTime} – {slot.endTime}</span>
                        <span style={{ marginLeft: 8 }}>{slot.busy ? '🔴 Busy' : '🟢 Free'}</span>
                        {slot.description && <span className="text-muted" style={{ marginLeft: 8 }}>{slot.description}</span>}
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteSlot(slot.id)}>✕</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityManager;
