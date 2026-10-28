import React, { useState } from 'react';
import { Transaction, MonthlySummary } from '../types/finance';
import { formatCurrency } from '../services/exportService';

interface CategorySlice {
  category: string;
  amount: number;
  color: string;
  percentage: number;
}

const PALETTE = [
  '#0284c7', '#16a34a', '#ea580c', '#9333ea', '#d97706', 
  '#0d9488', '#e11d48', '#4f46e5', '#64748b', '#84cc16'
];

export const FinancialPieChart: React.FC<{
  transactions: Transaction[];
  type: 'expense' | 'income';
  title: string;
}> = ({ transactions, type, title }) => {
  const [hoveredSlice, setHoveredSlice] = useState<CategorySlice | null>(null);

  const filtered = transactions.filter(t => t.type === type);
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  // Kategorilere göre topla
  const categoryMap = new Map<string, number>();
  for (const t of filtered) {
    categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
  }

  const slices: CategorySlice[] = Array.from(categoryMap.entries())
    .map(([cat, amt], idx) => ({
      category: cat,
      amount: amt,
      color: PALETTE[idx % PALETTE.length],
      percentage: total > 0 ? (amt / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  if (total === 0 || slices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-xl text-center">
        <p className="text-sm font-medium text-slate-500">Bu dönem için {type === 'expense' ? 'gider' : 'gelir'} kaydı bulunmuyor.</p>
      </div>
    );
  }

  // SVG Donut Path Hesaplamaları
  const size = 220;
  const strokeWidth = 36;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <span className="text-xs font-mono-numbers font-medium text-slate-600">
          Toplam: {formatCurrency(total)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
        {/* SVG Donut */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />
            {slices.map((slice, idx) => {
              const strokeDasharray = `${(slice.percentage * circumference) / 100} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent * circumference) / 100);
              accumulatedPercent += slice.percentage;

              const isHovered = hoveredSlice?.category === slice.category;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredSlice(slice)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              );
            })}
          </svg>

          {/* Merkez Bilgi */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            {hoveredSlice ? (
              <>
                <span className="text-[11px] font-medium text-slate-500 truncate max-w-[120px]">
                  {hoveredSlice.category}
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono-numbers">
                  %{hoveredSlice.percentage.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-600 font-mono-numbers">
                  {formatCurrency(hoveredSlice.amount)}
                </span>
              </>
            ) : (
              <>
                <span className="text-[11px] text-slate-500 font-medium">Toplam</span>
                <span className="text-sm font-bold text-slate-900 font-mono-numbers">
                  {formatCurrency(total)}
                </span>
                <span className="text-[10px] text-slate-400">{slices.length} Kalem</span>
              </>
            )}
          </div>
        </div>

        {/* Lejant ve Kalem Listesi */}
        <div className="sm:col-span-7 space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {slices.map((slice, idx) => {
            const isHovered = hoveredSlice?.category === slice.category;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredSlice(slice)}
                onMouseLeave={() => setHoveredSlice(null)}
                className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  isHovered ? 'bg-slate-100' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="font-medium text-slate-700 truncate" title={slice.category}>
                    {slice.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono-numbers text-right">
                  <span className="text-slate-900 font-semibold">{formatCurrency(slice.amount)}</span>
                  <span className="text-slate-500 text-[11px] w-12 text-right">
                    %{slice.percentage.toFixed(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const MonthlyComparisonBarChart: React.FC<{
  summaries: MonthlySummary[];
}> = ({ summaries }) => {
  if (!summaries || summaries.length === 0) return null;

  // Kronolojik sıra için kopyala ve ters çevir (eski aylar solda, yeni aylar sağda)
  const displayMonths = [...summaries].slice(0, 6).reverse();
  const maxVal = Math.max(
    ...displayMonths.map(m => Math.max(m.totalIncome, m.totalExpense)),
    1000
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Aylık Gelir - Gider Karşılaştırması</h4>
          <p className="text-xs text-slate-500">Son ayların mali hacim ve denge trendi</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" />
            <span className="text-slate-700">Gelir</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-rose-600 inline-block" />
            <span className="text-slate-700">Gider</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {displayMonths.map(m => {
          const incomeWidth = (m.totalIncome / maxVal) * 100;
          const expenseWidth = (m.totalExpense / maxVal) * 100;
          const isNetPositive = m.net >= 0;

          return (
            <div key={m.monthKey} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{m.monthLabel}</span>
                <span className={`font-mono-numbers font-medium ${isNetPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                  Net: {isNetPositive ? '+' : ''}{formatCurrency(m.net)}
                </span>
              </div>

              {/* Gelir Bar */}
              <div className="flex items-center gap-2 text-[11px] font-mono-numbers">
                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(incomeWidth, 2)}%` }}
                    title={`Gelir: ${formatCurrency(m.totalIncome)}`}
                  />
                </div>
                <span className="w-24 text-right text-emerald-700 font-medium shrink-0">
                  {formatCurrency(m.totalIncome)}
                </span>
              </div>

              {/* Gider Bar */}
              <div className="flex items-center gap-2 text-[11px] font-mono-numbers">
                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex">
                  <div
                    className="bg-rose-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(expenseWidth, 2)}%` }}
                    title={`Gider: ${formatCurrency(m.totalExpense)}`}
                  />
                </div>
                <span className="w-24 text-right text-rose-700 font-medium shrink-0">
                  {formatCurrency(m.totalExpense)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
