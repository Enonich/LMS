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
    padding:'2rem',
    position:'relative',
    overflow:'hidden'
  },
  card: {
    background:'#ffffff', 
    padding:'3rem', 
    borderRadius:'16px', 
    width:'100%',
    maxWidth:'540px', 
    boxShadow:'0 4px 20px rgba(0,0,0,0.1)',
    border:'1px solid #e5e7eb',
    position:'relative',
    zIndex:1
  },
  logoSection: {
    textAlign:'center',
    marginBottom:'2.5rem'
  },
  logo: {
    fontSize:'4.5rem',
    marginBottom:'0.75rem',
    display:'inline-block'
  },
  brandName: {
    fontSize:'2.2rem',
    fontWeight:800,
    margin:'0.5rem 0 0.25rem',
    background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
    WebkitBackgroundClip:'text',
    WebkitTextFillColor:'transparent',
    backgroundClip:'text',
    letterSpacing:'-0.02em'
  },
  tagline: {
    fontSize:'1rem',
    color:'#718096',
    margin:0,
    fontWeight:500,
    letterSpacing:'0.05em',
    textTransform:'uppercase',
    opacity:0.8
  },
  form: {
    width:'100%'
  },
  title: {
    fontSize:'2rem',
    fontWeight:800,
    color:'#1f2937',
    margin:'0 0 0.5rem',
    textAlign:'center',
    letterSpacing:'-0.02em'
  },
  subtitle: {
    fontSize:'1rem',
    color:'#718096',
    margin:'0 0 2rem',
    textAlign:'center',
    fontWeight:400,
    lineHeight:1.5
  },
  error: {
    background:'#fed7d7',
    color:'#c53030',
    padding:'1rem 1.25rem',
    borderRadius:'12px',
    marginBottom:'1.5rem',
    fontSize:'0.95rem',
    display:'flex',
    alignItems:'center',
    fontWeight:600,
    border:'1px solid #fc8181'
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
    padding:'1rem 1.25rem',
    border:'2px solid #e2e8f0',
    borderRadius:'12px',
    fontSize:'1rem',
    transition:'all 0.2s',
    outline:'none',
    fontFamily:'inherit',
    boxSizing:'border-box',
    background:'#ffffff'
  },
  select: {
    width:'100%',
    padding:'1rem 1.25rem',
    border:'2px solid #e2e8f0',
    borderRadius:'12px',
    fontSize:'1rem',
    transition:'all 0.2s',
    outline:'none',
    background:'#ffffff',
    color:'#1f2937',
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
    marginTop:'0.75rem',
    padding:'1.125rem',
    border:'none',
    borderRadius:'12px',
    background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
    color:'#fff',
    fontWeight:700,
    fontSize:'1.05rem',
    cursor:'pointer',
    transition:'all 0.2s',
    boxShadow:'0 4px 12px rgba(102,126,234,0.3)',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    fontFamily:'inherit',
    letterSpacing:'0.03em'
  },
  footer: {
    marginTop:'2rem',
    fontSize:'0.95rem',
    textAlign:'center',
    color:'#718096',
    fontWeight:500
  },
  link: {
    color:'#667eea',
    textDecoration:'none',
    fontWeight:700,
    marginLeft:'0.5rem',
    transition:'all 0.3s',
    background:'linear-gradient(135deg,#667eea,#764ba2)',
    WebkitBackgroundClip:'text',
    WebkitTextFillColor:'transparent',
    backgroundClip:'text',
    position:'relative'
  }
};
