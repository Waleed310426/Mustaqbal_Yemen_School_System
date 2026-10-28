import { useEffect, useState } from 'react';
import Layout from '../../shared/components/Layout';
import apiClient from '../../shared/apiClient';

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', specialization: '', phone: '', hire_date: '' });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const load = async () => {
    try {
      const res = await apiClient.get('/teachers');
      setTeachers(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 3000); };

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', email: '', password: '', specialization: '', phone: '', hire_date: '' });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditingId(t.id);
    setForm({
      name: t.user?.name || '',
      email: t.user?.email || '',
      password: '',
      specialization: t.specialization || '',
      phone: t.user?.phone || '',
      hire_date: t.hire_date ? t.hire_date.substring(0, 10) : '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await apiClient.put(`/teachers/${editingId}`, form);
        showAlert('success', 'تم تعديل بيانات المدرس بنجاح');
      } else {
        await apiClient.post('/teachers', form);
        showAlert('success', 'تم إضافة المدرس بنجاح');
      }
      setShowModal(false);
      setEditingId(null);
      load();
    } catch (err) { showAlert('danger', err.response?.data?.error || 'حدث خطأ'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذا المدرس؟')) return;
    try { await apiClient.delete(`/teachers/${id}`); showAlert('success', 'تم الحذف'); load(); }
    catch { showAlert('danger', 'حدث خطأ'); }
  };

  return (
    <Layout title="إدارة المدرسين">
      {alert && <div className={`alert alert-${alert.type}`}>{alert.type === 'success' ? '✅' : '❌'} {alert.msg}</div>}
      <div className="page-header">
        <div><h1>المدرسون</h1><p>إجمالي {teachers.length} مدرس</p></div>
        <button id="add-teacher-btn" className="btn btn-primary" onClick={openAdd}>+ إضافة مدرس</button>
      </div>
      <div className="card">
        {loading ? <div className="loading-screen"><div className="spinner" /></div>
          : teachers.length === 0 ? <div className="empty-state"><div className="icon">👨‍🏫</div><h3>لا يوجد مدرسون</h3></div>
          : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>#</th><th>الاسم</th><th>البريد الإلكتروني</th><th>التخصص</th><th>رقم الهاتف</th><th>إجراءات</th></tr>
                </thead>
                <tbody>
                  {teachers.map((t, i) => (
                    <tr key={t.id}>
                      <td className="text-muted">{i + 1}</td>
                      <td><strong>{t.user?.name}</strong></td>
                      <td className="text-muted">{t.user?.email}</td>
                      <td>{t.specialization || '—'}</td>
                      <td className="text-muted">{t.user?.phone || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button id={`edit-teacher-${t.id}`} className="btn btn-ghost btn-sm" onClick={() => openEdit(t)} title="تعديل">✏️</button>
                          <button id={`delete-teacher-${t.id}`} className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)} title="حذف">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editingId ? 'تعديل بيانات المدرس' : 'إضافة مدرس جديد'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group"><label className="form-label">الاسم الكامل *</label><input id="teacher-name-input" className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">البريد الإلكتروني *</label><input id="teacher-email-input" type="email" className="form-control" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  {!editingId && (
                    <div className="form-group"><label className="form-label">كلمة المرور *</label><input id="teacher-password-input" type="password" className="form-control" required={!editingId} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                  )}
                  <div className="form-group"><label className="form-label">التخصص</label><input id="teacher-spec-input" className="form-control" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">رقم الهاتف</label><input id="teacher-phone-input" className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">تاريخ التعيين</label><input id="teacher-hiredate-input" type="date" className="form-control" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button id="save-teacher-btn" type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳...' : (editingId ? '💾 حفظ التعديلات' : '💾 حفظ')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TeachersPage;
