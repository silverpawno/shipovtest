import { useState, useMemo } from 'react';
import { Search, MapPin, BookOpen, DollarSign, Trophy, ArrowUpRight, Filter } from 'lucide-react';
import { universities as allUniversities, studyCountriesRu } from '../data/universities';
import type { University } from '../types';

interface UniversityCatalogProps {
  onSelectUniversity: (uni: University) => void;
}

export default function UniversityCatalog({ onSelectUniversity }: UniversityCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  // Получаем уникальные специальности для фильтра
  const specialties = useMemo(() => {
    const specs = new Set<string>();
    allUniversities.forEach((u) => u.specialties.forEach((s) => specs.add(s)));
    return Array.from(specs);
  }, []);

  // Фильтрация университетов
  const filteredUniversities = useMemo(() => {
    return allUniversities.filter((uni) => {
      const matchesSearch = uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            uni.nameRu.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            uni.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCountry = selectedCountry === 'all' || uni.country === selectedCountry;
      const matchesSpecialty = selectedSpecialty === 'all' || uni.specialties.includes(selectedSpecialty);
      return matchesSearch && matchesCountry && matchesSpecialty;
    });
  }, [searchQuery, selectedCountry, selectedSpecialty]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Каталог университетов мира</h2>
          <p className="text-sm text-slate-400 mt-0.5">Все доступные вузы, фильтрация по странам и специальностям</p>
        </div>
        <span className="text-sm text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1.5 rounded-xl font-medium">
          Найдено: {filteredUniversities.length}
        </span>
      </div>

      {/* Панель поиска и фильтров */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или городу..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="all">Все страны</option>
            {Object.entries(studyCountriesRu).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="all">Все специальности</option>
            {specialties.map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Список вузов карточками */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredUniversities.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/30">
            <p className="text-slate-400">По вашему запросу университетов не найдено. Попробуйте изменить фильтры.</p>
          </div>
        ) : (
          filteredUniversities.map((uni) => (
            <div
              key={uni.id}
              onClick={() => onSelectUniversity(uni)}
              className="group cursor-pointer rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-900 hover:border-slate-700 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 px-2.5 py-0.5 rounded-full">
                    <MapPin size={11} />
                    {studyCountriesRu[uni.country] || uni.country}, {uni.city}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Trophy size={11} className="text-amber-400" />
                    Рейтинг: #{uni.worldRank}
                  </span>
                </div>

                <h3 className="font-bold text-white text-base leading-tight mb-2 group-hover:text-cyan-400 transition-colors">
                  {uni.nameRu}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4">{uni.descriptionRu}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-sm">
                <span className="text-slate-300 font-medium flex items-center gap-1">
                  <DollarSign size={14} className="text-emerald-400" />
                  ${uni.tuitionUsd.toLocaleString()} / год
                </span>
                <span className="text-xs text-cyan-400 flex items-center gap-1 font-semibold group-hover:underline">
                  Подробнее <ArrowUpRight size={13} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}