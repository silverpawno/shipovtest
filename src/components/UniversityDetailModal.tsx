import { useState } from 'react';
import {
  X, MapPin, Calendar, Users, Trophy, BookOpen, CheckCircle2,
  Award, Coins, ChevronLeft, ChevronRight, GraduationCap, Building2,
} from 'lucide-react';
import type { University, UniversityCategory } from '@/types';

interface UniversityDetailModalProps {
  university: University;
  category: UniversityCategory;
  matchScore: number;
  onClose: () => void;
}

const categoryConfig: Record<UniversityCategory, { color: string; bg: string; border: string; label: string }> = {
  Safety: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Запас' },
  Target: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Цель' },
  Reach: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Мечта' },
};

export default function UniversityDetailModal({
  university,
  category,
  matchScore,
  onClose,
}: UniversityDetailModalProps) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const config = categoryConfig[category];

  const nextImage = () => setGalleryIndex((i) => (i + 1) % university.gallery.length);
  const prevImage = () => setGalleryIndex((i) => (i - 1 + university.gallery.length) % university.gallery.length);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — half screen width on desktop, full on mobile */}
      <div className="relative w-full md:w-1/2 h-full bg-white shadow-2xl overflow-y-auto animate-[slideIn_0.3s_ease-out]">
        {/* Gallery header */}
        <div className="relative h-64 md:h-72 overflow-hidden bg-slate-100">
          <img
            src={university.gallery[galleryIndex]}
            alt={`${university.nameRu} — фото ${galleryIndex + 1}`}
            className="w-full h-full object-cover transition-all duration-500"
            key={galleryIndex}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg hover:bg-white transition-all"
          >
            <X size={20} />
          </button>

          {/* Gallery navigation */}
          {university.gallery.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-md hover:bg-white transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-md hover:bg-white transition-all"
              >
                <ChevronRight size={20} />
              </button>

              {/* Gallery dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {university.gallery.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setGalleryIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === galleryIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 rounded-full ${config.bg} ${config.color} px-2.5 py-0.5 text-xs font-semibold border ${config.border}`}>
                {config.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                <Trophy size={11} className="text-amber-500" />
                {matchScore}% совпадение
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
              {university.nameRu}
            </h2>
            <p className="text-sm text-white/80 mt-0.5">{university.name}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 space-y-6">
          {/* Quick facts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: MapPin, label: 'Страна', value: university.countryRu },
              { icon: Building2, label: 'Город', value: university.cityRu },
              { icon: Calendar, label: 'Основан', value: String(university.founded) },
              { icon: Users, label: 'Студентов', value: university.students > 1000 ? `${Math.round(university.students / 1000)}k` : String(university.students) },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Icon size={13} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 truncate">{item.value}</div>
                </div>
              );
            })}
          </div>

          {/* QS Rank + Tuition */}
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-xl bg-amber-50 border border-amber-100 p-4">
              <div className="flex items-center gap-2 text-amber-700 mb-1">
                <Trophy size={16} />
                <span className="text-xs font-semibold uppercase tracking-wide">QS рейтинг</span>
              </div>
              <div className="text-2xl font-bold text-amber-900">#{university.qsRank}</div>
            </div>
            <div className="flex-1 rounded-xl bg-emerald-50 border border-emerald-100 p-4">
              <div className="flex items-center gap-2 text-emerald-700 mb-1">
                <Coins size={16} />
                <span className="text-xs font-semibold uppercase tracking-wide">Обучение/год</span>
              </div>
              <div className="text-2xl font-bold text-emerald-900">
                ${university.tuitionUsd.toLocaleString()}
              </div>
            </div>
          </div>

          {/* History */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-3">
              <BookOpen size={18} className="text-teal-600" />
              История университета
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {university.history}
            </p>
          </section>

          {/* Specialties */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-3">
              <GraduationCap size={18} className="text-teal-600" />
              Специальности
            </h3>
            <div className="flex flex-wrap gap-2">
              {university.specialtiesRu.map((s) => (
                <span
                  key={s}
                  className="rounded-xl bg-teal-50 border border-teal-100 px-3.5 py-2 text-sm font-medium text-teal-800"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>

          {/* Requirements */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-3">
              <Award size={18} className="text-teal-600" />
              Требования для поступления
            </h3>
            <ul className="space-y-2.5">
              {university.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                  <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5 text-teal-600" />
                  <span className="text-sm text-slate-700 leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Grants */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-3">
              <Coins size={18} className="text-teal-600" />
              Доступные гранты и стипендии
            </h3>
            <div className="space-y-2.5">
              {university.grants.map((grant, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4"
                >
                  <div className="flex-shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Coins size={14} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 leading-relaxed">{grant}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Footer note */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center">
            <p className="text-xs text-slate-400">
              Информация о требованиях и грантах носит справочный характер.
              Уточняйте актуальные данные на официальном сайте университета.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
