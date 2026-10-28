/**
 * Dershane & Kurs Gelir-Gider, Taksit ve Kasa Takip Sistemi
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { 
  Transaction, 
  Student, 
  CashSettings, 
  CategoryItem, 
  PaymentMethod 
} from './types/finance';
import { Header } from './components/Header';
import { DataEntryTab } from './components/DataEntryTab';
import { ReportingTab } from './components/ReportingTab';
import { StudentInstallmentsTab } from './components/StudentInstallmentsTab';
import { CashSettingsModal } from './components/CashSettingsModal';
import { FirebaseSyncModal } from './components/FirebaseSyncModal';

export default function App() {
  // Veri Durumları
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<CashSettings>(StorageService.getSettings());
  const [categories, setCategories] = useState(StorageService.getCategories());
  const [isLoaded, setIsLoaded] = useState(false);

  // Navigasyon & Modal Durumları
  const [activeTab, setActiveTab] = useState<'data-entry' | 'reports' | 'installments'>('data-entry');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // İlk Yükleme
  useEffect(() => {
    const loadedSettings = StorageService.getSettings();
    const loadedTx = StorageService.getTransactions();
    const loadedStudents = StorageService.getStudents();
    const loadedCats = StorageService.getCategories();

    setSettings(loadedSettings);
    setTransactions(loadedTx);
    setStudents(loadedStudents);
    setCategories(loadedCats);
    setIsLoaded(true);
  }, []);

  // Canlı Kasa Hesabı
  const cashBalance = StorageService.calculateLiveCashBalance(transactions);

  // İşlem Ekleme
  const handleAddTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx = StorageService.addTransaction(txData);
    setTransactions(StorageService.getTransactions());
  };

  // İşlem Güncelleme
  const handleUpdateTransaction = (tx: Transaction) => {
    StorageService.updateTransaction(tx);
    setTransactions(StorageService.getTransactions());
  };

  // İşlem Silme
  const handleDeleteTransaction = (id: string) => {
    StorageService.deleteTransaction(id);
    setTransactions(StorageService.getTransactions());
    setStudents(StorageService.getStudents());
  };

  // Öğrenci Taksit Tahsilatı
  const handlePayInstallment = (
    studentId: string, 
    installmentNo: number, 
    method: PaymentMethod, 
    date: string, 
    amount: number
  ) => {
    StorageService.payStudentInstallment(studentId, installmentNo, method, date, amount);
    setTransactions(StorageService.getTransactions());
    setStudents(StorageService.getStudents());
  };

  // Taksit Tahsilatını Geri Alma
  const handleRevertInstallment = (studentId: string, installmentNo: number) => {
    StorageService.revertInstallmentPayment(studentId, installmentNo);
    setStudents(StorageService.getStudents());
  };

  // Yeni Öğrenci Ekleme
  const handleAddStudent = (
    studentData: Omit<Student, 'id' | 'installments'>, 
    intervalMonths = 1
  ) => {
    StorageService.addStudent(studentData, intervalMonths);
    setStudents(StorageService.getStudents());
  };

  // Ayarları Kaydetme
  const handleSaveSettings = (newSettings: CashSettings) => {
    StorageService.saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Örnek Verilere Sıfırlama
  const handleResetDefaults = () => {
    StorageService.resetToDefaultData();
    setSettings(StorageService.getSettings());
    setTransactions(StorageService.getTransactions());
    setStudents(StorageService.getStudents());
    setCategories(StorageService.getCategories());
  };

  // JSON Yedek İndirme
  const handleExportJsonBackup = () => {
    const jsonStr = StorageService.exportFullBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dershane_finans_yedek_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON Yedek Yükleme
  const handleImportJsonBackup = (jsonStr: string) => {
    const success = StorageService.importFullBackupJson(jsonStr);
    if (success) {
      setSettings(StorageService.getSettings());
      setTransactions(StorageService.getTransactions());
      setStudents(StorageService.getStudents());
      setCategories(StorageService.getCategories());
      alert('Yedek başarıyla geri yüklendi!');
    } else {
      alert('Yedek dosyası ayrıştırılamadı. Geçerli bir JSON dosyası seçiniz.');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Kasa Verileri Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-slate-900 selection:text-white">
      
      {/* Üst Bar & Kasa Bakiyesi */}
      <Header
        settings={settings}
        cashBalance={cashBalance}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenQuickIncome={() => {
          setActiveTab('data-entry');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenQuickExpense={() => {
          setActiveTab('data-entry');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Ana İçerik */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'data-entry' && (
          <DataEntryTab
            transactions={transactions}
            categories={categories}
            students={students}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onPayInstallment={handlePayInstallment}
          />
        )}

        {activeTab === 'reports' && (
          <ReportingTab
            transactions={transactions}
            settings={settings}
            students={students}
            currentCashBalance={cashBalance.currentBalance}
          />
        )}

        {activeTab === 'installments' && (
          <StudentInstallmentsTab
            students={students}
            onAddStudent={handleAddStudent}
            onPayInstallment={handlePayInstallment}
            onRevertInstallment={handleRevertInstallment}
          />
        )}
      </main>

      {/* Alt Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{settings.institutionName}</span>
            <span>·</span>
            <span>Kasa, Taksit & Finansal Raporlama Portali</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              Bulut Durumu (Firebase Hazır)
            </button>
            <span>·</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              Kasa Ayarları
            </button>
            <span>·</span>
            <span>2026</span>
          </div>
        </div>
      </footer>

      {/* Kasa Ayarları Modalı */}
      {isSettingsOpen && (
        <CashSettingsModal
          settings={settings}
          currentCalculatedBalance={cashBalance.currentBalance}
          onSaveSettings={handleSaveSettings}
          onResetDefaults={handleResetDefaults}
          onExportJsonBackup={handleExportJsonBackup}
          onImportJsonBackup={handleImportJsonBackup}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Firebase Bulut Senkronizasyon Modalı */}
      {isSyncModalOpen && (
        <FirebaseSyncModal
          fullData={{
            transactions,
            students,
            settings,
            categories,
          }}
          onClose={() => setIsSyncModalOpen(false)}
        />
      )}

    </div>
  );
}
