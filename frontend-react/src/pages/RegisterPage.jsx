import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name:'', email:'', password:'', department:'' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(field, value){ setForm(prev=>({ ...prev, [field]: value })); }

  async function onSubmit(e){
    e.preventDefault(); setError(null); setLoading(true);
    try { await register(form); alert('✅ Registration successful! Please login.'); nav('/login'); } catch(e){ setError(e); } finally { setLoading(false); }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoSection}>
          <div style={styles.logo}>🧠</div>
          <h1 style={styles.brandName}>LMS Pro</h1>
          <p style={styles.tagline}>Learning Management System</p>
        </div>
        
        <form onSubmit={onSubmit} style={styles.form}>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Join us and start your learning journey</p>
          
          {error && <div style={styles.error}>
            <i className="fas fa-exclamation-circle" style={{ marginRight:'0.5rem' }}></i>
            {error}
          </div>}
          
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <i className="fas fa-user" style={styles.labelIcon}></i>
              Full Name
            </label>
            <input 
              value={form.full_name} 
              onChange={e=>update('full_name',e.target.value)} 
              required 
              placeholder="John Doe"
              style={styles.input} 
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <i className="fas fa-envelope" style={styles.labelIcon}></i>
              Email Address
            </label>
            <input 
              type="email" 
              value={form.email} 
              onChange={e=>update('email',e.target.value)} 
              required 
              placeholder="your.email@example.com"
              style={styles.input} 
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <i className="fas fa-lock" style={styles.labelIcon}></i>
              Password
            </label>
            <div style={styles.passwordContainer}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={form.password} 
                onChange={e=>update('password',e.target.value)} 
                required 
                minLength={8}
                placeholder="Minimum 8 characters"
                style={{...styles.input, paddingRight:'3rem'}} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
              </button>
            </div>
            <div style={styles.hint}>
              <i className="fas fa-info-circle" style={{ marginRight:'0.5rem' }}></i>
              Must be at least 8 characters with 1 uppercase letter and 1 number
            </div>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <i className="fas fa-university" style={styles.labelIcon}></i>
              Department
            </label>
            <select 
              value={form.department} 
              onChange={e=>update('department',e.target.value)} 
              required 
              style={styles.select}
            >
              <option value="">Select Department</option>
              {['Physics','Chemistry','Biology','Mathematics','Computer Science'].map(d=> 
                <option key={d} value={d}>{d}</option>
              )}
            </select>
          </div>
          
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin" style={{ marginRight:'0.5rem' }}></i>
                Creating Account...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus" style={{ marginRight:'0.5rem' }}></i>
                Create Account
              </>
            )}
          </button>
          
          <div style={styles.footer}>
            Already have an account? 
            <Link to="/login" style={styles.link}>Sign in here</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display:'flex', 
    alignItems:'center', 
    justifyContent:'center', 
    minHeight:'100vh',
    padding:'2rem'
  },
  card: {
    background:'rgba(255,255,255,0.98)', 
    backdropFilter:'blur(10px)',
    padding:'3rem', 
    borderRadius:'24px', 
    width:'100%',
    maxWidth:'520px', 
    boxShadow:'0 20px 60px rgba(0,0,0,0.2)',
    border:'1px solid rgba(255,255,255,0.3)'
  },
  logoSection: {
    textAlign:'center',
    marginBottom:'2.5rem'
  },
  logo: {
    fontSize:'4rem',
    marginBottom:'0.5rem'
  },
  brandName: {
    fontSize:'2rem',
    fontWeight:700,
    margin:'0.5rem 0 0.25rem',
    background:'linear-gradient(135deg,#667eea,#764ba2)',
    WebkitBackgroundClip:'text',
    WebkitTextFillColor:'transparent',
    backgroundClip:'text'
  },
  tagline: {
    fontSize:'0.9rem',
    color:'#718096',
    margin:0
  },
  form: {
    width:'100%'
  },
  title: {
    fontSize:'1.75rem',
    fontWeight:700,
    color:'#1f2937',
    margin:'0 0 0.5rem',
    textAlign:'center'
  },
  subtitle: {
    fontSize:'0.95rem',
    color:'#718096',
    margin:'0 0 2rem',
    textAlign:'center'
  },
  error: {
    background:'#fed7d7',
    color:'#c53030',
    padding:'1rem',
    borderRadius:'12px',
    marginBottom:'1.5rem',
    fontSize:'0.9rem',
    display:'flex',
    alignItems:'center',
    fontWeight:500
  },
  formGroup: {
    marginBottom:'1.5rem'
  },
  label: {
    display:'flex',
    alignItems:'center',
    fontSize:'0.9rem',
    fontWeight:600,
    color:'#2d3748',
    marginBottom:'0.5rem'
  },
  labelIcon: {
    marginRight:'0.5rem',
    color:'#667eea',
    width:'16px'
  },
  input: {
    width:'100%',
    padding:'0.875rem 1rem',
    border:'2px solid #e2e8f0',
    borderRadius:'12px',
    fontSize:'0.95rem',
    transition:'all 0.2s',
    outline:'none',
    fontFamily:'inherit',
    boxSizing:'border-box'
  },
  select: {
    width:'100%',
    padding:'0.875rem 1rem',
    border:'2px solid #e2e8f0',
    borderRadius:'12px',
    fontSize:'0.95rem',
    transition:'all 0.2s',
    outline:'none',
    background:'#fff',
    cursor:'pointer',
    fontFamily:'inherit',
    boxSizing:'border-box'
  },
  passwordContainer: {
    position:'relative'
  },
  passwordToggle: {
    position:'absolute',
    right:'1rem',
    top:'50%',
    transform:'translateY(-50%)',
    background:'transparent',
    border:'none',
    color:'#718096',
    cursor:'pointer',
    fontSize:'1rem',
    padding:'0.5rem',
    transition:'color 0.2s'
  },
  hint: {
    fontSize:'0.8rem',
    color:'#718096',
    marginTop:'0.5rem',
    display:'flex',
    alignItems:'center'
  },
  submitBtn: {
    width:'100%',
    marginTop:'0.5rem',
    padding:'1rem',
    border:'none',
    borderRadius:'12px',
    background:'linear-gradient(135deg,#667eea,#764ba2)',
    color:'#fff',
    fontWeight:600,
    fontSize:'1rem',
    cursor:'pointer',
    transition:'all 0.2s',
    boxShadow:'0 4px 15px rgba(102,126,234,0.4)',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    fontFamily:'inherit'
  },
  footer: {
    marginTop:'1.5rem',
    fontSize:'0.9rem',
    textAlign:'center',
    color:'#718096'
  },
  link: {
    color:'#667eea',
    textDecoration:'none',
    fontWeight:600,
    marginLeft:'0.5rem',
    transition:'color 0.2s'
  }
};
