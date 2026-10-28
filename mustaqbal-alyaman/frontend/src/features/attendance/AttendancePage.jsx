import { useEffect, useState } from 'react';
import Layout from '../../shared/components/Layout';
import apiClient from '../../shared/apiClient';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, XCircle, Clock, Calendar, CheckSquare } from 'lucide-react';

const StudentAttendance = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/attendance/report')
      .then(res => setReport(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  const summary = report?.summary || {};
  const records = report?.records || [];

  const getStatusBadge = (st) => {
    switch (st) {
      case 'present': return <span className="badge badge-green">حاضر ✓</span>;
      case 'absent': return <span className="badge badge-red">غائب ✕</span>;
      case 'late': return <span className="badge badge-orange">متأخر ⏳</span>;
      case 'excused': return <span className="badge badge-blue">بعذر</span>;
      default: return <span className="badge badge-gray">{st}</span>;
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1>سجل حضوري وغيابي</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>تقرير الحضور والغياب الأكاديمي خلال العام الدراسي</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="stat-card green">
          <div className="stat-icon"><CheckCircle2 size={24} color="#10b981" /></div>
          <div className="stat-value">{summary.attendanceRate || 0}%</div>
          <div className="stat-label">نسبة الحضور الإجمالية</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon"><CheckSquare size={24} color="#3b82f6" /></div>
          <div className="stat-value">{summary.present || 0}</div>
          <div className="stat-label">أيام الحضور</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><XCircle size={24} color="#ef4444" /></div>
          <div className="stat-value">{summary.absent || 0}</div>
          <div className="stat-label">أيام الغياب</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><Clock size={24} color="#f59e0b" /></div>
          <div className="stat-value">{summary.late || 0}</div>
          <div className="stat-label">أيام التأخر</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>تفاصيل سجلات الحضور ({records.length})</h2>
        </div>
        {records.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <Calendar size={48} style={{ opacity: 0.3 }} />
            <p style={{ marginTop: 12 }}>لا توجد سجلات حضور مسجلة بعد</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>التاريخ</th>
                  <th>اليوم</th>
                  <th>الحالة</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.id || idx}>
                    <td className="text-muted">{idx + 1}</td>
                    <td><strong>{r.date}</strong></td>
                    <td className="text-muted">{new Date(r.date).toLocaleDateString('ar-YE', { weekday: 'long' })}</td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td className="text-muted">{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const AttendancePage = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const [classes, setClasses] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState({});
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (isStudent) return;
    const load = async () => {
      const [cRes, pRes] = await Promise.all([
        apiClient.get('/classes'),
        apiClient.get('/periods'),
      ]);
      setClasses(cRes.data.data);
      setPeriods(pRes.data.data);
    };
    load();
  }, [isStudent]);

  useEffect(() => {
    if (isStudent || !selectedClass) { setStudents([]); return; }
    const load = async () => {
      const res = await apiClient.get('/students', { params: { class_id: selectedClass } });
      const studentList = res.data.data;
      setStudents(studentList);
      // تهيئة كل الطلاب كـ "حاضر"
      const init = {};
      studentList.forEach(s => { init[s.id] = 'present'; });
      setRecords(init);
    };
    load();
  }, [selectedClass, isStudent]);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const setStatus = (studentId, status) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedPeriod || !date) {
      return showAlert('danger', 'يرجى اختيار الفصل والحصة والتاريخ');
    }
    setSaving(true);
    try {
      const recordsList = students.map(s => ({ student_id: s.id, status: records[s.id] || 'present' }));
      await apiClient.post('/attendance', { period_id: selectedPeriod, date, records: recordsList });
      showAlert('success', `تم تسجيل حضور ${students.length} طالب بنجاح`);
    } catch (err) {
      showAlert('danger', err.response?.data?.error || 'حدث خطأ في التسجيل');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: 'present', label: 'حاضر', cls: 'badge-green' },
    { value: 'absent', label: 'غائب', cls: 'badge-red' },
    { value: 'late', label: 'متأخر', cls: 'badge-orange' },
    { value: 'excused', label: 'بعذر', cls: 'badge-gray' },
  ];

  const counts = {
    present: Object.values(records).filter(v => v === 'present').length,
    absent: Object.values(records).filter(v => v === 'absent').length,
    late: Object.values(records).filter(v => v === 'late').length,
    excused: Object.values(records).filter(v => v === 'excused').length,
  };

  if (isStudent) {
    return (
      <Layout title="حضوري وغيابي">
        <StudentAttendance />
      </Layout>
    );
  }

  return (
    <Layout title="الحضور والغياب">
      {alert && <div className={`alert alert-${alert.type}`}>{alert.type === 'success' ? '✅' : '❌'} {alert.msg}</div>}

      <div className="page-header">
        <div>
          <h1>تسجيل الحضور والغياب</h1>
          <p>تسجيل حضور الحصة الدراسية</p>
        </div>
      </div>

      {/* أدوات الاختيار */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">الفصل الدراسي</label>
              <select id="attendance-class-select" className="form-control" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                <option value="">اختر الفصل</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.grade_level} - {c.section}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">الحصة</label>
              <select id="attendance-period-select" className="form-control" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
                <option value="">اختر الحصة</option>
                {periods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.start_time} - {p.end_time})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">التاريخ</label>
              <input id="attendance-date-input" type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {students.length > 0 && (
        <>
          {/* ملخص سريع */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="stat-card green" style={{ flex: 1, minWidth: 120, padding: '14px 16px' }}>
              <div className="stat-value" style={{ fontSize: 22 }}>{counts.present}</div>
              <div className="stat-label">حاضر</div>
            </div>
            <div className="stat-card red" style={{ flex: 1, minWidth: 120, padding: '14px 16px' }}>
              <div className="stat-value" style={{ fontSize: 22 }}>{counts.absent}</div>
              <div className="stat-label">غائب</div>
            </div>
            <div className="stat-card orange" style={{ flex: 1, minWidth: 120, padding: '14px 16px' }}>
              <div className="stat-value" style={{ fontSize: 22 }}>{counts.late}</div>
              <div className="stat-label">متأخر</div>
            </div>
          </div>

          {/* جدول الحضور */}
          <div className="card">
            <div className="card-header">
              <h2>قائمة الطلاب ({students.length})</h2>
              <button id="set-all-present-btn" className="btn btn-ghost btn-sm" onClick={() => {
                const all = {};
                students.forEach(s => { all[s.id] = 'present'; });
                setRecords(all);
              }}>✅ تحديد الجميع حاضر</button>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>اسم الطالب</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => (
                    <tr key={s.id}>
                      <td className="text-muted">{idx + 1}</td>
                      <td><strong>{s.user?.name}</strong></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {statusOptions.map(opt => (
                            <button
                              key={opt.value}
                              id={`attendance-${s.id}-${opt.value}`}
                              className={`btn btn-sm ${records[s.id] === opt.value ? 'btn-primary' : 'btn-ghost'}`}
                              style={records[s.id] === opt.value && opt.value === 'absent' ? { background: 'var(--danger)', color: '#fff' } : {}}
                              onClick={() => setStatus(s.id, opt.value)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'flex-end' }}>
              <button id="save-attendance-btn" className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={saving}>
                {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ الحضور'}
              </button>
            </div>
          </div>
        </>
      )}

      {selectedClass && students.length === 0 && (
        <div className="empty-state">
          <div className="icon">📋</div>
          <h3>لا يوجد طلاب في هذا الفصل</h3>
        </div>
      )}
    </Layout>
  );
};

export default AttendancePage;
