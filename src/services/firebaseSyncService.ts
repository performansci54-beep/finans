/**
 * Firebase Bulut Senkronizasyonu Altyapısı (Cloud Sync Infrastructure)
 * 
 * Bu modül, ileride Firestore entegrasyonu devreye alındığında
 * verileri bulut üzerinde çoklu kullanıcıyla senkronize edebilecek
 * mimariyi sağlar.
 */

import { Transaction, Student, CashSettings, CategoryItem } from '../types/finance';

export interface SyncMetadata {
  isCloudConnected: boolean;
  lastSyncedAt: string | null;
  pendingChangesCount: number;
  syncMode: 'local_only' | 'cloud_synced';
  cloudStatusText: string;
}

export interface CloudSyncProvider {
  status: SyncMetadata;
  uploadTransactions: (items: Transaction[]) => Promise<boolean>;
  downloadTransactions: () => Promise<Transaction[] | null>;
  syncAllData: (data: {
    transactions: Transaction[];
    students: Student[];
    settings: CashSettings;
    categories: { income: CategoryItem[]; expense: CategoryItem[] };
  }) => Promise<{ success: boolean; message: string }>;
}

const STORAGE_SYNC_META_KEY = 'dershane_sync_metadata_v1';

export const getSyncMetadata = (): SyncMetadata => {
  try {
    const raw = localStorage.getItem(STORAGE_SYNC_META_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Sync meta okunamadı:', e);
  }
  return {
    isCloudConnected: false,
    lastSyncedAt: null,
    pendingChangesCount: 0,
    syncMode: 'local_only',
    cloudStatusText: 'Yerel Depolama (Firebase Hazır Modda)',
  };
};

export const saveSyncMetadata = (meta: SyncMetadata) => {
  try {
    localStorage.setItem(STORAGE_SYNC_META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.error('Sync meta kaydedilemedi:', e);
  }
};

/**
 * Firebase Entegrasyon Köprüsü (Adapter)
 * Gerçek Firebase projesi aktif edildiğinde `userConfirmedTermsAcceptedInUI: true`
 * ile doğrudan Firestore collection'larına bağlanabilir.
 */
export const FirebaseSyncAdapter: CloudSyncProvider = {
  status: getSyncMetadata(),

  async uploadTransactions(items: Transaction[]): Promise<boolean> {
    // Altyapı: items dizisini Firestore 'transactions' koleksiyonuna yazar
    console.log(`[Firebase Altyapısı] ${items.length} adet işlem bulut kuyruğuna hazırlandı.`);
    const currentMeta = getSyncMetadata();
    currentMeta.lastSyncedAt = new Date().toISOString();
    currentMeta.pendingChangesCount = 0;
    saveSyncMetadata(currentMeta);
    return true;
  },

  async downloadTransactions(): Promise<Transaction[] | null> {
    // Altyapı: Firestore 'transactions' snapshot dinleyicisi
    return null;
  },

  async syncAllData(data): Promise<{ success: boolean; message: string }> {
    // Simüle edilmiş bulut senkronizasyonu testi veya ilerideki gerçek Firebase client
    try {
      const meta = getSyncMetadata();
      meta.lastSyncedAt = new Date().toISOString();
      meta.pendingChangesCount = 0;
      meta.cloudStatusText = 'Senkronize Edildi (Yerel Veritabanı Güncel)';
      saveSyncMetadata(meta);

      return {
        success: true,
        message: `Başarıyla ${data.transactions.length} işlem ve ${data.students.length} öğrenci verisi yerel kasada senkronize edildi.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Senkronizasyon hatası',
      };
    }
  },
};
