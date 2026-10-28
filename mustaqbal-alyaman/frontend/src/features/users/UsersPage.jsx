import { useEffect, useState } from 'react';
import Layout from '../../shared/components/Layout';
import apiClient from '../../shared/apiClient';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const load = async () => {
    try {
      const res = await apiClient.get('/users');
      setUsers(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 3000); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/users', form);
      showAlert('success', 'تم إضافة المستخدم بنجاح');
      setShowModal(false);
      load();
    } catch (err) { showAlert('danger', err.response?.data?.error || 'حدث خطأ'); } finally { setSaving(false); }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await apiClient.patch(`/users/${id}/status`, { status: newStatus });
      setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
    } catch { showAlert('danger', 'حدث خطأ'); }
  };

  const roleLabels = { admin: 'مدير', teacher: 'مدرس', student: 'طالب', parent: 'ولي أمر' };

  return (
    <Layout title="إدارة المستخدمين">
      {alert && <div className={`alert alert-${alert.type}`}>{alert.type === 'success' ? '✅' : '❌'} {alert.msg}</div>}
      <div className="page-header">
        <div><h1>المستخدمون</h1><p>إجمالي {users.length} مستخدم في النظام</p></div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm({ name: '', email: '', password: '', role: 'admin' }); }}>+ إضافة مستخدم جديد</button>
      </div>
      <div className="card">
        {loading ? <div className="loading-screen"><div className="spinner" /></div>
          : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>#</th><th>الاسم</th><th>البريد الإلكتروني</th><th>الدور</th><th>الحالة</th><th>إجراءات</th></tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id}>
                      <td className="text-muted">{i + 1}</td>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td><span className="badge badge-gray">{roleLabels[u.role] || u.role}</span></td>
                      <td>
                        <span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                          {u.status === 'active' ? 'نشط' : 'موقوف'}
                        </span>
                      </td>
                      <td>
                        <button className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggleStatus(u.id, u.status)}>
                          {u.status === 'active' ? 'إيقاف' : 'تفعيل'}
                        </button>
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
            <div className="modal-header"><h3>إضافة مستخدم جديد</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <p className="text-muted" style={{ marginBottom: 16 }}>ملاحظة: إضافة المدرسين أو الطلاب من هنا ستنشئ حساب دخول فقط بدون بياناتهم الأكاديمية.</p>
                <div className="form-group"><label className="form-label">الاسم الكامل *</label><input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">البريد الإلكتروني *</label><input type="email" className="form-control" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">كلمة المرور *</label><input type="password" className="form-control" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                <div className="form-group">
                  <label className="form-label">صلاحية الحساب (الدور) *</label>
                  <select className="form-control" required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="admin">مدير النظام</option>
                    <option value="teacher">مدرس</option>
                    <option value="student">طالب</option>
                    <option value="parent">ولي أمر</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳...' : '💾 إضافة'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UsersPage;
