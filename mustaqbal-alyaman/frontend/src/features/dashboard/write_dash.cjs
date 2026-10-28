const fs = require('fs');
const path = require('path');

const content = `import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import Layout from '../../shared/components/Layout';
import apiClient from '../../shared/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  Users, GraduationCap, Calendar, CheckSquare,
  FileBarChart, Activity, Wallet, TrendingUp, UserCog,
  School, Banknote, BookOpen, AlertTriangle,
  ChevronRight, Award, CalendarDays, CheckCircle2, XCircle
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const examTypeLabel = {
  monthly: 'شهري', midterm: 'نصف فصلي', final: 'نهائي',
  homework: 'واجبات', participation: 'مشاركة',
};

const StatCard = ({ icon: Icon, value, label, color, bg }) => (
  <div style={{
    background: 'white', borderRadius: 16, padding: 24,
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    display: 'flex', alignItems: 'center', gap: 16,
  }}>
    <div style={{ background: bg, padding: 16, borderRadius: 12 }}>
      <Icon size={32} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-800)' }}>{value}</div>
    </div>
  </div>
);

const QuickBtn = ({ icon: Icon, label, color, onClick }) => (
  <button onClick={onClick} style={{
    border: 'none', cursor: 'pointer', background: 'white',
    borderRadius: 14, padding: '18px 14px', textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.2s',
    width: '100%',
  }}>
    <div style={{ background: color + '22', borderRadius: '50%', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
      <Icon size={26} color={color} />
    </div>
    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-700)' }}>{label}</div>
  </button>
);

// ===== Admin =====
const AdminDashboard = ({ stats }) => {
  const fmt = (n) => new Intl.NumberFormat('ar-YE').format(n || 0);
  const chartData = stats?.attendanceChart ? {
    labels: stats.attendanceChart.map(d => new Date(d.date).toLocaleDateString('ar-YE', { weekday: 'short', day: 'numeric' })),
    datasets: [{ label: 'الحضور %', data: stats.attendanceChart.map(d => d.rate), fill: true, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.4 }],
  } : null;
  const pieData = { labels: ['مدفوع', 'معلق'], datasets: [{ data: [stats?.totalRevenue || 0, (stats?.totalPending || 0)], backgroundColor: ['#16a34a', '#ef4444'], borderWidth: 0 }] };
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
        <StatCard icon={GraduationCap} value={stats.studentsCount || 0} label="إجمالي الطلاب" color="#3b82f6" bg="rgba(59,130,246,0.1)" />
        <StatCard icon={UserCog} value={stats.teachersCount || 0} label="إجمالي المعلمين" color="#10b981" bg="rgba(16,185,129,0.1)" />
        <StatCard icon={TrendingUp} value={(stats.attendanceRate || 0) + '%'} label="نسبة الحضور اليوم" color="#f59e0b" bg="rgba(245,158,11,0.1)" />
        <StatCard icon={Wallet} value={fmt(stats.totalRevenue) + ' ر.ي'} label="الإيرادات المحصلة" color="#6366f1" bg="rgba(99,102,241,0.1)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} color="var(--primary)" />
            معدل الحضور - آخر 7 أيام
          </h3>
          <div style={{ height: 280 }}>
            {chartData ? (
              <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { max: 100, ticks: { callback: v => v + '%', font: { family: 'Cairo' } } }, x: { ticks: { font: { family: 'Cairo' } } } } }} />
            ) : (
              <div className="empty-state"><p>لا بيانات كافية</p></div>
            )}
          </div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Banknote size={18} color="#10b981" />
            حالة الرسوم
          </h3>
          <div style={{ height: 220, display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Cairo' } } } }, cutout: '65%' }} />
          </div>
          {stats.pendingPayments > 0 && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef3c7', borderRadius: 8, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} color="#d97706" />
              {stats.pendingPayments} طالب لديه رسوم معلقة
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ===== Teacher =====
const TeacherDashboard = ({ stats, navigate }) => {
  const sch = stats?.todaySchedule || [];
  const cls = stats?.assignedClasses || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16 }}>
        <StatCard icon={School} value={stats?.classesCount || 0} label="فصولي الدراسية" color="#3b82f6" bg="rgba(59,130,246,0.1)" />
        <StatCard icon={BookOpen} value={stats?.subjectsCount || 0} label="موادي" color="#8b5cf6" bg="rgba(139,92,246,0.1)" />
        <StatCard icon={GraduationCap} value={stats?.studentsCount || 0} label="طلابي الكلي" color="#10b981" bg="rgba(16,185,129,0.1)" />
        <StatCard icon={CheckSquare} value={stats?.todayAttendanceCount || 0} label="تحضير اليوم" color="#f59e0b" bg="rgba(245,158,11,0.1)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={18} color="var(--primary)" />
            حصصي اليوم
            <span style={{ marginRight: 'auto', background: 'var(--primary)', color: 'white', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>{sch.length}</span>
          </h3>
          {sch.length === 0 ? (
            <div className="empty-state"><CalendarDays size={36} style={{ opacity: 0.3 }} /><p>لا حصص اليوم</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sch.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)' }}>
                  <div style={{ background: 'var(--primary)', color: 'white', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700 }}>
                    {item.period?.start_time?.slice(0, 5) || (i + 1)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{item.subject?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                      {item.class ? item.class.grade_level + ' - ' + item.class.section : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <School size={18} color="#8b5cf6" />
            فصولي وموادي
          </h3>
          {cls.length === 0 ? (
            <div className="empty-state"><School size={36} style={{ opacity: 0.3 }} /><p>لم يتم تعيين فصول</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cls.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.className}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{c.subjectName}</div>
                  </div>
                  <ChevronRight size={16} color="var(--gray-400)" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        <QuickBtn icon={CheckSquare} label="تسجيل الحضور" color="#10b981" onClick={() => navigate('/attendance')} />
        <QuickBtn icon={FileBarChart} label="رصد الدرجات" color="#f59e0b" onClick={() => navigate('/grades')} />
        <QuickBtn icon={Calendar} label="الجدول الدراسي" color="#3b82f6" onClick={() => navigate('/schedule')} />
      </div>
    </div>
  );
};

// ===== Student =====
const StudentDashboard = ({ stats, navigate }) => {
  const s = stats?.student;
  const att = stats?.attendance || {};
  const pay = stats?.payments || {};
  const grades = stats?.recentGrades || [];
  const sch = stats?.todaySchedule || [];
  const gpaColor = (g) => g >= 85 ? '#16a34a' : g >= 70 ? '#2563eb' : g >= 50 ? '#d97706' : '#ef4444';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {s && (
        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontSize: 26, fontWeight: 800 }}>{s.name?.[0]}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{s.name}</div>
            <div style={{ color: 'var(--gray-500)', fontSize: 14 }}>الفصل: <strong style={{ color: 'var(--gray-700)' }}>{s.class}</strong></div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: gpaColor(parseFloat(stats?.gpa || 0)) }}>{stats?.gpa}%</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>المعدل العام</div>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
        <StatCard icon={CheckCircle2} value={(att.rate || 100) + '%'} label="نسبة حضوري" color="#10b981" bg="rgba(16,185,129,0.1)" />
        <StatCard icon={XCircle} value={att.absent || 0} label="أيام الغياب" color="#ef4444" bg="rgba(239,68,68,0.1)" />
        <StatCard icon={Award} value={stats?.gradesCount || 0} label="درجاتي المسجلة" color="#8b5cf6" bg="rgba(139,92,246,0.1)" />
        <StatCard
          icon={Wallet}
          value={pay.pendingAmount > 0 ? new Intl.NumberFormat('ar-YE').format(pay.pendingAmount) + ' ر.ي' : '✓ لا رسوم'}
          label={pay.pendingAmount > 0 ? 'رسوم متبقية' : 'لا رسوم معلقة'}
          color={pay.pendingAmount > 0 ? '#ef4444' : '#10b981'}
          bg={pay.pendingAmount > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={18} color="var(--primary)" />
            حصصي اليوم
            <span style={{ marginRight: 'auto', background: 'var(--primary)', color: 'white', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>{sch.length}</span>
          </h3>
          {sch.length === 0 ? (
            <div className="empty-state"><CalendarDays size={36} style={{ opacity: 0.3 }} /><p>لا حصص اليوم</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sch.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)' }}>
                  <div style={{ background: 'var(--primary)', color: 'white', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700 }}>
                    {item.period?.start_time?.slice(0, 5) || (i + 1)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{item.subject?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                      {item.teacher?.user?.name ? 'أ. ' + item.teacher.user.name : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileBarChart size={18} color="#8b5cf6" />
            آخر درجاتي
          </h3>
          {grades.length === 0 ? (
            <div className="empty-state"><FileBarChart size={36} style={{ opacity: 0.3 }} /><p>لا درجات بعد</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {grades.map((g, i) => {
                const pct = g.max_score > 0 ? ((g.score / g.max_score) * 100).toFixed(0) : 0;
                const c = pct >= 85 ? '#16a34a' : pct >= 60 ? '#2563eb' : '#ef4444';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{g.subject}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{examTypeLabel[g.exam_type] || g.exam_type}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: c }}>
                      {g.score}<span style={{ fontSize: 12, color: 'var(--gray-400)' }}>/{g.max_score}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={() => navigate('/grades')} style={{ marginTop: 12, width: '100%', background: 'none', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6', borderRadius: 8, padding: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            عرض كل الدرجات ←
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        <QuickBtn icon={Calendar} label="جدول دراستي" color="#3b82f6" onClick={() => navigate('/schedule')} />
        <QuickBtn icon={Award} label="درجاتي وشهاداتي" color="#8b5cf6" onClick={() => navigate('/grades')} />
        <QuickBtn icon={Activity} label="سجل حضوري" color="#10b981" onClick={() => navigate('/attendance')} />
      </div>
    </div>
  );
};

// ===== Parent =====
const ParentDashboard = ({ stats }) => {
  const children = stats?.children || [];
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Users size={20} color="var(--primary)" />متابعة أبنائي
      </h2>
      {children.length === 0 ? (
        <div className="empty-state card" style={{ padding: 40 }}>
          <Users size={48} style={{ opacity: 0.3 }} /><p>لا يوجد أبناء مرتبطون بحسابك</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
          {children.map((child) => {
            const gc = child.gpa >= 85 ? '#16a34a' : child.gpa >= 70 ? '#2563eb' : child.gpa >= 50 ? '#d97706' : '#ef4444';
            return (
              <div key={child.id} className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>{child.name?.[0]}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{child.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{child.class}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: 'rgba(59,130,246,0.07)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: gc }}>{child.gpa}%</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>المعدل</div>
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.07)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>{child.attendanceRate}%</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>الحضور</div>
                  </div>
                </div>
                {child.pendingAmount > 0 && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: '#fef3c7', borderRadius: 8, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} color="#d97706" />
                    رسوم معلقة: {new Intl.NumberFormat('ar-YE').format(child.pendingAmount)} ر.ي
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ===== Main Dashboard =====
const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/dashboard/stats')
      .then(r => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout title="لوحة التحكم">
      <div className="loading-screen"><div className="spinner" /></div>
    </Layout>
  );

  return (
    <Layout title="لوحة التحكم">
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
        borderRadius: 16, padding: '28px 36px', color: 'white', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 10px 25px -5px rgba(59,130,246,0.4)',
      }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, color: 'white' }}>
            مرحباً بك، {user?.name} 👋
          </h1>
          <p style={{ opacity: 0.9, fontSize: 14 }}>
            {user?.role === 'admin' && 'لوحة إدارة النظام'}
            {user?.role === 'teacher' && 'لوحة المعلم'}
            {user?.role === 'student' && 'بوابة الطالب'}
            {user?.role === 'parent' && 'بوابة ولي الأمر'}
            {' — '}{new Date().toLocaleDateString('ar-YE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 14 }}>
          <School size={44} color="white" />
        </div>
      </div>

      {user?.role === 'admin' && stats && <AdminDashboard stats={stats} />}
      {user?.role === 'teacher' && <TeacherDashboard stats={stats} navigate={navigate} />}
      {user?.role === 'student' && <StudentDashboard stats={stats} navigate={navigate} />}
      {user?.role === 'parent' && <ParentDashboard stats={stats} />}
    </Layout>
  );
};

export default DashboardPage;
`;

fs.writeFileSync(path.join(__dirname, 'DashboardPage.jsx'), content, 'utf8');
console.log('Written! Lines: ' + content.split('\n').length);