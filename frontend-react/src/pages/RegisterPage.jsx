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
    background:'rgba(255,255,255,0.95)', 
    backdropFilter:'blur(30px) saturate(180%)',
    padding:'3rem', 
    borderRadius:'28px', 
    width:'100%',
    maxWidth:'540px', 
    boxShadow:'0 30px 80px rgba(0,0,0,0.3), 0 0 100px rgba(102,126,234,0.2), inset 0 0 0 1px rgba(255,255,255,0.3)',
    border:'1px solid rgba(255,255,255,0.5)',
    animation:'scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    position:'relative',
    zIndex:1
  },
  logoSection: {
    textAlign:'center',
    marginBottom:'2.5rem',
    animation:'slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  logo: {
    fontSize:'4.5rem',
    marginBottom:'0.75rem',
    animation:'float 3s ease-in-out infinite',
    display:'inline-block',
    filter:'drop-shadow(0 10px 20px rgba(102,126,234,0.35))'
  },
  brandName: {
    fontSize:'2.2rem',
    fontWeight:800,
    margin:'0.5rem 0 0.25rem',
    background:'linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%)',
    WebkitBackgroundClip:'text',
    WebkitTextFillColor:'transparent',
    backgroundClip:'text',
    letterSpacing:'-0.02em',
    textShadow:'0 2px 20px rgba(102,126,234,0.2)'
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
    background:'linear-gradient(135deg, rgba(254, 215, 215, 0.9), rgba(252, 129, 129, 0.2))',
    backdropFilter:'blur(10px)',
    color:'#c53030',
    padding:'1rem 1.25rem',
    borderRadius:'14px',
    marginBottom:'1.5rem',
    fontSize:'0.95rem',
    display:'flex',
    alignItems:'center',
    fontWeight:600,
    border:'1px solid rgba(197, 48, 48, 0.2)',
    boxShadow:'0 4px 12px rgba(197, 48, 48, 0.15)',
    animation:'slideDown 0.4s ease'
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
    borderRadius:'14px',
    fontSize:'1rem',
    transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline:'none',
    fontFamily:'inherit',
    boxSizing:'border-box',
    background:'rgba(247,250,252,0.5)',
    backdropFilter:'blur(10px)'
  },
  select: {
    width:'100%',
    padding:'1rem 1.25rem',
    border:'2px solid #e2e8f0',
    borderRadius:'14px',
    fontSize:'1rem',
    transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline:'none',
    background:'rgba(247,250,252,0.5)',
    backdropFilter:'blur(10px)',
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
    borderRadius:'14px',
    background:'linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%)',
    backgroundSize:'200% 200%',
    color:'#fff',
    fontWeight:700,
    fontSize:'1.05rem',
    cursor:'pointer',
    transition:'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow:'0 10px 30px rgba(102,126,234,0.45), 0 0 50px rgba(118,75,162,0.25)',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    fontFamily:'inherit',
    position:'relative',
    overflow:'hidden',
    animation:'shimmer 3s ease-in-out infinite',
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
