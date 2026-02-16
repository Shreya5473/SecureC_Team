import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  ScanSearch,
  Bell,
  BarChart3,
  Wrench,
  ShieldCheck,
  FilePlus,
  Brain,
  Shield,
  Users,
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const navItems = [
    { to: '/add-artifact', icon: FilePlus, label: 'Add Artifact' },
    { to: '/ai-waf', icon: Shield, label: 'AI WAF' },
    { to: '/ml-analytics', icon: Brain, label: 'ML Analytics' },
    { to: '/threat-modeling', icon: ShieldAlert, label: 'Threat Modeling' },
    { to: '/security-review', icon: ScanSearch, label: 'Security Review' },
    { to: '/soc-alerts', icon: Bell, label: 'SOC Alerts', badge: 3 },
    { to: '/risk-summary', icon: BarChart3, label: 'Risk Summary' },
    { to: '/remediation', icon: Wrench, label: 'Remediation' },
    { to: '/community', icon: Users, label: 'Community' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">
          <ShieldCheck size={20} color="white" fill="#22d3ee" />
        </div>
        <span className="logo-text">SecureC</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
            {item.badge && <span className="badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">AC</div>
          <div className="user-info">
            <span className="user-name">Alex Chen</span>
            <span className="user-role">Lead Analyst</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
