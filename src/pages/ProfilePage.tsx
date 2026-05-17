import React, { useEffect, useState } from 'react';
import { studentApi, employerApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Student, Employer } from '../types';

const ProfilePage: React.FC = () => {
  const { user, role } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (role === 'STUDENT') {
      studentApi.getMe().then((r: any) => { setStudent(r.data.data); setForm({ bio: r.data.data.bio || '', faculty: r.data.data.faculty || '', major: r.data.data.major || '' }); })
        .finally(() => setLoading(false));
    } else if (role === 'EMPLOYER') {
      employerApi.getMe().then((r: any) => { setEmployer(r.data.data); setForm({ companyDescription: r.data.data.companyDescription || '', city: r.data.data.city || '', website: r.data.data.website || '' }); })
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, [role]);

  const saveProfile = async () => {
    setMsg('');
    try {
      if (role === 'STUDENT' && student) {
        const res = await studentApi.updateProfile(student.id, form);
        setStudent(res.data.data); setMsg('Profile saved!');
      } else if (role === 'EMPLOYER' && employer) {
        const res = await employerApi.updateProfile(employer.id, form);
        setEmployer(res.data.data); setMsg('Profile saved!');
      }
    } catch (err: any) { setMsg(err.response?.data?.message || 'Failed to save.'); }
  };

  const addSkill = async () => {
    if (!student || !skillInput.trim()) return;
    const skills = [...student.skills, skillInput.trim()];
    try {
      const res = await studentApi.updateSkills(student.id, skills);
      setStudent(res.data.data); setSkillInput(''); setMsg('Skills updated!');
    } catch { setMsg('Failed to update skills.'); }
  };

  const removeSkill = async (skill: string) => {
    if (!student) return;
    const skills = student.skills.filter((s: string) => s !== skill);
    try {
      const res = await studentApi.updateSkills(student.id, skills);
      setStudent(res.data.data);
    } catch { setMsg('Failed to remove skill.'); }
  };

  const uploadCv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!student || !e.target.files?.[0]) return;
    try {
      const res = await studentApi.uploadCv(student.id, e.target.files[0]);
      setStudent(res.data.data); setMsg('CV uploaded successfully!');
    } catch (err: any) { setMsg(err.response?.data?.message || 'Failed to upload CV.'); }
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">👤 My Profile</div>
      </div>

      {msg && <div className={msg.includes('!') ? 'success-msg' : 'error-msg'}>{msg}</div>}

      <div className="card">
        <div className="card-title">Account Info</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><span className="text-muted">Name:</span> {user?.firstName} {user?.lastName}</div>
          <div><span className="text-muted">Email:</span> {user?.email}</div>
          <div><span className="text-muted">Role:</span> {user?.role}</div>
        </div>
      </div>

      {role === 'STUDENT' && student && (
        <>
          <div className="card">
            <div className="card-title">Academic Info</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><span className="text-muted">University:</span> {student.university}</div>
              <div><span className="text-muted">Year:</span> {student.yearOfStudy}</div>
            </div>
            <div className="form-group">
              <label>Faculty</label>
              <input value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Major</label>
              <input value={form.major} onChange={e => setForm({ ...form, major: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell employers about yourself..." />
            </div>
            <button className="btn btn-primary" onClick={saveProfile}>Save Profile</button>
          </div>

          <div className="card">
            <div className="card-title">🛠 Skills</div>
            <div className="flex-gap" style={{ marginBottom: 12 }}>
              {student.skills.map((s: string) => (
                <span key={s} className="tag" style={{ cursor: 'pointer' }} onClick={() => removeSkill(s)}>{s} ✕</span>
              ))}
              {student.skills.length === 0 && <span className="text-muted">No skills added yet.</span>}
            </div>
            <div className="flex-gap">
              <input value={skillInput} placeholder="Add a skill (e.g. Java, React)"
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                style={{ width: 240, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }} />
              <button className="btn btn-outline btn-sm" onClick={addSkill}>Add Skill</button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">📄 CV</div>
            <div style={{ marginBottom: 12 }}>
              {student.cvPath ? (
                <div className="success-msg" style={{ display: 'inline-block' }}>✅ CV uploaded</div>
              ) : (
                <div className="error-msg" style={{ display: 'inline-block' }}>❌ No CV uploaded yet</div>
              )}
            </div>
            <div>
              <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                {student.cvPath ? '🔄 Replace CV' : '📤 Upload CV'}
                <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={uploadCv} />
              </label>
              <div className="text-muted mt-2">Accepted: PDF, DOC, DOCX (max 10MB)</div>
            </div>
          </div>
        </>
      )}

      {role === 'EMPLOYER' && employer && (
        <div className="card">
          <div className="card-title">Company Info</div>
          <div style={{ marginBottom: 12 }}>
            <span className="text-muted">Company:</span> <strong>{employer.companyName}</strong>
            {employer.verified && <span className="badge badge-accepted" style={{ marginLeft: 8 }}>✓ Verified</span>}
          </div>
          <div className="form-group">
            <label>Company Description</label>
            <textarea value={form.companyDescription} onChange={e => setForm({ ...form, companyDescription: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Website</label>
              <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={saveProfile}>Save Profile</button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
