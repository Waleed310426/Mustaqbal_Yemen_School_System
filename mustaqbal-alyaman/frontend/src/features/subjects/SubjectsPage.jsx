import { useEffect, useState } from 'react';
import Layout from '../../shared/components/Layout';
import apiClient from '../../shared/apiClient';

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', grade_level: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const load = async () => {
    try {
      const res = await apiClient.get('/subjects');
      setSubjects(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 3000); };

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', grade_level: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditingId(s.id);
    setForm({
      name: s.name || '',
      grade_level: s.grade_level || '',
      description: s.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await apiClient.put(`/subjects/${editingId}`, form);
        showAlert('success', 'تم تعديل المادة بنجاح');
      } else {
        await apiClient.post('/subjects', form);
        showAlert('success', 'تم إضافة المادة بنجاح');
      }
      setShowModal(false);
      setEditingId(null);
      load();
    } catch (err) { showAlert('danger', err.response?.data?.error || 'حدث خطأ'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذه المادة؟')) return;
    try { await apiClient.delete(`/subjects/${id}`); showAlert('success', 'تم الحذف'); load(); }
    catch { showAlert('danger', 'حدث خطأ'); }
  };

  return (
    <Layout title="المواد الدراسية">
      {alert && <div className={`alert alert-${alert.type}`}>{alert.type === 'success' ? '✅' : '❌'} {alert.msg}</div>}
      <div className="page-header">
        <div><h1>إدارة المواد الدراسية</h1><p>إجمالي {subjects.length} مادة</p></div>
        <button id="add-subject-btn" className="btn btn-primary" onClick={openAdd}>+ إضافة مادة</button>
      </div>
      <div className="card">
        {loading ? <div className="loading-screen"><div className="spinner" /></div>
          : subjects.length === 0 ? <div className="empty-state"><div className="icon">📚</div><h3>لا توجد مواد</h3></div>
          : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>#</th><th>اسم المادة</th><th>المرحلة الدراسية</th><th>الوصف</th><th>إجراءات</th></tr>
                </thead>
                <tbody>
                  {subjects.map((s, i) => (
                    <tr key={s.id}>
                      <td className="text-muted">{i + 1}</td>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.grade_level || '—'}</td>
                      <td className="text-muted">{s.description || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button id={`edit-subject-${s.id}`} className="btn btn-ghost btn-sm" onClick={() => openEdit(s)} title="تعديل">✏️</button>
                          <button id={`delete-subject-${s.id}`} className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)} title="حذف">🗑️</button>
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
              <h3>{editingId ? 'تعديل مادة دراسية' : 'إضافة مادة جديدة'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">اسم المادة *</label><input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">المرحلة الدراسية (مثال: الأول الثانوي)</label><input className="form-control" value={form.grade_level} onChange={e => setForm({ ...form, grade_level: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">الوصف (اختياري)</label><textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳...' : (editingId ? '💾 حفظ التعديلات' : '💾 حفظ')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SubjectsPage;
