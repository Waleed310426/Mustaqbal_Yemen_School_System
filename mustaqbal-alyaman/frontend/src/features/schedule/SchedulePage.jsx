import { useEffect, useState } from 'react';
import Layout from '../../shared/components/Layout';
import apiClient from '../../shared/apiClient';
import { useAuth } from '../../context/AuthContext';

const dayNames = {
  sunday: 'الأحد',
  monday: 'الاثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
};

const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

const SchedulePage = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';

  const [classes, setClasses] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subject_id: '', teacher_id: '', period_id: '', day: 'sunday' });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const loadBase = async () => {
      try {
        const [cRes, pRes, tRes, subRes] = await Promise.all([
          !isStudent ? apiClient.get('/classes') : Promise.resolve({ data: { data: [] } }),
          apiClient.get('/periods'),
          isAdmin ? apiClient.get('/teachers') : Promise.resolve({ data: { data: [] } }),
          isAdmin ? apiClient.get('/subjects') : Promise.resolve({ data: { data: [] } }),
        ]);
        setClasses(cRes.data.data);
        setPeriods(pRes.data.data);
        setTeachers(tRes.data.data);
        setSubjects(subRes.data.data);

        // إذا كان طالب، حمّل جدوله تلقائياً
        if (isStudent || isTeacher) {
          setLoading(true);
          const res = await apiClient.get('/schedule');
          setSchedule(res.data.data);
          setLoading(false);
        } else if (cRes.data.data?.length > 0) {
          setSelectedClass(cRes.data.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadBase();
  }, [user]);

  useEffect(() => {
    if (isStudent) return; // الطالب جدوله ثابت لفصله
    if (!selectedClass && !isTeacher) { setSchedule([]); return; }
    setLoading(true);
    const params = selectedClass ? { class_id: selectedClass } : {};
    apiClient.get('/schedule', { params })
      .then(res => setSchedule(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedClass]);

  const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 3000); };

  const getCell = (day, periodId) => schedule.find(s => s.day === day && s.period_id === periodId);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/schedule', { ...form, class_id: selectedClass });
      showAlert('success', 'تم إضافة الحصة للجدول');
      setShowModal(false);
      const res = await apiClient.get('/schedule', { params: { class_id: selectedClass } });
      setSchedule(res.data.data);
    } catch (err) { showAlert('danger', err.response?.data?.error || 'حدث خطأ (تعارض جدول؟)'); }
    finally { setSaving(false); }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('حذف هذه الحصة من الجدول؟')) return;
    try {
      await apiClient.delete(`/schedule/${id}`);
      setSchedule(prev => prev.filter(s => s.id !== id));
    } catch { showAlert('danger', 'حدث خطأ'); }
  };

  return (
    <Layout title="الجدول الدراسي">
      {alert && <div className={`alert alert-${alert.type}`}>{alert.type === 'success' ? '✅' : '❌'} {alert.msg}</div>}
      <div className="page-header">
        <div>
          <h1>{isStudent ? 'جدولي الدراسي الأسبوعي' : (isTeacher ? 'جدول الحصص والتدريس' : 'الجدول الدراسي الأسبوعي')}</h1>
          {isStudent && <p style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 4 }}>جدول الحصص المعتمد لفصلك الدراسي خلال أيام الأسبوع</p>}
        </div>
        {isAdmin && selectedClass && (
          <button id="add-schedule-btn" className="btn btn-primary" onClick={() => { setShowModal(true); setForm({ subject_id: '', teacher_id: '', period_id: '', day: 'sunday' }); }}>
            + إضافة حصة
          </button>
        )}
      </div>

      {!isStudent && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{isTeacher ? 'عرض جدول فصل محدد:' : 'اختر الفصل:'}</span>
            <select id="schedule-class-select" className="form-control" style={{ maxWidth: 280 }} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">{isTeacher ? 'جميع حصصي الأسبوعية' : 'اختر الفصل لعرض جدوله'}</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.grade_level} - {c.section}</option>)}
            </select>
          </div>
        </div>
      )}

      {(isStudent || isTeacher || selectedClass) && (
        <div className="card">
          {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
            <div className="table-container">
              <table className="table schedule-table">
                <thead>
                  <tr>
                    <th>الحصة / اليوم</th>
                    {days.map(d => <th key={d}>{dayNames[d]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(p => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                        <div className="text-muted" style={{ fontSize: 11 }}>{p.start_time?.slice(0, 5)} - {p.end_time?.slice(0, 5)}</div>
                      </td>
                      {days.map(d => {
                        const cell = getCell(d, p.id);
                        return (
                          <td key={d}>
                            {cell ? (
                              <div className="schedule-cell" style={{ position: 'relative' }}>
                                <div style={{ fontWeight: 700, fontSize: 12 }}>{cell.subject?.name}</div>
                                <div style={{ fontSize: 11, opacity: 0.8 }}>
                                  {isStudent ? (cell.teacher?.user?.name ? 'أ. ' + cell.teacher.user.name : '') : (cell.class ? `${cell.class.grade_level} (${cell.class.section})` : (cell.teacher?.user?.name || ''))}
                                </div>
                                {isAdmin && (
                                  <button
                                    id={`delete-schedule-${cell.id}`}
                                    onClick={() => handleDeleteEntry(cell.id)}
                                    style={{ position: 'absolute', top: 2, left: 2, background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, opacity: 0.5 }}
                                  >✕</button>
                                )}
                              </div>
                            ) : (
                              <div style={{ color: 'var(--gray-300)', textAlign: 'center' }}>—</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header"><h3>إضافة حصة للجدول</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">اليوم</label>
                    <select id="schedule-day-select" className="form-control" value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}>
                      {days.map(d => <option key={d} value={d}>{dayNames[d]}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">الحصة</label>
                    <select id="schedule-period-select" className="form-control" required value={form.period_id} onChange={e => setForm({ ...form, period_id: e.target.value })}>
                      <option value="">اختر</option>
                      {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">المادة</label>
                    <select id="schedule-subject-select" className="form-control" required value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                      <option value="">اختر</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">المدرس</label>
                    <select id="schedule-teacher-select" className="form-control" required value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}>
                      <option value="">اختر</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button id="save-schedule-btn" type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳...' : '💾 إضافة'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SchedulePage;
