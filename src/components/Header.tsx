import React from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Settings, 
  Cloud, 
  GraduationCap, 
  FileSpreadsheet, 
  PlusCircle 
} from 'lucide-react';
import { formatCurrency } from '../services/exportService';
import { CashSettings } from '../types/finance';

interface HeaderProps {
  settings: CashSettings;
  cashBalance: {
    initialBalance: number;
    totalIncome: number;
    totalExpense: number;
    currentBalance: number;
  };
  activeTab: 'data-entry' | 'reports' | 'installments';
  setActiveTab: (tab: 'data-entry' | 'reports' | 'installments') => void;
  onOpenSettings: () => void;
  onOpenSyncModal: () => void;
  onOpenQuickIncome: () => void;
  onOpenQuickExpense: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  cashBalance,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenSyncModal,
  onOpenQuickIncome,
  onOpenQuickExpense,
}) => {
  const isPositive = cashBalance.currentBalance >= 0;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Üst Bant: Marka ve Kasa Özeti */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Sol: Kurs Adı & Rozet */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <GraduationCap className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight whitespace-nowrap">
                {settings.institutionName}
              </h1>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
                Kasa & Maliye
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Gelir-Gider, Taksit Takibi ve Kasa Yönetimi
            </p>
          </div>
        </div>

        {/* Sağ: Canlı Güncel Kasa Değeri & Hızlı Butonlar */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-between md:justify-end">
          
          {/* Canlı Kasa Kartı */}
          <div 
            onClick={onOpenSettings}
            title="Kasa başlangıç bakiyesini ve ayarları düzenlemek için tıklayın"
            className="group cursor-pointer flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900 text-white transition-all hover:bg-slate-800 shadow-sm"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                <span>GÜNCEL KASA BAKİYESİ</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-sm sm:text-base font-bold font-mono-numbers tracking-tight">
                {formatCurrency(cashBalance.currentBalance, settings.currency)}
              </div>
            </div>
          </div>

          {/* Ayarlar ve Senkronizasyon Butonları */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenSyncModal}
              title="Firebase Bulut Senkronizasyon Durumu"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              aria-label="Bulut Senkronizasyonu"
            >
              <Cloud className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSettings}
              title="Kasa Ayarları & Yedekleme"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              aria-label="Kasa Ayarları"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Alt Bant: Ana Sekmeler (Tablar) ve Hızlı Ekle Aksiyonları */}
      <div className="bg-slate-50/80 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          
          {/* Sekmeler (Tabs) */}
          <nav className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl max-w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab('data-entry')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'data-entry'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Veri Girişi & İşlemler</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'reports'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Raporlama & Analiz</span>
            </button>

            <button
              onClick={() => setActiveTab('installments')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'installments'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
              <span>Öğrenci Taksitleri</span>
            </button>
          </nav>

          {/* Hızlı Gelir / Gider Ekle Butonları */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenQuickIncome}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200/90 rounded-lg transition-colors shadow-xs"
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Gelir Ekle</span>
            </button>
            <button
              onClick={onOpenQuickExpense}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-100/90 hover:bg-rose-200/90 rounded-lg transition-colors shadow-xs"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Gider Ekle</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
