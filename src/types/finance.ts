export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 
  | 'Nakit' 
  | 'Banka Havalesi / EFT' 
  | 'Kredi Kartı / POS' 
  | 'Diğer';

export interface CategoryItem {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  paymentMethod: PaymentMethod;
  counterparty?: string; // Öğrenci Adı (gelir için) veya Personel / Tedarikçi (gider için)
  studentId?: string;
  installmentNo?: number;
  createdAt: number;
  updatedAt?: number;
  syncStatus?: 'local' | 'synced' | 'pending';
}

export interface StudentInstallment {
  id: string;
  installmentNo: number;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  isPaid: boolean;
  paidDate?: string;
  transactionId?: string;
}

export interface Student {
  id: string;
  fullName: string;
  phone: string;
  courseClass: string; // örn: 12. Sınıf Sayısal, YKS Mezun, LGS vb.
  totalFee: number;
  installmentCount: number;
  startDate: string;
  installments: StudentInstallment[];
}

export interface CashSettings {
  initialBalance: number;
  initialBalanceDate: string;
  institutionName: string;
  currency: string;
  lastBackupDate?: string;
}

export interface MonthlySummary {
  monthKey: string; // YYYY-MM
  monthLabel: string; // Ekim 2026
  totalIncome: number;
  totalExpense: number;
  net: number;
  incomeCount: number;
  expenseCount: number;
}

export interface DateRangeFilter {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  preset: 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear' | 'custom' | 'all';
}
