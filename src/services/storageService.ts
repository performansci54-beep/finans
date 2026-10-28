import { 
  Transaction, 
  Student, 
  CashSettings, 
  CategoryItem, 
  MonthlySummary, 
  DateRangeFilter, 
  PaymentMethod 
} from '../types/finance';
import { 
  DEFAULT_SETTINGS, 
  DEFAULT_INCOME_CATEGORIES, 
  DEFAULT_EXPENSE_CATEGORIES, 
  DEFAULT_STUDENTS, 
  DEFAULT_TRANSACTIONS 
} from '../data/defaultData';
import { FirebaseSyncAdapter } from './firebaseSyncService';

const STORAGE_KEYS = {
  TRANSACTIONS: 'dershane_transactions_v1',
  STUDENTS: 'dershane_students_v1',
  SETTINGS: 'dershane_settings_v1',
  INCOME_CATEGORIES: 'dershane_cat_income_v1',
  EXPENSE_CATEGORIES: 'dershane_cat_expense_v1',
};

export class StorageService {
  // --- Ayarlar ve Kasa Bilgisi ---
  static getSettings(): CashSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Ayarlar yüklenemedi:', e);
    }
    this.saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: CashSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // --- Kategoriler ---
  static getCategories(): { income: CategoryItem[]; expense: CategoryItem[] } {
    let income = DEFAULT_INCOME_CATEGORIES;
    let expense = DEFAULT_EXPENSE_CATEGORIES;

    try {
      const savedInc = localStorage.getItem(STORAGE_KEYS.INCOME_CATEGORIES);
      if (savedInc) income = JSON.parse(savedInc);
      const savedExp = localStorage.getItem(STORAGE_KEYS.EXPENSE_CATEGORIES);
      if (savedExp) expense = JSON.parse(savedExp);
    } catch (e) {
      console.error('Kategoriler yüklenemedi:', e);
    }

    return { income, expense };
  }

  static saveCategory(category: CategoryItem): void {
    const cats = this.getCategories();
    if (category.type === 'income') {
      const exists = cats.income.some(c => c.id === category.id);
      const updated = exists ? cats.income.map(c => c.id === category.id ? category : c) : [...cats.income, category];
      localStorage.setItem(STORAGE_KEYS.INCOME_CATEGORIES, JSON.stringify(updated));
    } else {
      const exists = cats.expense.some(c => c.id === category.id);
      const updated = exists ? cats.expense.map(c => c.id === category.id ? category : c) : [...cats.expense, category];
      localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(updated));
    }
  }

  // --- İşlemler (Gelir / Gider) ---
  static getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (data) {
        const parsed: Transaction[] = JSON.parse(data);
        // Tarihe göre yeniden eskiye sırala
        return parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    } catch (e) {
      console.error('İşlemler yüklenemedi:', e);
    }
    // Varsayılan verileri yükle
    this.saveTransactions(DEFAULT_TRANSACTIONS);
    return DEFAULT_TRANSACTIONS;
  }

  static saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    // Firebase adaptörünü haberdar et
    FirebaseSyncAdapter.uploadTransactions(transactions).catch(() => {});
  }

  static addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const current = this.getTransactions();
    const newTx: Transaction = {
      ...tx,
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: Date.now(),
      syncStatus: 'local',
    };
    const updated = [newTx, ...current];
    this.saveTransactions(updated);
    return newTx;
  }

  static updateTransaction(updatedTx: Transaction): void {
    const current = this.getTransactions();
    const updated = current.map(t => t.id === updatedTx.id ? { ...updatedTx, updatedAt: Date.now() } : t);
    this.saveTransactions(updated);
  }

  static deleteTransaction(id: string): void {
    const current = this.getTransactions();
    const target = current.find(t => t.id === id);
    
    // Eğer bir öğrenci taksiti ile ilişkiliyse o taksitin durumunu "ödenmedi" yap
    if (target?.studentId && target.installmentNo) {
      this.revertInstallmentPayment(target.studentId, target.installmentNo);
    }

    const updated = current.filter(t => t.id !== id);
    this.saveTransactions(updated);
  }

  // --- Öğrenciler ve Taksit Takibi ---
  static getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Öğrenciler yüklenemedi:', e);
    }
    this.saveStudents(DEFAULT_STUDENTS);
    return DEFAULT_STUDENTS;
  }

  static saveStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  static addStudent(studentData: Omit<Student, 'id' | 'installments'>, installmentIntervalMonths = 1): Student {
    const students = this.getStudents();
    const newId = 'std_' + Date.now();
    const perInstallmentAmount = Math.round(studentData.totalFee / studentData.installmentCount);
    
    const installments = [];
    const baseDate = new Date(studentData.startDate || new Date().toISOString().split('T')[0]);

    for (let i = 1; i <= studentData.installmentCount; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1) * installmentIntervalMonths);
      
      // Son taksitte kuruş/yuvarlama farkını denkleştir
      const isLast = i === studentData.installmentCount;
      const amt = isLast ? (studentData.totalFee - perInstallmentAmount * (studentData.installmentCount - 1)) : perInstallmentAmount;

      installments.push({
        id: `inst_${newId}_${i}`,
        installmentNo: i,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: amt,
        isPaid: false,
      });
    }

    const newStudent: Student = {
      ...studentData,
      id: newId,
      installments,
    };

    const updated = [newStudent, ...students];
    this.saveStudents(updated);
    return newStudent;
  }

  static payStudentInstallment(
    studentId: string, 
    installmentNo: number, 
    paymentMethod: PaymentMethod,
    paymentDate: string,
    customAmount?: number
  ): Transaction | null {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const instIndex = student.installments.findIndex(i => i.installmentNo === installmentNo);
    if (instIndex === -1) return null;

    const inst = student.installments[instIndex];
    const amountToPay = customAmount !== undefined && customAmount > 0 ? customAmount : inst.amount;

    // 1. Gelir kaydını oluştur
    const tx = this.addTransaction({
      type: 'income',
      category: 'Öğrenci Taksit Ödemesi',
      amount: amountToPay,
      date: paymentDate,
      description: `${student.fullName} - ${installmentNo}. Taksit Tahsilatı (${student.courseClass})`,
      paymentMethod,
      counterparty: student.fullName,
      studentId: student.id,
      installmentNo,
    });

    // 2. Öğrencinin taksitini ödendi olarak işaretle
    student.installments[instIndex] = {
      ...inst,
      amount: amountToPay,
      isPaid: true,
      paidDate: paymentDate,
      transactionId: tx.id,
    };

    this.saveStudents(students);
    return tx;
  }

  static revertInstallmentPayment(studentId: string, installmentNo: number): void {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const instIndex = student.installments.findIndex(i => i.installmentNo === installmentNo);
    if (instIndex === -1) return;

    student.installments[instIndex].isPaid = false;
    delete student.installments[instIndex].paidDate;
    delete student.installments[instIndex].transactionId;

    this.saveStudents(students);
  }

  // --- Kasa Hesaplama (Canlı Bakiye) ---
  static calculateLiveCashBalance(transactions?: Transaction[]): {
    initialBalance: number;
    totalIncome: number;
    totalExpense: number;
    currentBalance: number;
  } {
    const settings = this.getSettings();
    const txList = transactions || this.getTransactions();

    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of txList) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
      }
    }

    const currentBalance = (settings.initialBalance || 0) + totalIncome - totalExpense;

    return {
      initialBalance: settings.initialBalance || 0,
      totalIncome,
      totalExpense,
      currentBalance,
    };
  }

  // --- Tarih Filtresi ---
  static filterTransactionsByDate(
    transactions: Transaction[],
    startDate: string,
    endDate: string
  ): Transaction[] {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      const txTime = new Date(t.date).getTime();
      return txTime >= start && txTime <= end;
    });
  }

  // --- Otomatik Aylık Özetler ---
  static generateMonthlySummaries(transactions: Transaction[]): MonthlySummary[] {
    const map = new Map<string, MonthlySummary>();

    for (const tx of transactions) {
      const monthKey = tx.date.substring(0, 7); // YYYY-MM
      if (!map.has(monthKey)) {
        const [year, month] = monthKey.split('-');
        const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        const monthLabel = dateObj.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
        
        map.set(monthKey, {
          monthKey,
          monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          totalIncome: 0,
          totalExpense: 0,
          net: 0,
          incomeCount: 0,
          expenseCount: 0,
        });
      }

      const summary = map.get(monthKey)!;
      if (tx.type === 'income') {
        summary.totalIncome += tx.amount;
        summary.incomeCount += 1;
      } else {
        summary.totalExpense += tx.amount;
        summary.expenseCount += 1;
      }
      summary.net = summary.totalIncome - summary.totalExpense;
    }

    // Ayları kronolojik ters sırayla listele (en son ay en üstte)
    return Array.from(map.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }

  // --- Sıfırlama & Yedekleme ---
  static resetToDefaultData(): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(DEFAULT_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.INCOME_CATEGORIES, JSON.stringify(DEFAULT_INCOME_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(DEFAULT_EXPENSE_CATEGORIES));
  }

  static exportFullBackupJson(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      categories: this.getCategories(),
      transactions: this.getTransactions(),
      students: this.getStudents(),
    };
    return JSON.stringify(data, null, 2);
  }

  static importFullBackupJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      if (data.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
      if (data.students) localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
      if (data.categories?.income) localStorage.setItem(STORAGE_KEYS.INCOME_CATEGORIES, JSON.stringify(data.categories.income));
      if (data.categories?.expense) localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(data.categories.expense));
      return true;
    } catch (e) {
      console.error('Yedek yüklenirken hata:', e);
      return false;
    }
  }
}
