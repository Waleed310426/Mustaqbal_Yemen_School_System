import { useEffect, useState } from 'react';
import Layout from '../../shared/components/Layout';
import apiClient from '../../shared/apiClient';
import { useAuth } from '../../context/AuthContext';

const StudentsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', class_id: '', birth_date: '', gender: 'male' });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const load = async () => {
    try {
      const params = {};
      if (filterClass) params.class_id = filterClass;
      if (search) params.search = search;
      const [sRes, cRes] = await Promise.all([
        apiClient.get('/students', { params }),
        apiClient.get('/classes'),
      ]);
      setStudents(sRes.data.data);
      setClasses(cRes.data.data);
    } catch (err) {
      showAlert('danger', 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterClass]);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const openCreate = () => {
    setEditStudent(null);
    setForm({ name: '', email: '', password: '', class_id: '', birth_date: '', gender: 'male' });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditStudent(s);
    setForm({ name: s.user?.name || '', email: s.user?.email || '', password: '', class_id: s.class_id || '', birth_date: s.birth_date || '', gender: s.gender || 'male' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editStudent) {
        await apiClient.put(`/students/${editStudent.id}`, form);
        showAlert('success', 'تم تحديث بيانات الطالب بنجاح');
      } else {
        await apiClient.post('/students', form);
        showAlert('success', 'تم إضافة الطالب بنجاح');
      }
      setShowModal(false);
      load();
    } catch (err) {
      showAlert('danger', err.response?.data?.error || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    try {
      await apiClient.delete(`/students/${id}`);
      showAlert('success', 'تم حذف الطالب');
      load();
    } catch {
      showAlert('danger', 'حدث خطأ في الحذف');
    }
  };

  const genderLabel = (g) => g === 'male' ? '👦 ذكر' : '👧 أنثى';
  const statusBadge = (s) => {
    const map = { active: ['badge-green', 'نشط'], transferred: ['badge-orange', 'منقول'], graduated: ['badge-blue', 'متخرج'], withdrawn: ['badge-red', 'منسحب'] };
    const [cls, lbl] = map[s] || ['badge-gray', s];
    return <span className={`badge ${cls}`}>{lbl}</span>;
  };

  const filteredStudents = students.filter(s =>
    !search || s.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="إدارة الطلاب">
      {alert && <div className={`alert alert-${alert.type}`}>{alert.type === 'success' ? '✅' : '❌'} {alert.msg}</div>}

      <div className="page-header">
        <div>
          <h1>{isAdmin ? 'الطلاب' : 'قائمة الطلاب'}</h1>
          <p>إجمالي {filteredStudents.length} طالب</p>
        </div>
        {isAdmin && (
          <button id="add-student-btn" className="btn btn-primary" onClick={openCreate}>+ إضافة طالب</button>
        )}
      </div>

      {/* فلاتر */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                id="student-search-input"
                className="form-control"
                placeholder="ابحث عن طالب..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              id="class-filter-select"
              className="form-control"
              style={{ width: 200 }}
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
            >
              <option value="">كل الفصول</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.grade_level} - {c.section}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* جدول الطلاب */}
      <div className="card">
        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🎓</div>
            <h3>لا يوجد طلاب</h3>
            <p>{isAdmin ? 'أضف أول طالب بالضغط على زر الإضافة' : 'لا توجد بيانات طلاب مطابقة'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>اسم الطالب</th>
                  <th>البريد الإلكتروني</th>
                  <th>الفصل</th>
                  <th>الجنس</th>
                  <th>الحالة</th>
                  {isAdmin && <th>إجراءات</th>}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id}>
                    <td className="text-muted">{idx + 1}</td>
                    <td><strong>{s.user?.name}</strong></td>
                    <td className="text-muted">{s.user?.email}</td>
                    <td>{s.class ? `${s.class.grade_level} - ${s.class.section}` : <span className="text-muted">—</span>}</td>
                    <td>{genderLabel(s.gender)}</td>
                    <td>{statusBadge(s.status)}</td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button id={`edit-student-${s.id}`} className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>✏️ تعديل</button>
                          <button id={`delete-student-${s.id}`} className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>🗑️</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal إضافة/تعديل */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">الاسم الكامل *</label>
                    <input id="student-name-input" className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">البريد الإلكتروني *</label>
                    <input id="student-email-input" type="email" className="form-control" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  {!editStudent && (
                    <div className="form-group">
                      <label className="form-label">كلمة المرور *</label>
                      <input id="student-password-input" type="password" className="form-control" required={!editStudent} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">الفصل الدراسي</label>
                    <select id="student-class-select" className="form-control" value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}>
                      <option value="">اختر الفصل</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.grade_level} - {c.section}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">تاريخ الميلاد</label>
                    <input id="student-birthdate-input" type="date" className="form-control" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">الجنس</label>
                    <select id="student-gender-select" className="form-control" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button id="save-student-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default StudentsPage;
