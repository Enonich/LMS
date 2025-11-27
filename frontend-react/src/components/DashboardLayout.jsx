import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const loc = useLocation();
  
  // Different navigation items for admin vs regular users
  const navItems = user?.role === 'admin' 
    ? [
        { to: '/admin', icon: 'fa-tachometer-alt', label: 'Dashboard' },
        { to: '/admin?tab=questions', icon: 'fa-question-circle', label: 'Questions' },
        { to: '/admin?tab=materials', icon: 'fa-book', label: 'Materials' },
        { to: '/admin?tab=users', icon: 'fa-users', label: 'Users' },
        { to: '/admin?tab=departments', icon: 'fa-building', label: 'Departments' },
        { to: '/admin?tab=schedules', icon: 'fa-calendar-alt', label: 'Schedules' },
        { to: '/schedule', icon: 'fa-cog', label: 'Settings' }
      ]
    : [
        { to: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
        { to: '/materials', icon: 'fa-book-open', label: 'Learn' },
        { to: '/quiz', icon: 'fa-brain', label: 'Daily Quiz' },
        { to: '/progress', icon: 'fa-chart-line', label: 'My Progress' },
        { to: '/schedule', icon: 'fa-cog', label: 'Settings' }
      ];
  
  const isActive = (path) => {
    if (path === '/dashboard') {
      return loc.pathname === '/' || loc.pathname === '/dashboard';
    }

    // Handle admin routes with query parameters
    if (path.startsWith('/admin')) {
      if (loc.pathname !== '/admin') return false;

      // Extract tab from path (e.g., '/admin?tab=questions' -> 'questions')
      const pathTab = path.split('?tab=')[1];
      const currentTab = new URLSearchParams(loc.search).get('tab') || 'dashboard';

      return pathTab === currentTab;
    }

    return loc.pathname.startsWith(path);
  };
  
  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'transparent' }}>
      {/* Modern Top Navigation Bar */}
      <header style={{ 
        background:'rgba(255,255,255,0.85)', 
        backdropFilter:'blur(30px) saturate(180%)', 
        padding:'1rem 2rem',
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        boxShadow:'0 4px 20px rgba(0,0,0,0.1), 0 0 40px rgba(102,126,234,0.05)',
        zIndex:100,
        borderBottom:'1px solid rgba(255,255,255,0.3)',
        position:'sticky',
        top:0
      }}>
        <div style={{ 
          fontWeight:800, 
          fontSize:'1.75rem', 
          background:'linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%)', 
          WebkitBackgroundClip:'text', 
          WebkitTextFillColor:'transparent', 
          backgroundClip:'text',
          display:'flex',
          alignItems:'center',
          gap:'0.75rem',
          letterSpacing:'-0.02em',
          filter:'drop-shadow(0 2px 8px rgba(102,126,234,0.3))',
          transition:'all 0.3s ease',
          cursor:'pointer'
        }}>
          <span style={{ fontSize:'2rem', animation:'float 3s ease-in-out infinite' }}>🧠</span>
          LMS Pro
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
            placeholder="Search courses, materials..." 
            style={{
              width: '100%',
              padding: '0.75rem 1.25rem 0.75rem 3rem',
              border: '2px solid rgba(226, 232, 240, 0.6)',
              borderRadius: '14px',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: 'inherit',
              background: 'rgba(247,250,252,0.7)',
              backdropFilter: 'blur(10px)',
              color: '#2d3748',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          />
        </div>
        
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{ 
            fontSize:'0.95rem', 
            color:'#4a5568', 
            fontWeight:600,
            display:'flex',
            alignItems:'center',
            gap:'0.75rem',
            padding:'0.625rem 1.25rem',
            background:'rgba(247,250,252,0.8)',
            backdropFilter:'blur(10px)',
            borderRadius:'14px',
            border:'1px solid rgba(226, 232, 240, 0.6)',
            boxShadow:'0 2px 8px rgba(0,0,0,0.05)',
            transition:'all 0.3s ease'
          }}>
            <div style={{
              width:'32px',
              height:'32px',
              borderRadius:'50%',
              background:'linear-gradient(135deg,#667eea,#764ba2)',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              color:'#fff',
              fontSize:'0.9rem',
              fontWeight:700,
              boxShadow:'0 2px 8px rgba(102,126,234,0.3)'
            }}>
              {(user?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
            {user?.full_name || 'User'}
          </div>
          
          <Link to="/schedule" style={{
            background: isActive('/schedule') ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'rgba(247,250,252,0.8)',
            color: isActive('/schedule') ? '#fff' : '#4a5568',
            border: isActive('/schedule') ? 'none' : '1px solid rgba(226, 232, 240, 0.6)',
            padding:'0.75rem 1.5rem',
            borderRadius:'14px',
            cursor:'pointer',
            fontWeight:600,
            fontSize:'0.95rem',
            transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            textDecoration:'none',
            display:'flex',
            alignItems:'center',
            gap:'0.5rem',
            boxShadow: isActive('/schedule') ? '0 4px 12px rgba(102,126,234,0.4)' : '0 2px 8px rgba(0,0,0,0.05)',
            backdropFilter:'blur(10px)'
          }}>
            <i className="fas fa-cog"/>
            Settings
          </Link>
          
          <button onClick={logout} style={{ 
            background:'linear-gradient(135deg,#fc8181 0%,#e53e3e 100%)', 
            color:'#fff', 
            border:'none', 
            padding:'0.75rem 1.5rem', 
            borderRadius:'14px', 
            cursor:'pointer', 
            fontWeight:700, 
            fontSize:'0.95rem', 
            boxShadow:'0 4px 12px rgba(229,62,62,0.4), 0 0 20px rgba(252,129,129,0.2)', 
            transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display:'flex',
            alignItems:'center',
            gap:'0.5rem',
            position:'relative',
            overflow:'hidden'
          }}>
            <i className="fas fa-sign-out-alt"/>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', flex:1, overflow:'hidden', gap:'0' }}>
        <aside style={{ 
          background:'rgba(255,255,255,0.85)', 
          backdropFilter:'blur(30px) saturate(180%)', 
          padding:'2rem 1.5rem', 
          display:'flex', 
          flexDirection:'column', 
          boxShadow:'4px 0 20px rgba(0,0,0,0.08), 0 0 40px rgba(102,126,234,0.05)',
          overflowY:'auto',
          borderRight:'1px solid rgba(255,255,255,0.3)'
        }}>
          <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {navItems.filter(item => item.to !== '/schedule').map(item => (
              <Link key={item.to} to={item.to} style={{
                display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 1.25rem',
                borderRadius:'16px', textDecoration:'none', transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: isActive(item.to) ? 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' : 'transparent',
                color: isActive(item.to) ? '#fff' : '#4a5568',
                fontWeight: isActive(item.to) ? 700 : 500,
                fontSize:'1rem',
                boxShadow: isActive(item.to) ? '0 6px 16px rgba(102,126,234,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
                border: isActive(item.to) ? 'none' : '1px solid transparent',
                position:'relative',
                overflow:'hidden'
              }}>
                <div style={{
                  width:'40px',
                  height:'40px',
                  borderRadius:'12px',
                  background: isActive(item.to) ? 'rgba(255,255,255,0.2)' : 'rgba(102,126,234,0.08)',
                  backdropFilter:'blur(10px)',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  transition:'all 0.3s ease',
                  boxShadow: isActive(item.to) ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                }}>
                  <i className={`fas ${item.icon}`} style={{ fontSize:'1.1rem' }}></i>
                </div>
                <span>{item.label}</span>
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
