import React, { useState, useMemo } from 'react';
import { 
  FileDown, 
  FileSpreadsheet, 
  Printer, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  PieChart as PieIcon, 
  BarChart3, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet 
} from 'lucide-react';
import { 
  Transaction, 
  CashSettings, 
  MonthlySummary, 
  Student 
} from '../types/finance';
import { StorageService } from '../services/storageService';
import { 
  exportToPdf, 
  exportToExcel, 
  formatCurrency, 
  formatDateTR 
} from '../services/exportService';
import { FinancialPieChart, MonthlyComparisonBarChart } from './Charts';

interface ReportingTabProps {
  transactions: Transaction[];
  settings: CashSettings;
  students: Student[];
  currentCashBalance: number;
}

export const ReportingTab: React.FC<ReportingTabProps> = ({
  transactions,
  settings,
  students,
  currentCashBalance,
}) => {
  // Tarih Filtresi State'i
  // Varsayılan olarak 2026 yılının mevcut ayını kapsasın
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>('2026-10-31');
  const [activePreset, setActivePreset] = useState<string>('all-period');
  const [chartView, setChartView] = useState<'both' | 'expense' | 'income'>('both');

  // Filtre Preset Seçimi
  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    const now = new Date(2026, 9, 28); // 28 Ekim 2026
    
    if (preset === 'this-month') {
      setStartDate('2026-10-01');
      setEndDate('2026-10-31');
    } else if (preset === 'last-month') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-30');
    } else if (preset === 'last-3-months') {
      setStartDate('2026-08-01');
      setEndDate('2026-10-31');
    } else if (preset === 'this-year') {
      setStartDate('2026-01-01');
      setEndDate('2026-12-31');
    } else if (preset === 'all-period') {
      setStartDate('2026-01-01');
      setEndDate('2026-12-31');
    }
  };

  // Filtrelenmiş İşlemler
  const filteredTransactions = useMemo(() => {
    return StorageService.filterTransactionsByDate(transactions, startDate, endDate);
  }, [transactions, startDate, endDate]);

  // Ayrı Gelir ve Gider Listeleri
  const incomes = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTransactions]);

  const expenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTransactions]);

  // Toplamlar
  const totalIncome = useMemo(() => incomes.reduce((sum, i) => sum + i.amount, 0), [incomes]);
  const totalExpense = useMemo(() => expenses.reduce((sum, i) => sum + i.amount, 0), [expenses]);
  const netBalance = totalIncome - totalExpense;

  // Otomatik Aylık Özetler (Tüm işlemlerden)
  const monthlySummaries = useMemo(() => {
    return StorageService.generateMonthlySummaries(transactions);
  }, [transactions]);

  // Export İşlemleri
  const handleExportPdf = () => {
    exportToPdf(incomes, expenses, settings, startDate, endDate, currentCashBalance);
  };

  const handleExportExcel = () => {
    exportToExcel(incomes, expenses, settings, startDate, endDate, currentCashBalance, students);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. KONTROL ÇUBUĞU: Tarih Filtresi & Dışa Aktarma Butonları */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Sol: Tarih Aralığı Seçimi */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Rapor Tarih Aralığı
              </span>
            </div>

            {/* Hızlı Preset Butonları */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => applyPreset('this-month')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  activePreset === 'this-month' 
                    ? 'bg-slate-900 text-white font-semibold' 
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Ekim 2026 (Bu Ay)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('last-month')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  activePreset === 'last-month' 
                    ? 'bg-slate-900 text-white font-semibold' 
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Eylül 2026 (Geçen Ay)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('last-3-months')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  activePreset === 'last-3-months' 
                    ? 'bg-slate-900 text-white font-semibold' 
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Son 3 Ay
              </button>
              <button
                type="button"
                onClick={() => applyPreset('all-period')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  activePreset === 'all-period' 
                    ? 'bg-slate-900 text-white font-semibold' 
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Tüm Dönem
              </button>
            </div>

            {/* İki Tarih Aralığı Inputları */}
            <div className="flex items-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                <span className="text-slate-500 font-medium">Başlangıç:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActivePreset('custom');
                  }}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-hidden"
                />
              </div>

              <span className="text-slate-400 font-bold">-</span>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                <span className="text-slate-500 font-medium">Bitiş:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActivePreset('custom');
                  }}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Sağ: Dışa Aktarma Butonları (PDF, Excel, Yazdır) */}
          <div className="flex items-center gap-2 self-start lg:self-center flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleExportPdf}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>PDF Raporu İndir</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Formatında İndir</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DÖNEM ÖZET KARTLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Toplam Gelir */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Dönem Geliri
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono-numbers text-emerald-700">
            +{formatCurrency(totalIncome)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {incomes.length} adet gelir tahsilatı
          </p>
        </div>

        {/* Toplam Gider */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Dönem Gideri
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono-numbers text-rose-700">
            -{formatCurrency(totalExpense)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {expenses.length} adet gider harcaması
          </p>
        </div>

        {/* Net Dönem Farkı (Kar/Zarar) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Net Dönem Farkı
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className={`mt-2 text-xl font-bold font-mono-numbers ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {netBalance >= 0 ? 'Dönem kar / artı bakiye ile kapandı' : 'Dönem gideri geliri aştı'}
          </p>
        </div>

        {/* Anlık Kasa Durumu */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Canlı Kasa Bakiyesi
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono-numbers text-white">
            {formatCurrency(currentCashBalance)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Başlangıç + Tüm Zamanlar Net
          </p>
        </div>
      </div>

      {/* 3. GÖRSEL GRAFİKLER BÖLÜMÜ (Aylık Gelir - Gider Pasta & Trend Grafikleri) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Görsel Dağılım ve Trend Analizi ({formatDateTR(startDate)} - {formatDateTR(endDate)})
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gider Dağılımı Pasta Grafiği */}
          <FinancialPieChart
            transactions={filteredTransactions}
            type="expense"
            title="Dönem Gider Kalemleri Dağılımı"
          />

          {/* Gelir Dağılımı Pasta Grafiği */}
          <FinancialPieChart
            transactions={filteredTransactions}
            type="income"
            title="Dönem Gelir Kalemleri Dağılımı"
          />
        </div>

        {/* Aylık Karşılaştırma Grafiği */}
        <MonthlyComparisonBarChart summaries={monthlySummaries} />
      </div>

      {/* 4. HER AY İÇİN OTOMATİK ÖZET OLUŞTURULSUN (İstenen Özellik) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Otomatik Aylık Özet Tablosu</h3>
            <p className="text-xs text-slate-500">
              Sistem her ay için otomatik özet hesaplamıştır. İlgili aya tıklayarak filtreleyebilirsiniz.
            </p>
          </div>
          <span className="text-xs font-mono-numbers text-slate-500">
            {monthlySummaries.length} Ay Kayıtlı
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-2.5 px-3">Dönem / Ay</th>
                <th className="py-2.5 px-3 text-center">İşlem Adedi</th>
                <th className="py-2.5 px-3 text-right text-emerald-800">Aylık Toplam Gelir</th>
                <th className="py-2.5 px-3 text-right text-rose-800">Aylık Toplam Gider</th>
                <th className="py-2.5 px-3 text-right">Aylık Net Bakiye</th>
                <th className="py-2.5 px-3 text-center">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlySummaries.map((m) => {
                const isPositive = m.net >= 0;
                return (
                  <tr key={m.monthKey} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {m.monthLabel}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600 font-mono-numbers">
                      {m.incomeCount} Gelir / {m.expenseCount} Gider
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono-numbers text-emerald-700">
                      +{formatCurrency(m.totalIncome)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono-numbers text-rose-700">
                      -{formatCurrency(m.totalExpense)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold font-mono-numbers ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isPositive ? '+' : ''}{formatCurrency(m.net)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const [year, month] = m.monthKey.split('-');
                          const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
                          setStartDate(`${m.monthKey}-01`);
                          setEndDate(`${m.monthKey}-${lastDay < 10 ? '0' + lastDay : lastDay}`);
                          setActivePreset('custom');
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        Bu Ayı İncele
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. İKİ AYRI TABLO: GELİR KALEMLERİ VE GİDER KALEMLERİ (Altta Toplamlar ve Net ile) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* --- TABLO 1: GELİRLER TABLOSU --- */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Gelir Kalemleri Tablosu
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {incomes.length} Kalem
              </span>
            </div>

            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-white shadow-xs">
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2 px-2">Tarih</th>
                    <th className="py-2 px-2">Kategori</th>
                    <th className="py-2 px-2">Açıklama / Öğrenci</th>
                    <th className="py-2 px-2">Ödeme</th>
                    <th className="py-2 px-2 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incomes.map((inc) => (
                    <tr key={inc.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-2 px-2 whitespace-nowrap text-slate-500 font-medium">
                        {formatDateTR(inc.date)}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap font-semibold text-slate-800">
                        {inc.category}
                      </td>
                      <td className="py-2 px-2 text-slate-600 max-w-[160px] truncate" title={`${inc.description} ${inc.counterparty ? '(' + inc.counterparty + ')' : ''}`}>
                        {inc.counterparty ? (
                          <span className="font-medium text-slate-800">{inc.counterparty} </span>
                        ) : null}
                        {inc.description || '-'}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap text-slate-500 text-[11px]">
                        {inc.paymentMethod}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap font-bold font-mono-numbers text-emerald-700">
                        +{formatCurrency(inc.amount)}
                      </td>
                    </tr>
                  ))}

                  {incomes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                        Bu tarih aralığında gelir kaydı bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alt Toplam - Gelir */}
          <div className="mt-4 pt-3 border-t-2 border-emerald-200 flex items-center justify-between bg-emerald-50/50 p-3 rounded-xl">
            <span className="text-xs font-bold text-emerald-900 uppercase">
              TOPLAM GELİR
            </span>
            <span className="text-sm sm:text-base font-extrabold font-mono-numbers text-emerald-700">
              +{formatCurrency(totalIncome)}
            </span>
          </div>
        </div>

        {/* --- TABLO 2: GİDER KALEMLERİ --- */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Gider Kalemleri Tablosu
                </h3>
              </div>
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                {expenses.length} Kalem
              </span>
            </div>

            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-white shadow-xs">
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2 px-2">Tarih</th>
                    <th className="py-2 px-2">Kategori</th>
                    <th className="py-2 px-2">Açıklama / Alıcı</th>
                    <th className="py-2 px-2">Ödeme</th>
                    <th className="py-2 px-2 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-rose-50/40 transition-colors">
                      <td className="py-2 px-2 whitespace-nowrap text-slate-500 font-medium">
                        {formatDateTR(exp.date)}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap font-semibold text-slate-800">
                        {exp.category}
                      </td>
                      <td className="py-2 px-2 text-slate-600 max-w-[160px] truncate" title={`${exp.description} ${exp.counterparty ? '(' + exp.counterparty + ')' : ''}`}>
                        {exp.counterparty ? (
                          <span className="font-medium text-slate-800">{exp.counterparty} </span>
                        ) : null}
                        {exp.description || '-'}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap text-slate-500 text-[11px]">
                        {exp.paymentMethod}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap font-bold font-mono-numbers text-rose-700">
                        -{formatCurrency(exp.amount)}
                      </td>
                    </tr>
                  ))}

                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                        Bu tarih aralığında gider kaydı bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alt Toplam - Gider */}
          <div className="mt-4 pt-3 border-t-2 border-rose-200 flex items-center justify-between bg-rose-50/50 p-3 rounded-xl">
            <span className="text-xs font-bold text-rose-900 uppercase">
              TOPLAM GİDER
            </span>
            <span className="text-sm sm:text-base font-extrabold font-mono-numbers text-rose-700">
              -{formatCurrency(totalExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* 6. EN ALT: KONSOLİDE DÖNEM VE KASA RAPORU SONUCU */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Dönem Mali Konsolidasyon Özeti ({formatDateTR(startDate)} - {formatDateTR(endDate)})
            </h4>
            <p className="text-xs text-slate-500">
              Seçilen tarihler arasındaki net nakit akışı ve dönem sonu genel kasa bakiyesi
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs sm:text-sm font-mono-numbers flex-wrap">
            <div>
              <span className="text-slate-500 block text-[11px]">Toplam Gelir</span>
              <span className="font-bold text-emerald-700">+{formatCurrency(totalIncome)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Toplam Gider</span>
              <span className="font-bold text-rose-700">-{formatCurrency(totalExpense)}</span>
            </div>
            <div className="pl-4 border-l border-slate-200">
              <span className="text-slate-500 block text-[11px]">Net Dönem Farkı</span>
              <span className={`font-extrabold text-base ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
