const fs = require('fs');
const path = require('path');

const content = `import { useEffect, useState } from 'react';
import Layout from '../../shared/components/Layout';
import apiClient from '../../shared/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  Settings, School, Calendar, Plus, Edit3, Trash2,
  CheckCircle2, Save, X, AlertCircle, BookOpen
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [settings, setSettings] = useState(null);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  // نموذج إعدادات المدرسة
  const [schoolForm, setSchoolForm] = useState({
    school_name: '', phone: '', email: '', address: '', established_year: '', logo_url: '',
  });

  // نافذة الفصل الدراسي
  const [showTermModal, setShowTermModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [termForm, setTermForm] = useState({
    name: '', academic_year: '', start_date: '', end_date: '', is_current: false,
  });
  const [savingTerm, setSavingTerm] = useState(false);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/settings');
      const { settings: s, terms: t } = res.data.data;
      setSettings(s);
      setTerms(t || []);
      setSchoolForm({
        school_name: s?.school_name || '',
        phone: s?.phone || '',
        email: s?.email || '',
        address: s?.address || '',
        established_year: s?.established_year || '',
        logo_url: s?.logo_url || '',
      });
    } catch (err) {
      showAlert('error', 'فشل تحميل الإعدادات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/settings', schoolForm);
      showAlert('success', 'تم حفظ إعدادات المدرسة بنجاح.');
      loadData();
    } catch (err) {
      showAlert('error', err.response?.data?.error || 'فشل حفظ الإعدادات.');
    } finally {
      setSaving(false);
    }
  };

  const openAddTerm = () => {
    setEditingTerm(null);
    setTermForm({ name: '', academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1), start_date: '', end_date: '', is_current: false });
    setShowTermModal(true);
  };

  const openEditTerm = (term) => {
    setEditingTerm(term);
    setTermForm({
      name: term.name,
      academic_year: term.academic_year,
      start_date: term.start_date || '',
      end_date: term.end_date || '',
      is_current: term.is_current,
    });
    setShowTermModal(true);
  };

  const handleSaveTerm = async (e) => {
    e.preventDefault();
    if (!termForm.name || !termForm.academic_year) {
      showAlert('error', 'اسم الفصل والسنة الدراسية مطلوبان.');
      return;
    }
    setSavingTerm(true);
    try {
      if (editingTerm) {
        await apiClient.put('/settings/terms/' + editingTerm.id, termForm);
        showAlert('success', 'تم تحديث الفصل الدراسي.');
      } else {
        await apiClient.post('/settings/terms', termForm);
        showAlert('success', 'تم إضافة الفصل الدراسي.');
      }
      setShowTermModal(false);
      loadData();
    } catch (err) {
      showAlert('error', err.response?.data?.error || 'فشل حفظ الفصل الدراسي.');
    } finally {
      setSavingTerm(false);
    }
  };

  const handleSetCurrent = async (termId) => {
    try {
      await apiClient.patch('/settings/terms/' + termId + '/current');
      showAlert('success', 'تم تفعيل الفصل الدراسي كفصل حالي.');
      loadData();
    } catch (err) {
      showAlert('error', 'فشل تفعيل الفصل الدراسي.');
    }
  };

  const handleDeleteTerm = async (termId, isCurrent) => {
    if (isCurrent) {
      showAlert('error', 'لا يمكن حذف الفصل الدراسي النشط حالياً.');
      return;
    }
    if (!window.confirm('هل أنت متأكد من حذف هذا الفصل الدراسي؟')) return;
    try {
      await apiClient.delete('/settings/terms/' + termId);
      showAlert('success', 'تم حذف الفصل الدراسي.');
      loadData();
    } catch (err) {
      showAlert('error', err.response?.data?.error || 'فشل الحذف.');
    }
  };

  if (loading) return (
    <Layout title="إعدادات النظام">
      <div className="loading-screen"><div className="spinner" /></div>
    </Layout>
  );

  return (
    <Layout title="إعدادات النظام">
      {alert && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, padding: '12px 24px', borderRadius: 12, fontWeight: 600,
          background: alert.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: alert.type === 'success' ? '#166534' : '#991b1b',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertCircle size={18} />
          {alert.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #4f46e5 100%)',
        borderRadius: 16, padding: '24px 32px', color: 'white', marginBottom: 28,
        display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: '0 10px 25px -5px rgba(79,70,229,0.4)',
      }}>
        <div style={{ background: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 12 }}>
          <Settings size={36} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: 0 }}>إعدادات المدرسة والسنة الدراسية</h1>
          <p style={{ opacity: 0.85, margin: 0, marginTop: 4, fontSize: 14 }}>ضبط هوية المدرسة والفصول الدراسية</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* إعدادات المدرسة */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <School size={20} color="var(--primary)" />
            بيانات المدرسة
          </h2>
          <form onSubmit={handleSaveSettings}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--gray-600)' }}>اسم المدرسة *</label>
                <input
                  className="input"
                  value={schoolForm.school_name}
                  onChange={e => setSchoolForm({ ...schoolForm, school_name: e.target.value })}
                  placeholder="مدرسة مستقبل اليمن"
                  required
                  disabled={!isAdmin}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--gray-600)' }}>رقم الهاتف</label>
                  <input className="input" value={schoolForm.phone} onChange={e => setSchoolForm({ ...schoolForm, phone: e.target.value })} placeholder="+967-1-234567" disabled={!isAdmin} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--gray-600)' }}>البريد الإلكتروني</label>
                  <input className="input" type="email" value={schoolForm.email} onChange={e => setSchoolForm({ ...schoolForm, email: e.target.value })} placeholder="info@school.edu.ye" disabled={!isAdmin} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--gray-600)' }}>العنوان</label>
                <textarea className="input" rows={2} value={schoolForm.address} onChange={e => setSchoolForm({ ...schoolForm, address: e.target.value })} placeholder="صنعاء، اليمن" disabled={!isAdmin} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--gray-600)' }}>سنة التأسيس</label>
                  <input className="input" type="number" value={schoolForm.established_year} onChange={e => setSchoolForm({ ...schoolForm, established_year: e.target.value })} placeholder="2010" disabled={!isAdmin} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--gray-600)' }}>رابط الشعار</label>
                  <input className="input" value={schoolForm.logo_url} onChange={e => setSchoolForm({ ...schoolForm, logo_url: e.target.value })} placeholder="/logo.png" disabled={!isAdmin} />
                </div>
              </div>
            </div>
            {isAdmin && (
              <button type="submit" className="btn btn-primary" style={{ marginTop: 20, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={saving}>
                <Save size={16} />
                {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            )}
          </form>

          {/* الفصل الحالي */}
          {settings?.currentTerm && (
            <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(16,185,129,0.08)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span style={{ fontWeight: 700, color: '#166534' }}>الفصل الدراسي الحالي:</span>
                <span style={{ color: '#15803d' }}>{settings.currentTerm.name} — {settings.currentTerm.academic_year}</span>
              </div>
            </div>
          )}
        </div>

        {/* الفصول الدراسية */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Calendar size={20} color="#8b5cf6" />
              الفصول الدراسية
            </h2>
            {isAdmin && (
              <button onClick={openAddTerm} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={15} />إضافة فصل
              </button>
            )}
          </div>

          {terms.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={40} style={{ opacity: 0.3 }} />
              <p>لا توجد فصول دراسية بعد</p>
              {isAdmin && <button onClick={openAddTerm} className="btn btn-primary" style={{ marginTop: 12 }}>إضافة أول فصل</button>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
              {terms.map((term) => (
                <div key={term.id} style={{
                  padding: '14px 16px', borderRadius: 12, border: '1px solid',
                  borderColor: term.is_current ? 'rgba(16,185,129,0.4)' : 'var(--gray-200)',
                  background: term.is_current ? 'rgba(16,185,129,0.05)' : 'white',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{term.name}</span>
                        {term.is_current && (
                          <span style={{ background: '#dcfce7', color: '#166534', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>الفصل الحالي</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                        {term.academic_year}
                        {term.start_date && ` • ${new Date(term.start_date).toLocaleDateString('ar-YE')}`}
                        {term.end_date && ` - ${new Date(term.end_date).toLocaleDateString('ar-YE')}`}
                      </div>
                    </div>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {!term.is_current && (
                          <button onClick={() => handleSetCurrent(term.id)} title="تعيين كفصل حالي" style={{ background: 'rgba(16,185,129,0.1)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#16a34a' }}>
                            <CheckCircle2 size={15} />
                          </button>
                        )}
                        <button onClick={() => openEditTerm(term)} style={{ background: 'rgba(59,130,246,0.1)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'var(--primary)' }}>
                          <Edit3 size={15} />
                        </button>
                        {!term.is_current && (
                          <button onClick={() => handleDeleteTerm(term.id, term.is_current)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#ef4444' }}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal الفصل الدراسي */}
      {showTermModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={20} color="var(--primary)" />
                {editingTerm ? 'تعديل الفصل الدراسي' : 'إضافة فصل دراسي'}
              </h3>
              <button onClick={() => setShowTermModal(false)} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveTerm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--gray-600)' }}>اسم الفصل *</label>
                <input className="input" value={termForm.name} onChange={e => setTermForm({ ...termForm, name: e.target.value })} placeholder="الفصل الأول" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--gray-600)' }}>السنة الدراسية *</label>
                <input className="input" value={termForm.academic_year} onChange={e => setTermForm({ ...termForm, academic_year: e.target.value })} placeholder="2025-2026" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--gray-600)' }}>تاريخ البداية</label>
                  <input type="date" className="input" value={termForm.start_date} onChange={e => setTermForm({ ...termForm, start_date: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--gray-600)' }}>تاريخ النهاية</label>
                  <input type="date" className="input" value={termForm.end_date} onChange={e => setTermForm({ ...termForm, end_date: e.target.value })} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <input type="checkbox" checked={termForm.is_current} onChange={e => setTermForm({ ...termForm, is_current: e.target.checked })} style={{ width: 18, height: 18 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>تعيين كفصل دراسي حالي</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>سيتم إلغاء تفعيل الفصل الحالي تلقائياً</div>
                </div>
              </label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={savingTerm}>
                  <Save size={15} />
                  {savingTerm ? 'جاري الحفظ...' : (editingTerm ? 'تحديث' : 'إضافة')}
                </button>
                <button type="button" onClick={() => setShowTermModal(false)} className="btn" style={{ padding: '10px 20px', background: 'var(--gray-100)', color: 'var(--gray-700)' }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
`;

fs.writeFileSync(path.join(__dirname, 'SettingsPage.jsx'), content, 'utf8');
console.log('SettingsPage written! Lines: ' + content.split('\n').length);
