import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Check, 
  X, 
  Calendar, 
  CreditCard, 
  User, 
  FileText, 
  Filter 
} from 'lucide-react';
import { 
  Transaction, 
  CategoryItem, 
  PaymentMethod, 
  TransactionType, 
  Student 
} from '../types/finance';
import { formatCurrency, formatDateTR } from '../services/exportService';

interface DataEntryTabProps {
  transactions: Transaction[];
  categories: { income: CategoryItem[]; expense: CategoryItem[] };
  students: Student[];
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdateTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onPayInstallment: (studentId: string, installmentNo: number, method: PaymentMethod, date: string, amount: number) => void;
}

export const DataEntryTab: React.FC<DataEntryTabProps> = ({
  transactions,
  categories,
  students,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onPayInstallment,
}) => {
  // Form State
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<string>('Kira (Kurs Binası)');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [counterparty, setCounterparty] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Banka Havalesi / EFT');
  const [description, setDescription] = useState<string>('');
  const [isQuickStudentPayment, setIsQuickStudentPayment] = useState<boolean>(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedInstallmentNo, setSelectedInstallmentNo] = useState<number>(1);

  // Edit State
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Filter State for Transactions Table
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Handle Type Change
  const handleTypeChange = (newType: TransactionType) => {
    setFormType(newType);
    if (newType === 'expense') {
      setCategory(categories.expense[0]?.name || 'Kira (Kurs Binası)');
      setIsQuickStudentPayment(false);
    } else {
      setCategory(categories.income[0]?.name || 'Öğrenci Taksit Ödemesi');
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/,/g, '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Lütfen geçerli bir tutar giriniz.');
      return;
    }

    if (editingTx) {
      onUpdateTransaction({
        ...editingTx,
        type: formType,
        category,
        amount: numAmount,
        date,
        counterparty: counterparty.trim() || undefined,
        paymentMethod,
        description: description.trim(),
      });
      setEditingTx(null);
    } else if (isQuickStudentPayment && selectedStudentId) {
      onPayInstallment(selectedStudentId, selectedInstallmentNo, paymentMethod, date, numAmount);
    } else {
      onAddTransaction({
        type: formType,
        category,
        amount: numAmount,
        date,
        counterparty: counterparty.trim() || undefined,
        paymentMethod,
        description: description.trim(),
      });
    }

    // Reset fields
    setAmount('');
    setDescription('');
    setCounterparty('');
    setIsQuickStudentPayment(false);
  };

  const handleStartEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setCategory(tx.category);
    setAmount(tx.amount.toString());
    setDate(tx.date);
    setCounterparty(tx.counterparty || '');
    setPaymentMethod(tx.paymentMethod);
    setDescription(tx.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTx(null);
    setAmount('');
    setDescription('');
    setCounterparty('');
  };

  // Filtered List
  const filteredList = transactions.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      const matchPerson = t.counterparty?.toLowerCase().includes(q);
      const matchAmt = t.amount.toString().includes(q);
      return matchDesc || matchCat || matchPerson || matchAmt;
    }
    return true;
  });

  const activeCategories = formType === 'income' ? categories.income : categories.expense;
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const unpaidInstallments = selectedStudent?.installments.filter(i => !i.isPaid) || [];

  return (
    <div className="space-y-6">
      
      {/* 1. ÜST KART: Yeni Veri Girişi Formu */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {editingTx ? 'İşlemi Düzenle' : 'Yeni Gelir / Gider Kaydı Girişi'}
            </h2>
            <p className="text-xs text-slate-500">
              {editingTx 
                ? 'İşlem bilgilerini güncelleyin ve kaydedin' 
                : 'Kurs harcamaları veya tahsilatlarını girerek anlık kasayı güncelleyin'}
            </p>
          </div>

          {/* Gelir / Gider Seçim Segmenti */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                formType === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Gider Girişi</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                formType === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Gelir Girişi</span>
            </button>
          </div>
        </div>

        {/* Hızlı Öğrenci Taksit Tahsilatı Toggle (Sadece Gelir modunda) */}
        {formType === 'income' && !editingTx && (
          <div className="mt-4 p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-emerald-900 font-medium">
              💡 Kayıtlı bir öğrencinin taksitini tahsil etmek ister misiniz?
            </div>
            <button
              type="button"
              onClick={() => {
                const nextState = !isQuickStudentPayment;
                setIsQuickStudentPayment(nextState);
                if (nextState && students.length > 0) {
                  setSelectedStudentId(students[0].id);
                  const firstUnpaid = students[0].installments.find(i => !i.isPaid);
                  if (firstUnpaid) {
                    setSelectedInstallmentNo(firstUnpaid.installmentNo);
                    setAmount(firstUnpaid.amount.toString());
                    setDescription(`${students[0].fullName} - ${firstUnpaid.installmentNo}. Taksit Tahsilatı`);
                    setCounterparty(students[0].fullName);
                  }
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isQuickStudentPayment 
                  ? 'bg-emerald-700 text-white' 
                  : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {isQuickStudentPayment ? 'Öğrenci Taksit Modu Aktif (Kapat)' : 'Öğrenci Taksitlerinden Seç'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Öğrenci Taksit Seçicisi (Aktifse) */}
          {isQuickStudentPayment && formType === 'income' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Öğrenci Seçin
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    const sId = e.target.value;
                    setSelectedStudentId(sId);
                    const s = students.find(item => item.id === sId);
                    if (s) {
                      const firstUnpaid = s.installments.find(i => !i.isPaid);
                      if (firstUnpaid) {
                        setSelectedInstallmentNo(firstUnpaid.installmentNo);
                        setAmount(firstUnpaid.amount.toString());
                        setDescription(`${s.fullName} - ${firstUnpaid.installmentNo}. Taksit`);
                      }
                      setCounterparty(s.fullName);
                    }
                  }}
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {students.map(s => {
                    const unpaidCount = s.installments.filter(i => !i.isPaid).length;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.courseClass}) - Kalan: {unpaidCount} Taksit
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tahsil Edilecek Taksit No
                </label>
                <select
                  value={selectedInstallmentNo}
                  onChange={(e) => {
                    const instNo = parseInt(e.target.value, 10);
                    setSelectedInstallmentNo(instNo);
                    const inst = selectedStudent?.installments.find(i => i.installmentNo === instNo);
                    if (inst) {
                      setAmount(inst.amount.toString());
                      setDescription(`${selectedStudent?.fullName} - ${instNo}. Taksit Tahsilatı`);
                    }
                  }}
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {unpaidInstallments.map(i => (
                    <option key={i.id} value={i.installmentNo}>
                      {i.installmentNo}. Taksit ({formatCurrency(i.amount)}) - Vade: {formatDateTR(i.dueDate)}
                    </option>
                  ))}
                  {unpaidInstallments.length === 0 && (
                    <option value="">Bu öğrencinin tüm taksitleri ödenmiş!</option>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Ana Giriş Alanları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Tutar */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tutar (TL) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-sm font-bold font-mono-numbers bg-slate-50 border border-slate-300 rounded-lg pl-3 pr-8 py-2.5 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
                <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-500">
                  ₺
                </span>
              </div>
            </div>

            {/* 2. Kategori */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kalem / Kategori *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                {activeCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Tarih */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                İşlem Tarihi *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg pl-3 pr-2 py-2.5 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* 4. Ödeme Yöntemi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ödeme Yöntemi
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="Nakit">Nakit (Kasa Giriş/Çıkış)</option>
                <option value="Banka Havalesi / EFT">Banka Havalesi / EFT</option>
                <option value="Kredi Kartı / POS">Kredi Kartı / POS</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>
          </div>

          {/* İkincil Alanlar: İlgili Kişi & Açıklama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {formType === 'income' ? 'Öğrenci / Veli / Muhatap Adı' : 'Alıcı / Personel / Kurum Adı'}
              </label>
              <input
                type="text"
                placeholder={formType === 'income' ? 'Örn: Ahmet Yılmaz veya Genel Satış' : 'Örn: Matematik Öğretmeni, Enerji Dağıtım A.Ş.'}
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Açıklama / Not
              </label>
              <input
                type="text"
                placeholder="Örn: 2026 Ekim ayı kira bedeli, TYT deneme kitapçıkları baskısı vb."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Butonlar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {editingTx && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                İptal Et
              </button>
            )}
            <button
              type="submit"
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow-sm ${
                formType === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{editingTx ? 'Değişiklikleri Kaydet' : formType === 'income' ? 'Geliri Kasaya Ekle' : 'Gideri Kasadan Düş'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. ALT KART: Son Hareketler ve Veri Yönetimi Tablosu */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Kasa Hareketleri Listesi</h3>
            <p className="text-xs text-slate-500">
              Girilen tüm gelir ve gider kayıtlarını arayabilir, düzenleyebilir veya silebilirsiniz ({filteredList.length} işlem)
            </p>
          </div>

          {/* Arama ve Filtreleme */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="İşlem veya kişi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-2 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Tip Filtresi */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('income')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  typeFilter === 'income' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gelirler
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('expense')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  typeFilter === 'expense' ? 'bg-rose-50 text-rose-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Giderler
              </button>
            </div>
          </div>
        </div>

        {/* Tablo */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-3">Tarih</th>
                <th className="py-3 px-3">Tür</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Açıklama</th>
                <th className="py-3 px-3">Muhatap / Kişi</th>
                <th className="py-3 px-3">Ödeme Şekli</th>
                <th className="py-3 px-3 text-right">Tutar</th>
                <th className="py-3 px-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((tx) => {
                const isIncome = tx.type === 'income';

                return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    {/* Tarih */}
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-600">
                      {formatDateTR(tx.date)}
                    </td>

                    {/* Tür */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                        isIncome ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {isIncome ? (
                          <>
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>Gelir</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Gider</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Kategori */}
                    <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-800">
                      {tx.category}
                    </td>

                    {/* Açıklama */}
                    <td className="py-3 px-3 text-slate-600 max-w-[240px] truncate" title={tx.description}>
                      {tx.description || '-'}
                    </td>

                    {/* Muhatap */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-700 font-medium">
                      {tx.counterparty || '-'}
                    </td>

                    {/* Ödeme Yöntemi */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                      {tx.paymentMethod}
                    </td>

                    {/* Tutar */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-bold font-mono-numbers text-sm">
                      <span className={isIncome ? 'text-emerald-700' : 'text-rose-700'}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </td>

                    {/* Aksiyonlar */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(tx)}
                          title="Düzenle"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Bu işlemi silmek istediğinize emin misiniz? Kasa bakiyesi güncellenecektir.')) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          title="Sil"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Aranan kriterlere uygun işlem kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
