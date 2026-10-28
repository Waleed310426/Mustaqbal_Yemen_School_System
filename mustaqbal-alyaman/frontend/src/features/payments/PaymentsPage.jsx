import { useEffect, useState } from 'react';
import Layout from '../../shared/components/Layout';
import apiClient from '../../shared/apiClient';
import { useAuth } from '../../context/AuthContext';

const PaymentsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ student_id: '', amount: '', due_date: '', payment_method: 'cash', notes: '', status: 'paid' });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const [pRes, sRes, rRes] = await Promise.all([
        apiClient.get('/payments', { params }),
        isAdmin ? apiClient.get('/students') : Promise.resolve({ data: { data: [] } }),
        isAdmin ? apiClient.get('/payments/report') : Promise.resolve({ data: { data: null } }),
      ]);
      setPayments(pRes.data.data);
      if (sRes.data.data) setStudents(sRes.data.data);
      if (rRes.data.data) setReport(rRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ student_id: '', amount: '', due_date: '', payment_method: 'cash', notes: '', status: 'paid' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({
      student_id: p.student_id,
      amount: p.amount,
      due_date: p.due_date ? p.due_date.substring(0, 10) : '',
      payment_method: p.payment_method || 'cash',
      notes: p.notes || '',
      status: p.status || 'paid',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await apiClient.put(`/payments/${editingId}`, form);
        showAlert('success', 'تم تعديل بيانات الدفعة بنجاح');
      } else {
        await apiClient.post('/payments', form);
        showAlert('success', 'تم تسجيل الدفعة وإنشاء الإيصال بنجاح');
      }
      setShowModal(false);
      setEditingId(null);
      load();
    } catch (err) {
      showAlert('danger', err.response?.data?.error || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذه الدفعة؟')) return;
    try {
      await apiClient.delete(`/payments/${id}`);
      showAlert('success', 'تم حذف الدفعة');
      load();
    } catch { showAlert('danger', 'حدث خطأ'); }
  };

  const statusBadge = (s) => {
    const map = { paid: ['badge-green', '✅ مدفوع'], pending: ['badge-orange', '⏳ معلق'], partial: ['badge-blue', '🔄 جزئي'], overdue: ['badge-red', '❗ متأخر'] };
    const [cls, lbl] = map[s] || ['badge-gray', s];
    return <span className={`badge ${cls}`}>{lbl}</span>;
  };

  const formatNum = (n) => new Intl.NumberFormat('ar-YE').format(n || 0);

  return (
    <Layout title="المصروفات والمدفوعات">
      {alert && <div className={`alert alert-${alert.type}`}>{alert.type === 'success' ? '✅' : '❌'} {alert.msg}</div>}

      <div className="page-header">
        <div>
          <h1>{isStudent ? 'رسومي ومصروفاتي الدراسية' : 'المصروفات والمدفوعات'}</h1>
          <p>{isStudent ? 'بيان الرسوم الدراسية وحالة السداد والإيصالات الرسمية' : 'إدارة الرسوم الدراسية وتتبع المدفوعات'}</p>
        </div>
        {isAdmin && (
          <button id="add-payment-btn" className="btn btn-primary" onClick={openAdd}>
            + تسجيل دفعة
          </button>
        )}
      </div>

      {/* ملخص مالي */}
      {report && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card green">
            <div className="stat-icon">💰</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{formatNum(report.totalCollected)}</div>
            <div className="stat-label">إجمالي المحصّل (ريال)</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-icon">⏳</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{formatNum(report.totalPending)}</div>
            <div className="stat-label">مبالغ معلقة</div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon">❗</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{formatNum(report.totalOverdue)}</div>
            <div className="stat-label">مبالغ متأخرة</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-icon">🧾</div>
            <div className="stat-value">{report.count?.paid || 0}</div>
            <div className="stat-label">عدد الدفعات المكتملة</div>
          </div>
        </div>
      )}

      {/* فلتر */}
      {!isStudent && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body" style={{ padding: '16px 24px' }}>
            <select id="payment-status-filter" className="form-control" style={{ maxWidth: 220 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">كل الحالات</option>
              <option value="paid">مدفوع</option>
              <option value="pending">معلق</option>
              <option value="partial">جزئي</option>
              <option value="overdue">متأخر</option>
            </select>
          </div>
        </div>
      )}

      {/* جدول */}
      <div className="card">
        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <div className="icon">💰</div>
            <h3>لا توجد دفعات مسجلة</h3>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الطالب</th>
                  <th>المبلغ</th>
                  <th>طريقة الدفع</th>
                  <th>تاريخ الدفع</th>
                  <th>الحالة</th>
                  <th>الإيصال</th>
                  {isAdmin && <th>إجراءات</th>}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="text-muted">{idx + 1}</td>
                    <td><strong>{p.student?.user?.name}</strong></td>
                    <td><strong>{formatNum(p.amount)}</strong> ريال</td>
                    <td>{p.payment_method === 'cash' ? '💵 نقداً' : p.payment_method}</td>
                    <td className="text-muted">{p.paid_date || '—'}</td>
                    <td>{statusBadge(p.status)}</td>
                    <td>
                      {p.receipt_url ? (
                        <a href={`http://localhost:5005${p.receipt_url}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                          📄 إيصال
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button id={`edit-payment-${p.id}`} className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} title="تعديل">✏️</button>
                          <button id={`delete-payment-${p.id}`} className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)} title="حذف">🗑️</button>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editingId ? 'تعديل بيانات الدفعة' : 'تسجيل دفعة جديدة'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">الطالب *</label>
                  <select id="payment-student-select" className="form-control" required value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}>
                    <option value="">اختر الطالب</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.user?.name}</option>)}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">المبلغ (ريال) *</label>
                    <input id="payment-amount-input" type="number" className="form-control" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">طريقة الدفع</label>
                    <select id="payment-method-select" className="form-control" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                      <option value="cash">نقداً</option>
                      <option value="transfer">تحويل بنكي</option>
                      <option value="check">شيك</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">تاريخ الاستحقاق</label>
                    <input id="payment-due-input" type="date" className="form-control" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">الحالة</label>
                    <select id="payment-status-select" className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="paid">مدفوع</option>
                      <option value="partial">جزئي</option>
                      <option value="pending">معلق</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">ملاحظات</label>
                  <textarea id="payment-notes-input" className="form-control" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button id="save-payment-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ جارٍ الحفظ...' : (editingId ? '💾 حفظ التعديلات' : '💾 تسجيل الدفعة')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PaymentsPage;
