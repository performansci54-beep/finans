import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Download, Upload, X } from 'lucide-react';
import { CashSettings } from '../types/finance';
import { formatCurrency } from '../services/exportService';

interface CashSettingsModalProps {
  settings: CashSettings;
  currentCalculatedBalance: number;
  onSaveSettings: (settings: CashSettings) => void;
  onResetDefaults: () => void;
  onExportJsonBackup: () => void;
  onImportJsonBackup: (jsonStr: string) => void;
  onClose: () => void;
}

export const CashSettingsModal: React.FC<CashSettingsModalProps> = ({
  settings,
  currentCalculatedBalance,
  onSaveSettings,
  onResetDefaults,
  onExportJsonBackup,
  onImportJsonBackup,
  onClose,
}) => {
  const [instName, setInstName] = useState(settings.institutionName);
  const [initialBalance, setInitialBalance] = useState(settings.initialBalance.toString());
  const [initialDate, setInitialDate] = useState(settings.initialBalanceDate);
  const [currency, setCurrency] = useState(settings.currency || '₺');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(initialBalance.replace(/,/g, '.'));
    if (isNaN(num)) {
      alert('Lütfen geçerli bir başlangıç bakiyesi giriniz.');
      return;
    }

    onSaveSettings({
      institutionName: instName.trim() || 'Dershane Finans Takibi',
      initialBalance: num,
      initialBalanceDate: initialDate,
      currency,
    });
    onClose();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportJsonBackup(content);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6">
        
        {/* Başlık */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Kasa & Kurum Ayarları</h3>
              <p className="text-xs text-slate-500">Kasa başlangıç değerleri ve genel tercihler</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dershane / Kurs Adı
            </label>
            <input
              type="text"
              required
              value={instName}
              onChange={(e) => setInstName(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kasa Başlangıç Bakiyesi ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full text-sm font-bold font-mono-numbers bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Sisteme ilk başlarken kasada olan devir tutarı
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kasa Devir / Başlangıç Tarihi
              </label>
              <input
                type="date"
                required
                value={initialDate}
                onChange={(e) => setInitialDate(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Mevcut Hesaplama Özeti */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
            <span className="text-slate-600">Şu Anki Canlı Kasa Bakiyesi:</span>
            <span className="font-bold font-mono-numbers text-slate-900 text-sm">
              {formatCurrency(currentCalculatedBalance, currency)}
            </span>
          </div>

          {/* Form Butonları */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Kapat
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Ayarları Kaydet</span>
            </button>
          </div>
        </form>

        {/* Yedekleme & Sıfırlama Bölümü */}
        <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Veri Yedekleme ve Sıfırlama
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onExportJsonBackup}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tüm Verileri Yedekle (JSON)</span>
            </button>

            <label className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Yedekten Geri Yükle</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Tüm verileri varsayılan örnek dershane verilerine sıfırlamak istiyor musunuz?')) {
                  onResetDefaults();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Örnek Dershane Verilerine Sıfırla</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
