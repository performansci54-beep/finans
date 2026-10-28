import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Transaction, CashSettings, Student } from '../types/finance';

export const formatCurrency = (amount: number, currency: string = '₺'): string => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ' + currency;
};

export const formatDateTR = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  } catch {
    return dateStr;
  }
};

/**
 * Excel (.xlsx) Formatında Dışa Aktar
 */
export const exportToExcel = (
  incomes: Transaction[],
  expenses: Transaction[],
  settings: CashSettings,
  startDate: string,
  endDate: string,
  currentCashBalance: number,
  students: Student[]
) => {
  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const net = totalIncome - totalExpense;

  // 1. Özet Sayfası
  const summaryData = [
    ['KURUMSAL FİNANS & KASA RAPORU'],
    ['Kurum Adı', settings.institutionName],
    ['Rapor Tarih Aralığı', `${formatDateTR(startDate)} - ${formatDateTR(endDate)}`],
    ['Rapor Oluşturma Zamanı', new Date().toLocaleString('tr-TR')],
    [''],
    ['DÖNEM ÖZETİ', 'TUTAR (TL)'],
    ['Toplam Gelir', totalIncome],
    ['Toplam Gider', totalExpense],
    ['Net Dönem Kar / Bakiye', net],
    [''],
    ['KASA DURUMU', 'TUTAR (TL)'],
    ['Başlangıç Kasa Bakiyesi', settings.initialBalance],
    ['Güncel Canlı Kasa Bakiyesi', currentCashBalance],
  ];

  // 2. Gelirler Sayfası
  const incomeData = [
    ['Tarih', 'Kategori', 'Açıklama', 'Öğrenci / Muhatap', 'Ödeme Yöntemi', 'Tutar (TL)'],
    ...incomes.map(item => [
      formatDateTR(item.date),
      item.category,
      item.description || '-',
      item.counterparty || '-',
      item.paymentMethod,
      item.amount,
    ]),
    ['TOPLAM GELİR', '', '', '', '', totalIncome],
  ];

  // 3. Giderler Sayfası
  const expenseData = [
    ['Tarih', 'Kategori', 'Açıklama', 'Alıcı / Personel', 'Ödeme Yöntemi', 'Tutar (TL)'],
    ...expenses.map(item => [
      formatDateTR(item.date),
      item.category,
      item.description || '-',
      item.counterparty || '-',
      item.paymentMethod,
      item.amount,
    ]),
    ['TOPLAM GİDER', '', '', '', '', totalExpense],
  ];

  // 4. Öğrenci Taksitleri Sayfası
  const studentData = [
    ['Öğrenci Adı', 'Sınıf / Bölüm', 'Telefon', 'Toplam Sözleşme (TL)', 'Ödenen Tutar (TL)', 'Kalan Bakiye (TL)', 'Toplam Taksit', 'Ödenen Taksit'],
    ...students.map(s => {
      const paidAmt = s.installments.filter(i => i.isPaid).reduce((sum, i) => sum + i.amount, 0);
      const paidCount = s.installments.filter(i => i.isPaid).length;
      return [
        s.fullName,
        s.courseClass,
        s.phone,
        s.totalFee,
        paidAmt,
        s.totalFee - paidAmt,
        s.installments.length,
        paidCount,
      ];
    }),
  ];

  const wb = XLSX.utils.book_new();

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  const wsIncome = XLSX.utils.aoa_to_sheet(incomeData);
  const wsExpense = XLSX.utils.aoa_to_sheet(expenseData);
  const wsStudents = XLSX.utils.aoa_to_sheet(studentData);

  // Sütun genişlikleri ayarla
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 30 }];
  wsIncome['!cols'] = [{ wch: 12 }, { wch: 26 }, { wch: 35 }, { wch: 22 }, { wch: 20 }, { wch: 15 }];
  wsExpense['!cols'] = [{ wch: 12 }, { wch: 26 }, { wch: 35 }, { wch: 22 }, { wch: 20 }, { wch: 15 }];
  wsStudents['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Genel Özet');
  XLSX.utils.book_append_sheet(wb, wsIncome, 'Gelirler Tablosu');
  XLSX.utils.book_append_sheet(wb, wsExpense, 'Giderler Tablosu');
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Öğrenci Taksitleri');

  const fileName = `kurs_mali_rapor_${startDate}_${endDate}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * PDF Formatında Dışa Aktar (jsPDF & jspdf-autotable)
 */
export const exportToPdf = (
  incomes: Transaction[],
  expenses: Transaction[],
  settings: CashSettings,
  startDate: string,
  endDate: string,
  currentCashBalance: number
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const net = totalIncome - totalExpense;

  // Başlık Bölümü
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.institutionName.toUpperCase(), 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Dershane Gelir-Gider & Kasa Mali Raporu', 14, 18);
  doc.text(`Tarih Araligi: ${formatDateTR(startDate)} - ${formatDateTR(endDate)}`, 14, 23);

  const reportDateStr = new Date().toLocaleDateString('tr-TR');
  doc.text(`Rapor Tarihi: ${reportDateStr}`, 150, 18);

  // Özet Bilgi Kutuları
  let currentY = 36;
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  // 1. Kasa Kutuları
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, 57, 18, 'F');
  doc.rect(76, currentY, 57, 18, 'F');
  doc.rect(138, currentY, 58, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.text('TOPLAM GELIR', 18, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalIncome.toLocaleString('tr-TR')} TL`, 18, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('TOPLAM GIDER', 80, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalExpense.toLocaleString('tr-TR')} TL`, 80, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('NET BAKIYE / FARK', 142, currentY + 6);
  doc.setFont('helvetica', 'normal');
  const netPrefix = net >= 0 ? '+' : '';
  doc.text(`${netPrefix}${net.toLocaleString('tr-TR')} TL`, 142, currentY + 13);

  currentY += 25;

  // GELİRLER TABLOSU
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(22, 101, 52); // green-800
  doc.text(`1. GELIR KALEMLERI (${incomes.length} Kayit)`, 14, currentY);

  const incomeRows = incomes.map(item => [
    formatDateTR(item.date),
    item.category,
    item.description || '-',
    item.counterparty || '-',
    item.paymentMethod,
    `${item.amount.toLocaleString('tr-TR')} TL`,
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Tarih', 'Kategori', 'Aciklama', 'Ogrenci / Kisi', 'Odeme', 'Tutar']],
    body: incomeRows.length > 0 ? incomeRows : [['-', 'Kayit bulunamadi', '-', '-', '-', '0 TL']],
    foot: [['TOPLAM GELIR', '', '', '', '', `${totalIncome.toLocaleString('tr-TR')} TL`]],
    theme: 'striped',
    headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 253, 244], textColor: [22, 101, 52], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 38 },
      2: { cellWidth: 46 },
      3: { cellWidth: 32 },
      4: { cellWidth: 26 },
      5: { cellWidth: 22, halign: 'right' },
    },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 12;

  // GİDERLER TABLOSU
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(185, 28, 28); // red-700
  doc.text(`2. GIDER KALEMLERI (${expenses.length} Kayit)`, 14, currentY);

  const expenseRows = expenses.map(item => [
    formatDateTR(item.date),
    item.category,
    item.description || '-',
    item.counterparty || '-',
    item.paymentMethod,
    `${item.amount.toLocaleString('tr-TR')} TL`,
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Tarih', 'Kategori', 'Aciklama', 'Alici / Personel', 'Odeme', 'Tutar']],
    body: expenseRows.length > 0 ? expenseRows : [['-', 'Kayit bulunamadi', '-', '-', '-', '0 TL']],
    foot: [['TOPLAM GIDER', '', '', '', '', `${totalExpense.toLocaleString('tr-TR')} TL`]],
    theme: 'striped',
    headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [254, 242, 242], textColor: [185, 28, 28], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 38 },
      2: { cellWidth: 46 },
      3: { cellWidth: 32 },
      4: { cellWidth: 26 },
      5: { cellWidth: 22, halign: 'right' },
    },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 14;

  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  // Sonuç ve Kasa Özeti
  doc.setFillColor(248, 250, 252);
  doc.rect(14, currentY, 182, 22, 'F');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(`GUNCEL KASA BAKIYESI: ${currentCashBalance.toLocaleString('tr-TR')} TL`, 18, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`(Baslangic Bakiyesi: ${settings.initialBalance.toLocaleString('tr-TR')} TL + Toplam Gelir: ${totalIncome.toLocaleString('tr-TR')} TL - Toplam Gider: ${totalExpense.toLocaleString('tr-TR')} TL)`, 18, currentY + 14);

  // İmza Alanı
  currentY += 34;
  doc.text('Hazirlayan / Muhasebe', 25, currentY);
  doc.text('Kurs Muduru / Onay', 135, currentY);
  doc.setDrawColor(203, 213, 225);
  doc.line(25, currentY + 12, 75, currentY + 12);
  doc.line(135, currentY + 12, 185, currentY + 12);

  const fileName = `kurs_mali_rapor_${startDate}_${endDate}.pdf`;
  doc.save(fileName);
};
