import { useEffect, useState } from 'react';
import Layout from '../../shared/components/Layout';
import apiClient from '../../shared/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  FileBarChart, Award, FileText, Plus, Printer,
  Download, Trash2, CheckCircle2, User, BookOpen, AlertCircle, Edit3
} from 'lucide-react';

const examTypeLabel = {
  monthly: 'شهري',
  midterm: 'نصف فصلي',
  final: 'نهائي',
  homework: 'واجبات',
  participation: 'مشاركة',
};

const certTypeLabel = {
  completion: 'شهادة إتمام',
  honor: 'شهادة تفوق وتقدير',
  participation: 'شهادة مشاركة',
  custom: 'شهادة مخصصة',
};

export default function GradesPage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';
  const canManage = isAdmin || user?.role === 'teacher';

  const [activeTab, setActiveTab] = useState(isStudent ? 'sheet' : 'grades');
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // الفلترة
  const [filterStudent, setFilterStudent] = useState('');

  // نافذة إضافة / تعديل درجة
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editingGradeId, setEditingGradeId] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    student_id: '',
    subject_id: '',
    exam_type: 'monthly',
    score: '',
    max_score: 100,
    notes: '',
  });
  const [savingGrade, setSavingGrade] = useState(false);

  // كشف الدرجات
  const [sheetStudentId, setSheetStudentId] = useState('');
  const [sheetData, setSheetData] = useState(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadSheetPdf = async () => {
    setDownloadingPdf(true);
    try {
      const sid = isStudent ? '' : sheetStudentId;
      const res = await apiClient.get('/grades/sheet/pdf', {
        params: sid ? { student_id: sid } : {},
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `كشف_درجات_${sheetData?.student?.name || 'طالب'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showAlert('success', 'تم استخراج وتنزيل كشف الدرجات بنجاح');
    } catch (err) {
      console.error(err);
      showAlert('danger', 'فشل في استخراج ملف PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // الشهادات
  const [certificates, setCertificates] = useState([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [certForm, setCertForm] = useState({
    student_id: '',
    title: 'شهادة إتمام وتفوق',
    type: 'completion',
  });
  const [savingCert, setSavingCert] = useState(false);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3500);
  };

  // تحميل البيانات الأساسية
  const loadBase = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStudent) params.student_id = filterStudent;
      const [gRes, sRes, subRes] = await Promise.all([
        apiClient.get('/grades', { params }),
        !isStudent ? apiClient.get('/students') : Promise.resolve({ data: { data: [] } }),
        apiClient.get('/subjects'),
      ]);
      setGrades(gRes.data.data);
      if (!isStudent) {
        setStudents(sRes.data.data);
        if (sRes.data.data.length > 0 && !sheetStudentId) {
          setSheetStudentId(sRes.data.data[0].id);
        }
      }
      setSubjects(subRes.data.data);
    } catch (err) {
      console.error(err);
      showAlert('danger', 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBase();
  }, [filterStudent]);

  // تحميل كشف الدرجات
  const loadSheet = async (sid) => {
    setSheetLoading(true);
    try {
      const params = sid ? { student_id: sid } : {};
      const res = await apiClient.get('/grades/sheet', { params });
      setSheetData(res.data.data);
    } catch (err) {
      console.error(err);
      showAlert('danger', err.response?.data?.error || 'خطأ في جلب كشف الدرجات');
    } finally {
      setSheetLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sheet') {
      if (isStudent) {
        loadSheet();
      } else if (sheetStudentId) {
        loadSheet(sheetStudentId);
      }
    } else if (activeTab === 'certificates') {
      loadCertificates();
    }
  }, [activeTab, sheetStudentId]);

  // تحميل الشهادات
  const loadCertificates = async () => {
    setCertsLoading(true);
    try {
      const res = await apiClient.get('/grades/certificates');
      setCertificates(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCertsLoading(false);
    }
  };

  // فتح نافذة تعديل درجة
  const handleEditGrade = (g) => {
    setEditingGradeId(g.id);
    setGradeForm({
      student_id: g.student_id,
      subject_id: g.subject_id,
      exam_type: g.exam_type,
      score: g.score,
      max_score: g.max_score,
      notes: g.notes || '',
    });
    setShowGradeModal(true);
  };

  // حفظ درجة (إضافة أو تعديل)
  const handleSaveGrade = async (e) => {
    e.preventDefault();
    setSavingGrade(true);
    try {
      if (editingGradeId) {
        await apiClient.put(`/grades/${editingGradeId}`, gradeForm);
        showAlert('success', 'تم تعديل الدرجة بنجاح');
      } else {
        await apiClient.post('/grades', gradeForm);
        showAlert('success', 'تم رصد الدرجة بنجاح');
      }
      setShowGradeModal(false);
      setEditingGradeId(null);
      setGradeForm({ student_id: '', subject_id: '', exam_type: 'monthly', score: '', max_score: 100, notes: '' });
      loadBase();
    } catch (err) {
      showAlert('danger', err.response?.data?.error || 'فشل في حفظ الدرجة');
    } finally {
      setSavingGrade(false);
    }
  };

  // حذف درجة
  const handleDeleteGrade = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الدرجة؟')) return;
    try {
      await apiClient.delete(`/grades/${id}`);
      showAlert('success', 'تم حذف الدرجة بنجاح');
      loadBase();
    } catch {
      showAlert('danger', 'حدث خطأ أثناء الحذف');
    }
  };

  // إصدار شهادة جديدة
  const handleIssueCert = async (e) => {
    e.preventDefault();
    setSavingCert(true);
    try {
      await apiClient.post('/grades/certificates', certForm);
      showAlert('success', 'تم إصدار الشهادة وتوليد ملف PDF بنجاح');
      setShowCertModal(false);
      loadCertificates();
    } catch (err) {
      showAlert('danger', err.response?.data?.error || 'حدث خطأ أثناء إصدار الشهادة');
    } finally {
      setSavingCert(false);
    }
  };

  // حذف شهادة
  const handleDeleteCert = async (id) => {
    if (!window.confirm('هل تريد حذف هذه الشهادة وملفها؟')) return;
    try {
      await apiClient.delete(`/grades/certificates/${id}`);
      showAlert('success', 'تم حذف الشهادة بنجاح');
      loadCertificates();
    } catch {
      showAlert('danger', 'حدث خطأ في حذف الشهادة');
    }
  };

  const getScoreBadgeClass = (score, max) => {
    const pct = (score / max) * 100;
    if (pct >= 85) return 'badge-green';
    if (pct >= 65) return 'badge-orange';
    return 'badge-red';
  };

  const getAppraisal = (avg) => {
    const num = parseFloat(avg || 0);
    if (num >= 90) return { label: 'ممتاز 🌟', color: '#10b981' };
    if (num >= 80) return { label: 'جيد جداً 👍', color: '#3b82f6' };
    if (num >= 65) return { label: 'جيد 👌', color: '#f59e0b' };
    if (num >= 50) return { label: 'مقبول ⚠️', color: '#eab308' };
    return { label: 'يحتاج تحسين ❌', color: '#ef4444' };
  };

  return (
    <Layout title="الدرجات والنتائج والشهادات">
      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.msg}
        </div>
      )}

      {/* Tabs Header */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '2px solid var(--gray-200)',
        marginBottom: 24,
        paddingBottom: 2,
      }}>
        {!isStudent && (
          <button
            className={`btn ${activeTab === 'grades' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => setActiveTab('grades')}
          >
            <FileBarChart size={18} />
            رصد وإدارة الدرجات
          </button>
        )}
        <button
          className={`btn ${activeTab === 'sheet' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => setActiveTab('sheet')}
        >
          <FileText size={18} />
          كشف الدرجات والمعدل التراكمي
        </button>
        <button
          className={`btn ${activeTab === 'certificates' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => setActiveTab('certificates')}
        >
          <Award size={18} />
          الشهادات المدرسية المعتمدة
        </button>
      </div>

      {/* ================= TAB 1: رصد الدرجات ================= */}
      {activeTab === 'grades' && !isStudent && (
        <>
          <div className="page-header" style={{ marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>سجل درجات الطلاب</h1>
              <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>رصد ومتابعة الاختبارات والواجبات المدرسية</p>
            </div>
            {canManage && (
              <button
                id="add-grade-btn"
                className="btn btn-primary"
                onClick={() => {
                  setEditingGradeId(null);
                  setGradeForm({ student_id: '', subject_id: '', exam_type: 'monthly', score: '', max_score: 100, notes: '' });
                  setShowGradeModal(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Plus size={18} />
                + رصد درجة جديدة
              </button>
            )}
          </div>

          {/* فلتر */}
          <div className="card" style={{ marginBottom: 20, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-700)' }}>فلترة حسب الطالب:</span>
              <select
                id="grade-student-filter"
                className="form-control"
                style={{ maxWidth: 320 }}
                value={filterStudent}
                onChange={e => setFilterStudent(e.target.value)}
              >
                <option value="">جميع الطلاب ({students.length})</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.user?.name} {s.class ? `(${s.class.grade_level} - ${s.class.section})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* جدول الدرجات */}
          <div className="card">
            {loading ? (
              <div className="loading-screen"><div className="spinner" /></div>
            ) : grades.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📊</div>
                <h3>لا توجد درجات مرصودة حالياً</h3>
                <p>اضغط على "رصد درجة جديدة" لإضافة أول تقييم للطالب</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>اسم الطالب</th>
                      <th>المادة</th>
                      <th>نوع التقييم</th>
                      <th>الدرجة المحققة</th>
                      <th>النسبة المئوية</th>
                      <th>ملاحظات</th>
                      {canManage && <th>إجراءات</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g, idx) => {
                      const pct = ((g.score / g.max_score) * 100).toFixed(0);
                      return (
                        <tr key={g.id}>
                          <td className="text-muted">{idx + 1}</td>
                          <td>
                            <strong>{g.student?.user?.name || '—'}</strong>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{g.subject?.name}</span>
                          </td>
                          <td>
                            <span className="badge badge-blue">{examTypeLabel[g.exam_type] || g.exam_type}</span>
                          </td>
                          <td>
                            <strong>{g.score}</strong> <span className="text-muted">/ {g.max_score}</span>
                          </td>
                          <td>
                            <span className={`badge ${getScoreBadgeClass(g.score, g.max_score)}`}>{pct}%</span>
                          </td>
                          <td className="text-muted" style={{ maxWidth: 200, fontSize: 13 }}>
                            {g.notes || '—'}
                          </td>
                          {canManage && (
                            <td>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button
                                  id={`edit-grade-${g.id}`}
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleEditGrade(g)}
                                  title="تعديل الدرجة"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--primary)', borderColor: 'var(--primary-light, #bfdbfe)' }}
                                >
                                  <Edit3 size={15} />
                                  <span style={{ fontSize: 12 }}>تعديل</span>
                                </button>
                                {isAdmin && (
                                  <button
                                    id={`delete-grade-${g.id}`}
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteGrade(g.id)}
                                    title="حذف الدرجة"
                                    style={{ display: 'inline-flex', alignItems: 'center' }}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= TAB 2: كشف الدرجات الشامل ================= */}
      {activeTab === 'sheet' && (
        <>
          <div className="page-header" style={{ marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>كشف الدرجات الأكاديمي</h1>
              <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>تقرير تفصيلي بمعدل الطالب ومحصلة المواد الدراسية</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {!isStudent && (
                <select
                  className="form-control"
                  style={{ width: 280 }}
                  value={sheetStudentId}
                  onChange={e => setSheetStudentId(e.target.value)}
                >
                  <option value="">-- اختر طالباً --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.user?.name} {s.class ? `(${s.class.grade_level})` : ''}</option>
                  ))}
                </select>
              )}
              {sheetData && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    id="download-sheet-pdf-btn"
                    className="btn btn-primary"
                    onClick={handleDownloadSheetPdf}
                    disabled={downloadingPdf}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Download size={16} />
                    {downloadingPdf ? 'جارِ إنشاء الـ PDF...' : 'استخراج كشف الدرجات (PDF)'}
                  </button>
                  <button
                    id="print-sheet-btn"
                    className="btn btn-ghost"
                    onClick={() => window.print()}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--gray-300)' }}
                  >
                    <Printer size={16} />
                    طباعة الكشف
                  </button>
                </div>
              )}
            </div>
          </div>

          {sheetLoading ? (
            <div className="loading-screen"><div className="spinner" /></div>
          ) : !sheetData ? (
            <div className="empty-state">
              <div className="icon">📑</div>
              <h3>اختر طالباً لعرض كشف درجاته ومعدله</h3>
            </div>
          ) : (
            <div className="card" style={{ padding: 32, background: '#fff' }}>
              {/* ترويسة الكشف الرسمي */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid var(--primary)',
                paddingBottom: 20,
                marginBottom: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img src="/logo.png" alt="شعار المدرسة" style={{ width: 64, height: 64, objectFit: 'contain' }} />
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>مدرسة مستقبل اليمن الأهلية</h2>
                    <p style={{ color: 'var(--gray-500)', fontSize: 13, margin: '4px 0 0' }}>الإدارة العامة للاختبارات والكنترول المدرسي</p>
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)' }}>كشف نتائج دراسي</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>العام الدراسي: 2025-2026</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>تاريخ الإصدار: {new Date().toLocaleDateString('ar-YE')}</div>
                </div>
              </div>

              {/* بيانات الطالب */}
              <div style={{
                background: 'var(--gray-50)',
                padding: '16px 20px',
                borderRadius: 12,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                marginBottom: 28,
              }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>اسم الطالب:</span>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--gray-800)' }}>{sheetData.student?.name || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>الصف الدراسي:</span>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gray-800)' }}>{sheetData.student?.class || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>المعدل التراكمي العام:</span>
                  <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)' }}>{sheetData.average}%</div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>التقدير العام:</span>
                  <div style={{ fontWeight: 800, fontSize: 16, color: getAppraisal(sheetData.average).color }}>
                    {getAppraisal(sheetData.average).label}
                  </div>
                </div>
              </div>

              {/* جدول كشف المواد */}
              {sheetData.bySubject.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <AlertCircle size={32} color="var(--gray-400)" />
                  <p style={{ marginTop: 10 }}>لا توجد درجات مرصودة لهذا الطالب حتى الآن</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table" style={{ border: '1px solid var(--gray-200)' }}>
                    <thead style={{ background: 'var(--gray-100)' }}>
                      <tr>
                        <th style={{ width: '25%' }}>المادة الدراسية</th>
                        <th>تفاصيل التقييمات المرصودة</th>
                        <th style={{ width: '15%' }}>مجموع المادة</th>
                        <th style={{ width: '15%' }}>النسبة المئوية</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheetData.bySubject.map((item, idx) => {
                        const subScore = item.grades.reduce((s, g) => s + parseFloat(g.score), 0);
                        const subMax = item.grades.reduce((s, g) => s + parseFloat(g.max_score), 0);
                        const subPct = subMax > 0 ? ((subScore / subMax) * 100).toFixed(1) : 0;
                        return (
                          <tr key={idx}>
                            <td>
                              <strong style={{ fontSize: 15 }}>{item.subject?.name || 'مادة عامة'}</strong>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {item.grades.map((g, gIdx) => (
                                  <span
                                    key={gIdx}
                                    style={{
                                      background: '#f1f5f9',
                                      padding: '3px 8px',
                                      borderRadius: 6,
                                      fontSize: 12,
                                      border: '1px solid #cbd5e1',
                                    }}
                                  >
                                    {examTypeLabel[g.exam_type]}: <strong>{g.score}</strong>/{g.max_score}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <strong>{subScore}</strong> / {subMax}
                            </td>
                            <td>
                              <span className={`badge ${getScoreBadgeClass(subScore, subMax)}`} style={{ fontSize: 13, padding: '4px 8px' }}>
                                {subPct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot style={{ background: '#f8fafc', fontWeight: 800 }}>
                      <tr>
                        <td colSpan={2} style={{ textAlign: 'left', padding: 14 }}>المجموع الكلي والمعدل العام:</td>
                        <td>{sheetData.totalScore} / {sheetData.totalMax}</td>
                        <td style={{ fontSize: 16, color: 'var(--primary)' }}>{sheetData.average}%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ================= TAB 3: الشهادات المعتمدة ================= */}
      {activeTab === 'certificates' && (
        <>
          <div className="page-header" style={{ marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>الشهادات المدرسية المعتمدة</h1>
              <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>شهادات النجاح والتفوق والإتمام القابلة للطباعة والتنزيل (PDF)</p>
            </div>
            {isAdmin && (
              <button
                id="issue-cert-btn"
                className="btn btn-primary"
                onClick={() => setShowCertModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Award size={18} />
                + إصدار شهادة جديدة
              </button>
            )}
          </div>

          <div className="card">
            {certsLoading ? (
              <div className="loading-screen"><div className="spinner" /></div>
            ) : certificates.length === 0 ? (
              <div className="empty-state">
                <div className="icon">🏆</div>
                <h3>لا توجد شهادات صادرة حالياً</h3>
                <p>{isAdmin ? 'اضغط على "إصدار شهادة جديدة" لتوليد شهادة PDF رسمية' : 'لم يتم إصدار شهادات لهذا الحساب بعد'}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>اسم الطالب</th>
                      <th>نوع الشهادة</th>
                      <th>عنوان الشهادة</th>
                      <th>تاريخ الإصدار</th>
                      <th>معاينة وتنزيل</th>
                      {isAdmin && <th>إجراءات</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map((cert, idx) => (
                      <tr key={cert.id}>
                        <td className="text-muted">{idx + 1}</td>
                        <td>
                          <strong>{cert.student?.user?.name || '—'}</strong>
                        </td>
                        <td>
                          <span className="badge badge-blue">{certTypeLabel[cert.type] || cert.type}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{cert.title}</span>
                        </td>
                        <td className="text-muted">
                          {cert.issue_date || new Date(cert.created_at).toLocaleDateString('ar-YE')}
                        </td>
                        <td>
                          {cert.file_url ? (
                            <a
                              href={`http://localhost:5005${cert.file_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-outline"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)' }}
                            >
                              <Download size={14} />
                              عرض وتنزيل PDF
                            </a>
                          ) : (
                            <span className="text-muted">غير متاح</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteCert(cert.id)}
                              title="حذف الشهادة"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal: إضافة درجة جديدة */}
      {showGradeModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowGradeModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>{editingGradeId ? '✏️ تعديل درجة الطالب' : 'رصد تقييم جديد لطالب'}</h3>
              <button className="modal-close" onClick={() => { setShowGradeModal(false); setEditingGradeId(null); }}>✕</button>
            </div>
            <form onSubmit={handleSaveGrade}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">اختر الطالب *</label>
                  <select
                    id="grade-student-select"
                    className="form-control"
                    required
                    value={gradeForm.student_id}
                    onChange={e => setGradeForm({ ...gradeForm, student_id: e.target.value })}
                  >
                    <option value="">-- حدد الطالب --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.user?.name} {s.class ? `(${s.class.grade_level})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">المادة الدراسية *</label>
                  <select
                    id="grade-subject-select"
                    className="form-control"
                    required
                    value={gradeForm.subject_id}
                    onChange={e => setGradeForm({ ...gradeForm, subject_id: e.target.value })}
                  >
                    <option value="">-- حدد المادة --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">نوع التقييم *</label>
                    <select
                      className="form-control"
                      value={gradeForm.exam_type}
                      onChange={e => setGradeForm({ ...gradeForm, exam_type: e.target.value })}
                    >
                      <option value="monthly">شهري</option>
                      <option value="midterm">نصف فصلي</option>
                      <option value="final">نهائي</option>
                      <option value="homework">واجبات</option>
                      <option value="participation">مشاركة وتفاعل</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">الدرجة العظمى *</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      min="1"
                      value={gradeForm.max_score}
                      onChange={e => setGradeForm({ ...gradeForm, max_score: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">الدرجة المحققة *</label>
                  <input
                    type="number"
                    step="0.25"
                    className="form-control"
                    required
                    min="0"
                    max={gradeForm.max_score}
                    placeholder="مثال: 85"
                    value={gradeForm.score}
                    onChange={e => setGradeForm({ ...gradeForm, score: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ملاحظات المعلم (اختياري)</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="مثال: أداء متميز في التعبير الكتابي"
                    value={gradeForm.notes}
                    onChange={e => setGradeForm({ ...gradeForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => { setShowGradeModal(false); setEditingGradeId(null); }}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={savingGrade}>
                  {savingGrade ? '⏳ جارٍ الحفظ...' : (editingGradeId ? '💾 حفظ التعديلات' : '💾 حفظ ورصد الدرجة')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: إصدار شهادة جديدة */}
      {showCertModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCertModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>إصدار شهادة مدرسية رسمية (PDF)</h3>
              <button className="modal-close" onClick={() => setShowCertModal(false)}>✕</button>
            </div>
            <form onSubmit={handleIssueCert}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">اختر الطالب المستحق *</label>
                  <select
                    className="form-control"
                    required
                    value={certForm.student_id}
                    onChange={e => setCertForm({ ...certForm, student_id: e.target.value })}
                  >
                    <option value="">-- حدد الطالب --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.user?.name} {s.class ? `(${s.class.grade_level})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">نوع الشهادة *</label>
                  <select
                    className="form-control"
                    value={certForm.type}
                    onChange={e => setCertForm({ ...certForm, type: e.target.value })}
                  >
                    <option value="completion">شهادة إتمام مرحلة</option>
                    <option value="honor">شهادة تفوق وتقدير علمي</option>
                    <option value="participation">شهادة مشاركة وتميز</option>
                    <option value="custom">شهادة تقديرية مخصصة</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">عنوان الشهادة الظاهر في الترويسة *</label>
                  <input
                    className="form-control"
                    required
                    value={certForm.title}
                    onChange={e => setCertForm({ ...certForm, title: e.target.value })}
                  />
                </div>
                <div style={{
                  padding: 12,
                  background: 'rgba(59, 130, 246, 0.08)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--primary-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <Award size={18} />
                  سيتم توليد ملف PDF بتصميم رسمي يحمل اسم وشعار "مدرسة مستقبل اليمن" وإتاحته للتنزيل الفوري.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCertModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={savingCert}>
                  {savingCert ? '⏳ جارٍ توليد الـ PDF...' : '🎓 إصدار الشهادة وتوليد PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
