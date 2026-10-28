import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Phone, 
  GraduationCap, 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  Check, 
  RotateCcw 
} from 'lucide-react';
import { Student, PaymentMethod } from '../types/finance';
import { formatCurrency, formatDateTR } from '../services/exportService';

interface StudentInstallmentsTabProps {
  students: Student[];
  onAddStudent: (data: Omit<Student, 'id' | 'installments'>, intervalMonths?: number) => void;
  onPayInstallment: (studentId: string, installmentNo: number, method: PaymentMethod, date: string, amount: number) => void;
  onRevertInstallment: (studentId: string, installmentNo: number) => void;
}

export const StudentInstallmentsTab: React.FC<StudentInstallmentsTabProps> = ({
  students,
  onAddStudent,
  onPayInstallment,
  onRevertInstallment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(students[0]?.id || null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Tahsilat Modal State
  const [payingStudent, setPayingStudent] = useState<{
    student: Student;
    installmentNo: number;
    amount: number;
  } | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Banka Havalesi / EFT');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState<string>('');

  // Yeni Öğrenci Form State
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newClass, setNewClass] = useState('12. Sınıf Sayısal YKS');
  const [newTotalFee, setNewTotalFee] = useState('');
  const [newInstallmentCount, setNewInstallmentCount] = useState(6);
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);

  const handleOpenPayModal = (student: Student, installmentNo: number, defaultAmount: number) => {
    setPayingStudent({ student, installmentNo, amount: defaultAmount });
    setPayAmount(defaultAmount.toString());
    setPayDate(new Date().toISOString().split('T')[0]);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingStudent) return;
    const num = parseFloat(payAmount.replace(/,/g, '.'));
    if (isNaN(num) || num <= 0) {
      alert('Lütfen geçerli bir tutar girin.');
      return;
    }

    onPayInstallment(
      payingStudent.student.id,
      payingStudent.installmentNo,
      payMethod,
      payDate,
      num
    );
    setPayingStudent(null);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const fee = parseFloat(newTotalFee.replace(/,/g, '.'));
    if (!newFullName || isNaN(fee) || fee <= 0) {
      alert('Lütfen öğrenci adını ve geçerli toplam kurs ücretini girin.');
      return;
    }

    onAddStudent({
      fullName: newFullName.trim(),
      phone: newPhone.trim(),
      courseClass: newClass.trim(),
      totalFee: fee,
      installmentCount: Number(newInstallmentCount),
      startDate: newStartDate,
    });

    setShowAddModal(false);
    setNewFullName('');
    setNewPhone('');
    setNewTotalFee('');
  };

  const filteredStudents = students.filter(s => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return s.fullName.toLowerCase().includes(q) || s.courseClass.toLowerCase().includes(q) || s.phone.includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Üst Başlık & Aksiyon */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Öğrenci Taksit Takip ve Tahsilat Paneli
          </h2>
          <p className="text-xs text-slate-500">
            Kayıtlı öğrencilerin aylık taksit planlarını yönetin, tek tıkla tahsilat yapıp doğrudan kasaya işleyin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Öğrenci veya sınıf ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-2 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Yeni Öğrenci Ekle</span>
          </button>
        </div>
      </div>

      {/* Öğrenci Listesi */}
      <div className="space-y-4">
        {filteredStudents.map(student => {
          const isExpanded = expandedStudentId === student.id;
          const paidAmount = student.installments
            .filter(i => i.isPaid)
            .reduce((sum, i) => sum + i.amount, 0);
          const remainingAmount = student.totalFee - paidAmount;
          const paidCount = student.installments.filter(i => i.isPaid).length;
          const progressPercent = Math.min(Math.round((paidAmount / student.totalFee) * 100), 100);

          return (
            <div
              key={student.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs transition-all"
            >
              {/* Başlık Kartı */}
              <div
                onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {student.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{student.fullName}</h3>
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {student.courseClass}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {student.phone}
                      </span>
                      <span>·</span>
                      <span>{paidCount} / {student.installmentCount} Taksit Ödendi</span>
                    </div>
                  </div>
                </div>

                {/* İlerleme ve Tutar */}
                <div className="flex items-center gap-6 justify-between md:justify-end">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Toplam / Kalan</div>
                    <div className="text-sm font-bold font-mono-numbers text-slate-900">
                      {formatCurrency(student.totalFee)}
                    </div>
                    <div className="text-xs font-mono-numbers font-medium text-purple-700">
                      Kalan: {formatCurrency(remainingAmount)}
                    </div>
                  </div>

                  {/* İlerleme Çubuğu */}
                  <div className="w-24 hidden sm:block">
                    <div className="flex justify-between text-[10px] font-mono-numbers text-slate-500 mb-1">
                      <span>Tahsilat</span>
                      <span>%{progressPercent}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-2 text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label="Detayları Göster"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Açılabilir Taksit Detay Tablosu */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Ödeme Planı ve Taksit Durumları
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {student.installments.map((inst) => {
                      return (
                        <div
                          key={inst.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            inst.isPaid
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                            <span className="text-xs font-bold text-slate-800">
                              {inst.installmentNo}. Taksit
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                              inst.isPaid ? 'text-emerald-700' : 'text-amber-700'
                            }`}>
                              {inst.isPaid ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Ödendi</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Bekliyor</span>
                                </>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Vade Tarihi:</span>
                            <span className="font-medium text-slate-700">{formatDateTR(inst.dueDate)}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-slate-500">Tutar:</span>
                            <span className="font-bold font-mono-numbers text-slate-900 text-sm">
                              {formatCurrency(inst.amount)}
                            </span>
                          </div>

                          {inst.isPaid && inst.paidDate && (
                            <div className="text-[10px] text-emerald-800 font-medium mt-1">
                              Ödeme Tarihi: {formatDateTR(inst.paidDate)}
                            </div>
                          )}

                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                            {inst.isPaid ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm('Bu taksitin ödeme kaydını geri almak istediğinize emin misiniz?')) {
                                    onRevertInstallment(student.id, inst.installmentNo);
                                  }
                                }}
                                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 transition-colors"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Geri Al</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenPayModal(student, inst.installmentNo, inst.amount)}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Tahsil Et & Kasaya Ekle</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredStudents.length === 0 && (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-400 text-xs">
            Kayıtlı öğrenci bulunamadı. Yeni bir öğrenci ekleyerek başlayabilirsiniz.
          </div>
        )}
      </div>

      {/* --- TAHSİLAT MODALI --- */}
      {payingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Taksit Tahsilatı Yap
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              <strong className="text-slate-800">{payingStudent.student.fullName}</strong> için{' '}
              {payingStudent.installmentNo}. taksit ödemesi kasaya işlenecektir.
            </p>

            <form onSubmit={handleConfirmPayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tahsil Edilen Tutar (TL)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full text-base font-bold font-mono-numbers bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ödeme Yöntemi
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden"
                >
                  <option value="Nakit">Nakit</option>
                  <option value="Banka Havalesi / EFT">Banka Havalesi / EFT</option>
                  <option value="Kredi Kartı / POS">Kredi Kartı / POS</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ödeme Tarihi
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingStudent(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Kasaya İşle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- YENİ ÖĞRENCİ EKLE MODALI --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Yeni Öğrenci ve Taksit Planı Ekle
            </h3>

            <form onSubmit={handleCreateStudent} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Öğrenci Adı Soyadı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Selin Kaya"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    İletişim Telefonu
                  </label>
                  <input
                    type="text"
                    placeholder="05XX XXX XX XX"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sınıf / Bölüm / Program
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: 12. Sınıf Sayısal YKS, LGS VIP vb."
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Toplam Kurs Sözleşme Ücreti (TL) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="48000"
                    value={newTotalFee}
                    onChange={(e) => setNewTotalFee(e.target.value)}
                    className="w-full text-xs font-bold font-mono-numbers bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Taksit Sayısı
                  </label>
                  <select
                    value={newInstallmentCount}
                    onChange={(e) => setNewInstallmentCount(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 9, 10, 12].map(n => (
                      <option key={n} value={n}>{n} Taksit</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    İlk Taksit / Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Öğrenciyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
