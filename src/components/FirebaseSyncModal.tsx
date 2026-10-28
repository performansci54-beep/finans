import React, { useState } from 'react';
import { Cloud, CheckCircle, RefreshCw, Database, ShieldCheck, X } from 'lucide-react';
import { FirebaseSyncAdapter, getSyncMetadata, saveSyncMetadata } from '../services/firebaseSyncService';
import { Transaction, Student, CashSettings, CategoryItem } from '../types/finance';

interface FirebaseSyncModalProps {
  onClose: () => void;
  fullData: {
    transactions: Transaction[];
    students: Student[];
    settings: CashSettings;
    categories: { income: CategoryItem[]; expense: CategoryItem[] };
  };
}

export const FirebaseSyncModal: React.FC<FirebaseSyncModalProps> = ({ onClose, fullData }) => {
  const [syncMeta, setSyncMeta] = useState(getSyncMetadata());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestSync = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await FirebaseSyncAdapter.syncAllData(fullData);
      setTestResult(res.message);
      setSyncMeta(getSyncMetadata());
    } catch (err: any) {
      setTestResult('Hata: ' + (err?.message || 'Bilinmeyen hata'));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6">
        
        {/* Başlık */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Firebase Bulut Senkronizasyon Durumu
              </h3>
              <p className="text-xs text-slate-500">
                Yerel depolama ve bulut hazır mimarisi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mevcut Durum */}
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Çalışma Modu:</span>
            <span className="text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md">
              Yerel Öncelikli (Local-First Offline)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Yerel İşlem Sayısı:</span>
            <span className="text-xs font-bold font-mono-numbers text-slate-900">
              {fullData.transactions.length} Kayıt
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Öğrenci Sayısı:</span>
            <span className="text-xs font-bold font-mono-numbers text-slate-900">
              {fullData.students.length} Kayıt
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Son Senkronizasyon:</span>
            <span className="text-xs font-mono-numbers text-slate-700">
              {syncMeta.lastSyncedAt ? new Date(syncMeta.lastSyncedAt).toLocaleString('tr-TR') : 'Henüz senkronize edilmedi'}
            </span>
          </div>
        </div>

        {/* Bilgilendirme ve Mimari */}
        <div className="mt-4 space-y-2 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>Tam Uyumlu Şema:</strong> Tüm gelir/gider kalemleri, kategoriler, öğrenci taksitleri ve kasa ayarları Firestore döküman formatına uygun olarak kurgulanmıştır.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>Kesintisiz Çalışma:</strong> Veriler tarayıcınızın güvenli yerel belleğinde saklanır; internet bağlantısı olmasa bile tüm raporlama ve kasa işlemleri anında çalışır.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Database className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <p>
              <strong>Bulut Geçişi:</strong> İleride çoklu kullanıcı ve cihazlar arası canlı eşitleme gerektiğinde, Firebase Firestore modülü tek tıkla devreye alınabilir.
            </p>
          </div>
        </div>

        {testResult && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
            ✓ {testResult}
          </div>
        )}

        {/* Butonlar */}
        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleTestSync}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Hazırlanıyor...' : 'Senkronizasyon Kuyruğunu Test Et'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
          >
            Tamam
          </button>
        </div>

      </div>
    </div>
  );
};
