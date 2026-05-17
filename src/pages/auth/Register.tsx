import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

const Register: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('STUDENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
    // student
    age: '', university: '', faculty: '', major: '', yearOfStudy: '',
    // employer
    companyName: '', industry: '', website: '', address: '', city: '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const payload: any = {
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, password: form.password,
        phone: form.phone, role,
      };
      if (role === 'STUDENT') {
        payload.age = parseInt(form.age);
        payload.university = form.university;
        payload.faculty = form.faculty;
        payload.major = form.major;
        payload.yearOfStudy = parseInt(form.yearOfStudy);
        payload.activeStudent = true;
      } else {
        payload.companyName = form.companyName;
        payload.industry = form.industry;
        payload.website = form.website;
        payload.address = form.address;
        payload.city = form.city;
      }
      const res = await authApi.register(payload);
      login(res.data.data);
      navigate(role === 'STUDENT' ? '/student/dashboard' : '/employer/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <div className="auth-title">Create Account 🎓</div>
        <div className="auth-subtitle">Join TESS today</div>
        {error && <div className="error-msg">{error}</div>}

        <div className="form-group">
          <label>I am a...</label>
          <select value={role} onChange={e => setRole(e.target.value as Role)}>
            <option value="STUDENT">Student</option>
            <option value="EMPLOYER">Employer / Company</option>
          </select>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input value={form.firstName} required onChange={set('firstName')} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input value={form.lastName} required onChange={set('lastName')} />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} required onChange={set('email')} />
          </div>
          <div className="form-group">
            <label>Password (min 8 characters)</label>
            <input type="password" value={form.password} required minLength={8} onChange={set('password')} />
          </div>
          <div className="form-group">
            <label>Phone (optional)</label>
            <input value={form.phone} onChange={set('phone')} />
          </div>

          {role === 'STUDENT' && <>
            <div className="divider" />
            <div className="form-row">
              <div className="form-group">
                <label>Age</label>
                <input type="number" value={form.age} required min={16} max={35} onChange={set('age')} />
              </div>
              <div className="form-group">
                <label>Year of Study</label>
                <input type="number" value={form.yearOfStudy} min={1} max={6} onChange={set('yearOfStudy')} />
              </div>
            </div>
            <div className="form-group">
              <label>University</label>
              <input value={form.university} required onChange={set('university')} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Faculty</label>
                <input value={form.faculty} onChange={set('faculty')} />
              </div>
              <div className="form-group">
                <label>Major</label>
                <input value={form.major} onChange={set('major')} />
              </div>
            </div>
          </>}

          {role === 'EMPLOYER' && <>
            <div className="divider" />
            <div className="form-group">
              <label>Company Name</label>
              <input value={form.companyName} required onChange={set('companyName')} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Industry</label>
                <input value={form.industry} onChange={set('industry')} />
              </div>
              <div className="form-group">
                <label>City</label>
                <input value={form.city} onChange={set('city')} />
              </div>
            </div>
            <div className="form-group">
              <label>Website</label>
              <input value={form.website} onChange={set('website')} />
            </div>
          </>}

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}
            type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-muted mt-4" style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
