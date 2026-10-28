import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  User, Lock, Eye, EyeOff, ChevronLeft,
  Award, Activity
} from 'lucide-react';

const demoAccounts = [
  { role: 'المدير العام', sub: 'Admin', email: 'admin@school.ye', password: 'Pass@1234' },
  { role: 'معلم', sub: 'Teacher', email: 'ahmed.teacher@school.ye', password: 'Pass@1234' },
  { role: 'طالب', sub: 'Student', email: 'student1@school.ye', password: 'Pass@1234' },
  { role: 'ولي أمر', sub: 'Parent', email: 'parent1@school.ye', password: 'Pass@1234' },
];

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('تعذر الاتصال بخادم النظام (الباك إند غير متصل). يرجى التأكد من تشغيل الباك إند أو تشغيل ملف تشغيل_النظام.');
      } else {
        setError(err.response?.data?.error || 'بيانات الدخول غير صحيحة.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-container">

        {/* الجانب الأيمن: هوية وشعار المدرسة والميزات */}
        <div className="login-branding-panel">
          <div className="school-emblem-wrapper">
            <div className="school-emblem-glow"></div>
            <div className="school-emblem">
              <img src="/logo.png" alt="شعار مدرسة مستقبل اليمن" className="school-emblem-img" />
            </div>
          </div>

          <h1 className="branding-title">مدرسة مستقبل اليمن الحديثة</h1>

          <p className="branding-subtitle">
            منصة تعليمية وإدارية ذكية متكاملة — لإدارة شؤون الطلاب، الكنترول المدرسي، الجداول الدراسية، والمتابعة الأكاديمية والمالية الشاملة
          </p>

          <div className="branding-features">
            <div className="branding-feature-card">
              <div className="feature-icon-wrapper">
                <Award size={22} className="feature-icon" />
              </div>
              <div className="feature-text">
                كنترول متقدم وإصدار فوري لكشوف الدرجات والشهادات الرسمية
              </div>
            </div>

            <div className="branding-feature-card">
              <div className="feature-icon-wrapper">
                <Activity size={22} className="feature-icon" />
              </div>
              <div className="feature-text">
                متابعة لحظية للحضور والغياب وبوابات مخصصة للمعلم والطالب وولي الأمر
              </div>
            </div>
          </div>
        </div>

        {/* الجانب الأيسر: نموذج تسجيل الدخول */}
        <div className="login-form-panel">
          <div className="login-form-header">
            <h2>تسجيل الدخول</h2>
            <p>أدخل بياناتك للوصول إلى لوحة التحكم</p>
          </div>

          {error && <div className="login-error">⚠️ {error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email-input">البريد الإلكتروني أو اسم المستخدم</label>
              <div className="input-with-icon">
                <input
                  id="email-input"
                  type="email"
                  className="form-control login-input"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <User size={18} className="input-icon-end" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password-input">كلمة المرور</label>
              <div className="input-with-icon">
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control login-input has-toggle"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <div className="input-icons-group">
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <Lock size={18} className="input-icon-lock" />
                </div>
              </div>
            </div>

            <button id="login-submit-btn" type="submit" className="login-submit-btn" disabled={loading}>
              <span>{loading ? 'جارٍ تسجيل الدخول...' : 'دخول النظام'}</span>
              {!loading && <ChevronLeft size={20} />}
            </button>
          </form>

          {/* الحسابات التجريبية */}
          <div className="login-demo-section">
            <div className="demo-header-label">حسابات تجريبية — انقر للملء التلقائي</div>
            <div className="demo-accounts-list">
              {demoAccounts.map(acc => (
                <button
                  key={acc.role}
                  id={`demo-${acc.sub.toLowerCase()}-btn`}
                  className="demo-account-row"
                  type="button"
                  onClick={() => fillDemo(acc)}
                >
                  <div className="demo-role-col">
                    <span className="demo-role-name">{acc.role}</span>
                    <span className="demo-role-sub">{acc.sub}</span>
                  </div>
                  <div className="demo-email-col">
                    <span>{acc.email}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
