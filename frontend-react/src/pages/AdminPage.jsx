import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDashboardTab from '../components/admin/AdminDashboardTab';
import AdminQuestionsTab from '../components/admin/AdminQuestionsTab';
import AdminMaterialsTab from '../components/admin/AdminMaterialsTab';
import AdminUsersTab from '../components/admin/AdminUsersTab';
import AdminDepartmentsTab from '../components/admin/AdminDepartmentsTab';
import AdminSchedulesTab from '../components/admin/AdminSchedulesTab';

const API_BASE = `${window.location.origin}/api`;

export default function AdminPage() {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  // Always default to dashboard tab if no tab param is present
  let activeTab = searchParams.get('tab');
  if (!activeTab) {
    activeTab = 'dashboard';
    // Set the tab param in the URL so navigation stays consistent
    setSearchParams({ tab: 'dashboard' });
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
    { id: 'questions', label: 'Questions', icon: 'fa-question-circle' },
    { id: 'materials', label: 'Materials', icon: 'fa-book' },
    { id: 'users', label: 'Users', icon: 'fa-users' },
    { id: 'departments', label: 'Departments', icon: 'fa-building' },
    { id: 'schedules', label: 'Schedules', icon: 'fa-calendar-alt' }
  ];

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardTab token={token} user={user} />;
      case 'questions':
        return <AdminQuestionsTab token={token} user={user} />;
      case 'materials':
        return <AdminMaterialsTab token={token} user={user} />;
      case 'users':
        return <AdminUsersTab token={token} user={user} />;
      case 'departments':
        return <AdminDepartmentsTab token={token} user={user} />;
      case 'schedules':
        return <AdminSchedulesTab token={token} user={user} />;
      default:
        return <AdminDashboardTab token={token} user={user} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'System Overview';
      case 'questions': return 'Question Management';
      case 'materials': return 'Material Management';
      case 'users': return 'User Management';
      case 'departments': return 'Department Management';
      case 'schedules': return 'Schedule Management';
      default: return 'Admin Dashboard';
    }
  };

  const getPageDescription = () => {
    switch (activeTab) {
      case 'dashboard': return 'System overview and statistics';
      case 'questions': return 'Manage question bank and extraction';
      case 'materials': return 'Manage learning materials';
      case 'users': return 'User account management';
      case 'departments': return 'Department configuration';
      case 'schedules': return 'Quiz schedule management';
      default: return 'Manage your LMS system';
    }
  };

  return (
    <div style={{ background:'#ffffff', borderRadius:'20px', padding:'2rem', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', minHeight:'calc(100vh - 4rem)' }}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>👑 {getPageTitle()}</h2>
          <p style={styles.subtitle}>{getPageDescription()}</p>
        </div>
      </div>


      {/* Content */}
      <div style={styles.content}>
        {renderTabContent()}
      </div>
    </div>
  );
}

const styles = {
  header: {
    marginBottom: '2rem'
  },
  title: {
    fontSize: '1.9rem',
    fontWeight: 700,
    margin: 0,
    color: '#1f2937'
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#718096',
    margin: '0.5rem 0 0'
  },
  content: {
    minHeight: '500px'
  }
};
