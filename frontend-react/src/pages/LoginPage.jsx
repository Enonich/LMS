import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Redirect after login based on user role
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        nav('/admin', { replace: true });
      } else {
        nav('/dashboard', { replace: true });
      }
    }
  }, [user, nav]);
  async function onSubmit(e) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      await login(email, password);
      // Navigation will be handled by useEffect above
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
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
    padding:'1rem',
    position:'relative',
    overflow:'hidden'
  },
  card: {
    background:'rgba(255,255,255,0.95)', 
    backdropFilter:'blur(30px) saturate(180%)',
    padding:'2.5rem', 
    borderRadius:'24px', 
    width:'100%',
    maxWidth:'450px', 
    boxShadow:'0 25px 60px rgba(0,0,0,0.25), 0 0 80px rgba(102,126,234,0.15), inset 0 0 0 1px rgba(255,255,255,0.3)',
    border:'1px solid rgba(255,255,255,0.4)',
    animation:'scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    position:'relative',
    zIndex:1
  },
  logoSection: {
    textAlign:'center',
    marginBottom:'2rem',
    animation:'slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  logo: {
    fontSize:'4rem',
    marginBottom:'0.5rem',
    animation:'float 3s ease-in-out infinite',
    display:'inline-block',
    filter:'drop-shadow(0 8px 16px rgba(102,126,234,0.3))'
  },
  brandName: {
    fontSize:'1.8rem',
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
    fontSize:'0.9rem',
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
    fontSize:'1.75rem',
    fontWeight:800,
    color:'#1f2937',
    margin:'0 0 0.5rem',
    textAlign:'center',
    letterSpacing:'-0.02em'
  },
  subtitle: {
    fontSize:'0.95rem',
    color:'#718096',
    margin:'0 0 1.75rem',
    textAlign:'center',
    fontWeight:400,
    lineHeight:1.5
  },
  error: {
    background:'linear-gradient(135deg, rgba(254, 215, 215, 0.9), rgba(252, 129, 129, 0.2))',
    backdropFilter:'blur(10px)',
    color:'#c53030',
    padding:'1rem 1.25rem',
    borderRadius:'12px',
    marginBottom:'1.25rem',
    fontSize:'0.9rem',
    display:'flex',
    alignItems:'center',
    fontWeight:600,
    border:'1px solid rgba(197, 48, 48, 0.2)',
    boxShadow:'0 4px 12px rgba(197, 48, 48, 0.15)',
    animation:'slideDown 0.4s ease'
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
    padding:'0.875rem 1rem',
    border:'2px solid #e2e8f0',
    borderRadius:'12px',
    fontSize:'0.95rem',
    transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline:'none',
    fontFamily:'inherit',
    boxSizing:'border-box',
    background:'rgba(247,250,252,0.5)',
    backdropFilter:'blur(10px)'
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
    marginTop:'0.75rem',
    padding:'1rem',
    border:'none',
    borderRadius:'12px',
    background:'linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%)',
    backgroundSize:'200% 200%',
    color:'#fff',
    fontWeight:700,
    fontSize:'1rem',
    cursor:'pointer',
    transition:'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow:'0 8px 24px rgba(102,126,234,0.4), 0 0 40px rgba(118,75,162,0.2)',
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
    marginTop:'1.5rem',
    fontSize:'0.9rem',
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
