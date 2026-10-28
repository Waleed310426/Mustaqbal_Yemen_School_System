import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Cpu, User, LogOut, Settings, Sparkles, X, CheckCircle2, TrendingUp, AlertTriangle, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SYSTEM_ROUTES = [
  { title: 'لوحة التحكم الرئيسية', path: '/dashboard', category: 'عام' },
  { title: 'شؤون الطلاب وسجل القيد', path: '/students', category: 'الطلاب' },
  { title: 'الفصول والشعب الدراسية', path: '/classes', category: 'الطلاب' },
  { title: 'سجل الحضور والغياب اليومي', path: '/attendance', category: 'الطلاب' },
  { title: 'كنترول الدرجات والشهادات', path: '/grades', category: 'الكنترول' },
  { title: 'جدول الحصص الأسبوعي', path: '/schedule', category: 'التعليم' },
  { title: 'هيئة التدريس والمعلمون', path: '/teachers', category: 'الكادر' },
  { title: 'المواد والخطة الدراسية', path: '/subjects', category: 'المناهج' },
  { title: 'الرسوم والحسابات المدرسية', path: '/payments', category: 'المالية' },
  { title: 'الاختبارات وبنوك الأسئلة', path: '/exams', category: 'الامتحانات' },
  { title: 'الأنشطة والمسابقات المدرسية', path: '/activities', category: 'الأنشطة' },
  { title: 'حركة النقل المدرسي والباصات', path: '/transportation', category: 'الخدمات' },
  { title: 'المستودع والكتب المدرسية', path: '/inventory', category: 'المستودع' },
  { title: 'إدارة المستخدمين والصلاحيات', path: '/users', category: 'الأمان' },
  { title: 'إعدادات المدرسة والعام الدراسي', path: '/settings', category: 'الإعدادات' },
];

const Topbar = ({ title }) => {
  const { user, logout, unreadCount, notifications, markNotifRead } = useAuth();
  const navigate = useNavigate();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const panelRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowNotifs(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const filtered = SYSTEM_ROUTES.filter(r => 
      r.title.toLowerCase().includes(q.toLowerCase()) || 
      r.category.toLowerCase().includes(q.toLowerCase())
    );
    setSearchResults(filtered);
    setShowSearchDropdown(true);
  };

  const handleSelectRoute = (path) => {
    navigate(path);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  const getUserInitial = () => {
    if (!user) return 'م';
    if (user.role === 'admin') return 'م';
    if (user.role === 'teacher') return 'أ';
    if (user.role === 'student') return 'ط';
    if (user.role === 'parent') return 'و';
    return user.name ? user.name.trim()[0] : 'م';
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return { label: 'المدير العام', color: '#2563eb' };
      case 'teacher': return { label: 'معلم', color: '#0d9488' };
      case 'student': return { label: 'طالب', color: '#8b5cf6' };
      case 'parent': return { label: 'ولي أمر', color: '#ea580c' };
      default: return { label: 'مستخدم', color: '#64748b' };
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <>
      <header className="topbar">
        {/* Right Section: Page Title & Search Bar */}
        <div className="topbar-right-group">
          {title && (
            <div className="topbar-title">
              <h1>{title}</h1>
            </div>
          )}

          <div className="topbar-search-box" ref={searchRef}>
            <Search className="topbar-search-icon" size={17} />
            <input
              type="text"
              id="global-system-search"
              className="topbar-search-input"
              placeholder="بحث احترافي في النظام..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery && setShowSearchDropdown(true)}
            />

            {showSearchDropdown && (
              <div className="topbar-search-results">
                {searchResults.length > 0 ? (
                  searchResults.map((item, index) => (
                    <div
                      key={index}
                      className="topbar-search-item"
                      onClick={() => handleSelectRoute(item.path)}
                    >
                      <div className="search-item-info">
                        <span className="search-item-title">{item.title}</span>
                        <span className="search-item-category">{item.category}</span>
                      </div>
                      <span className="search-item-arrow">←</span>
                    </div>
                  ))
                ) : (
                  <div className="topbar-search-empty">
                    <p>لا توجد نتائج مطابقة لـ "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Left Section: AI Analysis Button, Divider, Notifications, User Avatar */}
        <div className="topbar-left-group">
          {/* زر تحليل الذكاء الاصطناعي */}
          <button
            id="ai-analysis-btn"
            className="topbar-ai-btn"
            onClick={() => setShowAiModal(true)}
            title="تحليل الذكاء الاصطناعي لمدرسة مستقبل اليمن"
          >
            <Cpu size={16} className="ai-icon" />
            <span>تحليل الذكاء الاصطناعي</span>
          </button>

          {/* الفاصل العمودي */}
          <div className="topbar-divider" />

          {/* أيقونة الإشعارات مع النقطة الحمراء */}
          <div ref={panelRef} style={{ position: 'relative' }}>
            <button
              id="notification-bell-btn"
              className="topbar-icon-btn"
              onClick={() => setShowNotifs(!showNotifs)}
              aria-label="الإشعارات"
              title="الإشعارات"
            >
              <Bell size={20} className="bell-icon" />
              {unreadCount > 0 ? (
                <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              ) : (
                <span className="notif-red-dot" />
              )}
            </button>

            {showNotifs && (
              <div className="notif-panel">
                <div className="notif-panel-header">
                  <h3>الإشعارات</h3>
                  {unreadCount > 0 && (
                    <span className="badge badge-blue">{unreadCount} جديد</span>
                  )}
                </div>
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="empty-state" style={{ padding: '30px' }}>
                      <p>لا توجد إشعارات جديدة</p>
                    </div>
                  ) : (
                    notifications.slice(0, 15).map(n => (
                      <div
                        key={n.id}
                        className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                        onClick={() => markNotifRead(n.id)}
                      >
                        {!n.is_read && <div className="notif-dot" />}
                        <div style={{ flex: 1 }}>
                          <h4>{n.title}</h4>
                          <p>{n.message}</p>
                          {n.created_at && (
                            <p style={{ marginTop: 4, opacity: 0.7 }}>{formatTime(n.created_at)}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* أيقونة المستخدم الدائرية مع القائمة المنسدلة */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              id="user-profile-btn"
              className="topbar-user-avatar"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="قائمة المستخدم"
              title={user?.name || 'الملف الشخصي'}
            >
              <span>{getUserInitial()}</span>
            </button>

            {showUserMenu && (
              <div className="topbar-user-dropdown">
                <div className="user-dropdown-header">
                  <div className="user-dropdown-avatar">
                    {getUserInitial()}
                  </div>
                  <div className="user-dropdown-meta">
                    <h4>{user?.name || 'مستخدم النظام'}</h4>
                    <span className="user-dropdown-role" style={{ color: roleInfo.color }}>
                      {roleInfo.label}
                    </span>
                    <p className="user-dropdown-email">{user?.email}</p>
                  </div>
                </div>

                <div className="user-dropdown-divider" />

                <div className="user-dropdown-actions">
                  {user?.role === 'admin' && (
                    <button
                      className="user-dropdown-item"
                      onClick={() => {
                        navigate('/settings');
                        setShowUserMenu(false);
                      }}
                    >
                      <Settings size={16} />
                      <span>إعدادات المدرسة</span>
                    </button>
                  )}
                  <button
                    className="user-dropdown-item logout"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                  >
                    <LogOut size={16} />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* مودال تحليل الذكاء الاصطناعي الذكي */}
      {showAiModal && (
        <div className="ai-modal-overlay" onClick={() => setShowAiModal(false)}>
          <div className="ai-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <div className="ai-modal-title">
                <div className="ai-badge-icon">
                  <Sparkles size={20} color="#0284c7" />
                </div>
                <div>
                  <h3>تحليل الذكاء الاصطناعي للمدرسة</h3>
                  <p>رؤى فورية ذكية مدعومة بالبيانات الأكاديمية والتشغيلية</p>
                </div>
              </div>
              <button className="ai-modal-close" onClick={() => setShowAiModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="ai-modal-body">
              <div className="ai-metrics-grid">
                <div className="ai-card">
                  <div className="ai-card-top">
                    <span className="ai-card-title">مؤشر الانضباط والحضور</span>
                    <TrendingUp size={18} color="#16a34a" />
                  </div>
                  <div className="ai-card-value">94.8%</div>
                  <p className="ai-card-desc">استقرار عالي في الحضور للأسبوع الجاري مع انخفاض الغياب غير المبرر بنسبة 12%.</p>
                </div>

                <div className="ai-card">
                  <div className="ai-card-top">
                    <span className="ai-card-title">متوسط التحصيل الأكاديمي</span>
                    <CheckCircle2 size={18} color="#2563eb" />
                  </div>
                  <div className="ai-card-value">86.2%</div>
                  <p className="ai-card-desc">تفوق ملحوظ في مواد العلوم واللغة الإنجليزية في الصفوف الثانوية.</p>
                </div>

                <div className="ai-card warning">
                  <div className="ai-card-top">
                    <span className="ai-card-title">حالات تحتاج للمتابعة</span>
                    <AlertTriangle size={18} color="#d97706" />
                  </div>
                  <div className="ai-card-value">3 طلاب</div>
                  <p className="ai-card-desc">تم رصد تراجع طفيف في معدلات الحضور لشعبة (ثامن - أ) ينصح بالتواصل مع أولياء الأمور.</p>
                </div>
              </div>

              <div className="ai-recommendations">
                <h4>💡 التوصيات الذكية المقترحة:</h4>
                <ul>
                  <li>إرسال رسائل SMS توعوية تلقائية لأولياء أمور الطلاب المتغيبين أكثر من يومين.</li>
                  <li>تفعيل حصص التقوية لمادة الرياضيات للشعبة المستهدفة قبل بدء امتحانات منتصف الفصل.</li>
                  <li>إصدار كشوفات الدرجات التفصيلية المعتمدة بصيغة PDF لأولياء الأمور عبر المنصة.</li>
                </ul>
              </div>
            </div>

            <div className="ai-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAiModal(false)}>
                إغلاق النافذة
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setShowAiModal(false);
                  navigate('/attendance');
                }}
              >
                متابعة سجل الحضور الفوري
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;
