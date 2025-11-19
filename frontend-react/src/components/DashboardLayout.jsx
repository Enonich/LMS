import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
  { to: '/materials', icon: 'fa-book-open', label: 'Learn' },
  { to: '/quiz', icon: 'fa-brain', label: 'Daily Quiz' },
  { to: '/progress', icon: 'fa-chart-line', label: 'My Progress' },
  { to: '/schedule', icon: 'fa-cog', label: 'Settings' }
];

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const loc = useLocation();
  
  const isActive = (path) => {
    if (path === '/dashboard') {
      return loc.pathname === '/' || loc.pathname === '/dashboard';
    }
    return loc.pathname.startsWith(path);
  };
  
  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'rgba(0,0,0,0.05)' }}>
      {/* Top Navigation Bar */}
      <header style={{ 
        background:'rgba(255,255,255,0.98)', 
        backdropFilter:'blur(10px)', 
        padding:'0.875rem 2rem',
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        boxShadow:'0 2px 10px rgba(0,0,0,0.08)',
        zIndex:100
      }}>
        <div style={{ 
          fontWeight:700, 
          fontSize:'1.5rem', 
          background:'linear-gradient(135deg,#667eea,#764ba2)', 
          WebkitBackgroundClip:'text', 
          WebkitTextFillColor:'transparent', 
          backgroundClip:'text',
          display:'flex',
          alignItems:'center',
          gap:'0.5rem'
        }}>
          🧠 LMS Pro
        </div>

        <div style={{ 
          position: 'relative', 
          flex: '0 1 400px',
          maxWidth: '500px'
        }}>
          <i className="fas fa-search" style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            fontSize: '0.9rem',
            zIndex: 1
          }}></i>
          <input 
            type="text" 
            placeholder="Search courses..." 
            style={{
              width: '100%',
              padding: '0.625rem 1rem 0.625rem 2.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              background: '#ffffff',
              color: '#2d3748'
            }}
          />
        </div>
        
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{ 
            fontSize:'0.9rem', 
            color:'#4a5568', 
            fontWeight:500,
            display:'flex',
            alignItems:'center',
            gap:'0.5rem',
            padding:'0.5rem 1rem',
            background:'#f7fafc',
            borderRadius:'10px'
          }}>
            <i className="fas fa-user" style={{ color:'#667eea' }}/> 
            {user?.full_name || 'User'}
          </div>
          
          <Link to="/schedule" style={{
            background: isActive('/schedule') ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#f7fafc',
            color: isActive('/schedule') ? '#fff' : '#4a5568',
            border:'none',
            padding:'0.625rem 1.25rem',
            borderRadius:'10px',
            cursor:'pointer',
            fontWeight:600,
            fontSize:'0.9rem',
            transition:'all 0.2s',
            textDecoration:'none',
            display:'flex',
            alignItems:'center',
            gap:'0.5rem',
            boxShadow: isActive('/schedule') ? '0 2px 8px rgba(102,126,234,0.3)' : 'none'
          }}>
            <i className="fas fa-cog"/>
            Settings
          </Link>
          
          <button onClick={logout} style={{ 
            background:'linear-gradient(135deg,#fc8181,#e53e3e)', 
            color:'#fff', 
            border:'none', 
            padding:'0.625rem 1.25rem', 
            borderRadius:'10px', 
            cursor:'pointer', 
            fontWeight:600, 
            fontSize:'0.9rem', 
            boxShadow:'0 2px 8px rgba(229,62,62,0.3)', 
            transition:'all 0.2s',
            display:'flex',
            alignItems:'center',
            gap:'0.5rem'
          }}>
            <i className="fas fa-sign-out-alt"/>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', flex:1, overflow:'hidden' }}>
        <aside style={{ 
          background:'rgba(255,255,255,0.98)', 
          backdropFilter:'blur(10px)', 
          padding:'1.5rem', 
          display:'flex', 
          flexDirection:'column', 
          boxShadow:'2px 0 10px rgba(0,0,0,0.05)',
          overflowY:'auto'
        }}>
          <nav style={{ flex:1 }}>
            {navItems.filter(item => item.to !== '/schedule').map(item => (
              <Link key={item.to} to={item.to} style={{
                display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.875rem 1rem',
                borderRadius:'12px', textDecoration:'none', marginBottom:'0.5rem', transition:'all 0.2s',
                background: isActive(item.to) ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'transparent',
                color: isActive(item.to) ? '#fff' : '#4a5568',
                fontWeight: isActive(item.to) ? 600 : 500,
                fontSize:'0.95rem',
                boxShadow: isActive(item.to) ? '0 4px 12px rgba(102,126,234,0.3)' : 'none'
              }}>
                <i className={`fas ${item.icon}`} style={{ fontSize:'1.1rem' }}></i>{item.label}
              </Link>
            ))}
          </nav>
        </aside>
        
        <main style={{ padding:'2rem', overflowY:'auto', background:'transparent' }}>
          <div style={{ maxWidth:'1400px', margin:'0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
