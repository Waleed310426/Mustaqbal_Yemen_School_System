import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = ({ children, title }) => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar isCollapsed={collapsed} onToggle={toggleSidebar} />
      <div className="main-content">
        <Topbar title={title} />
        <div className="page-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
