import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null); setLoading(true);
    try { await login(email, password); nav('/dashboard'); } catch (e) { setError(e); } finally { setLoading(false); }
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
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Sign in to continue your learning journey</p>
          
          {error && <div style={styles.error}>
            <i className="fas fa-exclamation-circle" style={{ marginRight:'0.5rem' }}></i>
            {error}
          </div>}
          
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <i className="fas fa-envelope" style={styles.labelIcon}></i>
              Email Address
            </label>
            <input 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              type="email" 
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
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                type={showPassword ? 'text' : 'password'} 
                required 
                placeholder="Enter your password"
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
          </div>
          
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin" style={{ marginRight:'0.5rem' }}></i>
                Logging in...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt" style={{ marginRight:'0.5rem' }}></i>
                Login
              </>
            )}
          </button>
          
          <div style={styles.footer}>
            Don't have an account? 
            <Link to="/register" style={styles.link}>Create one now</Link>
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
    padding:'1rem'
  },
  card: {
    background:'rgba(255,255,255,0.98)', 
    backdropFilter:'blur(10px)',
    padding:'2rem', 
    borderRadius:'20px', 
    width:'100%',
    maxWidth:'420px', 
    boxShadow:'0 15px 40px rgba(0,0,0,0.15)',
    border:'1px solid rgba(255,255,255,0.3)'
  },
  logoSection: {
    textAlign:'center',
    marginBottom:'1.5rem'
  },
  logo: {
    fontSize:'3rem',
    marginBottom:'0.25rem'
  },
  brandName: {
    fontSize:'1.5rem',
    fontWeight:700,
    margin:'0.25rem 0',
    background:'linear-gradient(135deg,#667eea,#764ba2)',
    WebkitBackgroundClip:'text',
    WebkitTextFillColor:'transparent',
    backgroundClip:'text'
  },
  tagline: {
    fontSize:'0.8rem',
    color:'#718096',
    margin:0
  },
  form: {
    width:'100%'
  },
  title: {
    fontSize:'1.5rem',
    fontWeight:700,
    color:'#1f2937',
    margin:'0 0 0.35rem',
    textAlign:'center'
  },
  subtitle: {
    fontSize:'0.85rem',
    color:'#718096',
    margin:'0 0 1.25rem',
    textAlign:'center'
  },
  error: {
    background:'#fed7d7',
    color:'#c53030',
    padding:'0.75rem',
    borderRadius:'10px',
    marginBottom:'1rem',
    fontSize:'0.85rem',
    display:'flex',
    alignItems:'center',
    fontWeight:500
  },
  formGroup: {
    marginBottom:'1rem'
  },
  label: {
    display:'flex',
    alignItems:'center',
    fontSize:'0.85rem',
    fontWeight:600,
    color:'#2d3748',
    marginBottom:'0.4rem'
  },
  labelIcon: {
    marginRight:'0.5rem',
    color:'#667eea',
    width:'14px'
  },
  input: {
    width:'100%',
    padding:'0.75rem 0.85rem',
    border:'2px solid #e2e8f0',
    borderRadius:'10px',
    fontSize:'0.9rem',
    transition:'all 0.2s',
    outline:'none',
    fontFamily:'inherit',
    boxSizing:'border-box'
  },
  passwordContainer: {
    position:'relative'
  },
  passwordToggle: {
    position:'absolute',
    right:'0.85rem',
    top:'50%',
    transform:'translateY(-50%)',
    background:'transparent',
    border:'none',
    color:'#718096',
    cursor:'pointer',
    fontSize:'0.95rem',
    padding:'0.4rem',
    transition:'color 0.2s'
  },
  submitBtn: {
    width:'100%',
    marginTop:'0.5rem',
    padding:'0.85rem',
    border:'none',
    borderRadius:'10px',
    background:'linear-gradient(135deg,#667eea,#764ba2)',
    color:'#fff',
    fontWeight:600,
    fontSize:'0.95rem',
    cursor:'pointer',
    transition:'all 0.2s',
    boxShadow:'0 4px 15px rgba(102,126,234,0.4)',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    fontFamily:'inherit'
  },
  footer: {
    marginTop:'1rem',
    fontSize:'0.85rem',
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
