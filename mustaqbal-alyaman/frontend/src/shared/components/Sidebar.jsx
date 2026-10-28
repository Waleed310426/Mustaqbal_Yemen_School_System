import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, GraduationCap, Calendar, CheckSquare,
  FileBarChart, Activity, UserCog, BookOpen, Clock, Banknote,
  Bus, Package, LogOut, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, School
} from 'lucide-react';

const roleLabels = {
  admin: 'المدير العام',
  teacher: 'مدرس',
  student: 'طالب',
  parent: 'ولي أمر',
};

// ========== قوائم الروابط مُجمَّعة ===========
const adminGroups = [
  {
    label: 'الرئيسية',
    links: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
    ],
  },
  {
    label: 'شؤون الطلاب',
    links: [
      { to: '/students', icon: GraduationCap, label: 'الطلاب' },
      { to: '/classes', icon: Users, label: 'الفصول والشعب' },
      { to: '/attendance', icon: CheckSquare, label: 'الحضور والغياب' },
      { to: '/grades', icon: FileBarChart, label: 'الدرجات والنتائج' },
      { to: '/activities', icon: Activity, label: 'الأنشطة الطلابية' },
    ],
  },
  {
    label: 'شؤون التدريس',
    links: [
      { to: '/teachers', icon: UserCog, label: 'المدرسون' },
      { to: '/subjects', icon: BookOpen, label: 'المواد الدراسية' },
      { to: '/schedule', icon: Calendar, label: 'الجداول الدراسية' },
      { to: '/exams', icon: Clock, label: 'الكنترول والامتحانات' },
    ],
  },
  {
    label: 'الشؤون المالية',
    links: [
      { to: '/payments', icon: Banknote, label: 'المصروفات الدراسية' },
    ],
  },
  {
    label: 'إدارة المدرسة',
    links: [
      { to: '/transportation', icon: Bus, label: 'إدارة المواصلات' },
      { to: '/inventory', icon: Package, label: 'مخازن المدرسة' },
    ],
  },
  {
    label: 'إعدادات النظام',
    links: [
      { to: '/users', icon: Users, label: 'المستخدمون' },
      { to: '/settings', icon: School, label: 'إعدادات المدرسة' },
    ],
  },
];

const teacherGroups = [
  {
    label: 'الرئيسية',
    links: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
      { to: '/students', icon: GraduationCap, label: 'قائمة الطلاب' },
      { to: '/schedule', icon: Calendar, label: 'جدولي الدراسي' },
      { to: '/attendance', icon: CheckSquare, label: 'تسجيل الحضور' },
      { to: '/grades', icon: FileBarChart, label: 'الدرجات والتقييم' },
      { to: '/exams', icon: Clock, label: 'الكنترول والامتحانات' },
      { to: '/activities', icon: Activity, label: 'الأنشطة المدرسية' },
    ],
  },
];

const studentGroups = [
  {
    label: 'حسابي',
    links: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
      { to: '/schedule', icon: Calendar, label: 'جدولي الدراسي' },
      { to: '/exams', icon: Clock, label: 'جدول الاختبارات' },
      { to: '/attendance', icon: CheckSquare, label: 'حضوري وغيابي' },
      { to: '/grades', icon: FileBarChart, label: 'درجاتي وشهاداتي' },
      { to: '/payments', icon: Banknote, label: 'رسومي الدراسية' },
      { to: '/activities', icon: Activity, label: 'الأنشطة الطلابية' },
    ],
  },
];

const parentGroups = [
  {
    label: 'متابعة الأبناء',
    links: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
      { to: '/schedule', icon: Calendar, label: 'جدول الأبناء' },
      { to: '/exams', icon: Clock, label: 'جدول الامتحانات' },
      { to: '/attendance', icon: CheckSquare, label: 'حضور الأبناء' },
      { to: '/grades', icon: FileBarChart, label: 'درجات الأبناء' },
      { to: '/payments', icon: Banknote, label: 'المصروفات والرسوم' },
      { to: '/activities', icon: Activity, label: 'الأنشطة المدرسية' },
    ],
  },
];

const groupsByRole = {
  admin: adminGroups,
  teacher: teacherGroups,
  student: studentGroups,
  parent: parentGroups,
};

const Sidebar = ({ isCollapsed = false, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const groups = groupsByRole[user?.role] || adminGroups;
  const initials = user?.name?.split(' ').slice(0, 2).map(w => w[0]).join('') || 'م';

  const handleNav = (to) => navigate(to);
  const handleLogout = () => { logout(); navigate('/login'); };
  const toggleGroup = (label) => setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* زر طي وتوسيع القائمة الجانبية الدائري الأنيق على حافة القائمة */}
      <button
        id="sidebar-toggle-btn"
        className="sidebar-toggle-btn"
        onClick={onToggle}
        aria-label={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
        title={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-box">
          <img src="/logo.png" alt="شعار المدرسة" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        {!isCollapsed && (
          <div className="sidebar-logo-text">
            <h2>مستقبل اليمن</h2>
            <span>نظام الإدارة المدرسية</span>
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="sidebar-user" title={isCollapsed ? `${user?.name || 'مستخدم'} (${roleLabels[user?.role] || ''})` : undefined}>
        <div className="sidebar-avatar">{initials}</div>
        {!isCollapsed && (
          <div className="sidebar-user-info">
            <h4>{user?.name}</h4>
            <span>{roleLabels[user?.role]}</span>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        {groups.map((group) => (
          <div key={group.label} className="sidebar-group-block">
            {group.label !== 'الرئيسية' && groups.length > 1 && !isCollapsed && (
              <button
                className="sidebar-section-label"
                onClick={() => toggleGroup(group.label)}
              >
                <span>{group.label}</span>
                {collapsedGroups[group.label] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            )}

            {isCollapsed && group.label !== 'الرئيسية' && (
              <div className="sidebar-collapsed-divider" />
            )}

            {(!collapsedGroups[group.label] || isCollapsed) && group.links.map(link => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <button
                  key={link.to}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleNav(link.to)}
                  title={isCollapsed ? link.label : undefined}
                >
                  <span className="nav-icon"><Icon size={18} /></span>
                  {!isCollapsed && <span className="sidebar-link-text">{link.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="sidebar-version-text">
            نظام مستقبل اليمن v2.0
          </div>
        )}
        <button 
          className="logout-btn" 
          onClick={handleLogout}
          title={isCollapsed ? 'تسجيل الخروج' : undefined}
        >
          <span className="nav-icon"><LogOut size={18} /></span>
          {!isCollapsed && <span className="sidebar-link-text">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
