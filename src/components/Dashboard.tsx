import { useEffect, useState, useMemo, useRef } from 'react';
import {
  GraduationCap, LogOut, MapPin, BookOpen, Award, DollarSign, Plane,
  Check, Circle, Calendar, TrendingUp, Target, Shield,
  Trophy, FileText, Coins, Building2, RefreshCw, ArrowUpRight, User, Settings, Save, Upload, Edit3, X, Search, Compass, ListChecks
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { universities as allUniversities, studyCountriesRu } from '../data/universities';
import { matchUniversities, generateChecklist } from '../lib/matching';
import type { SavedUniversity, ChecklistItem, UniversityCategory, University } from '../types';
import UniversityDetailModal from './UniversityDetailModal';

const categoryConfig: Record<UniversityCategory, { icon: typeof Shield; color: string; bg: string; border: string; label: string; desc: string }> = {
  Safety: { icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-800/60', label: 'Запас', desc: 'Высокий шанс поступления' },
  Target: { icon: Target, color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-800/60', label: 'Цель', desc: 'Умеренный шанс поступления' },
  Reach: { icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-800/60', label: 'Мечта', desc: 'Амбициозная цель' },
};

const checklistCategoryIcons: Record<string, typeof FileText> = {
  Documents: FileText,
  Tests: Award,
  Applications: Building2,
  Finance: Coins,
};

const checklistCategoryLabels: Record<string, string> = {
  Documents: 'Документы',
  Tests: 'Тесты',
  Applications: 'Заявки',
  Finance: 'Финансы',
};

export default function Dashboard() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [universities, setUniversities] = useState<SavedUniversity[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [selectedUni, setSelectedUni] = useState<{ uni: University; category: UniversityCategory; matchScore: number } | null>(null);

  // Состояние активной вкладки ('ai' — подбор по анкете, 'catalog' — каталог всех вузов)
  const [activeTab, setActiveTab] = useState<'ai' | 'catalog'>('ai');

  // Состояния для каталога вузов
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  // Состояния для модального окна профиля
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [specialty, setSpecialty] = useState(profile?.specialty || '');
  const [gpa, setGpa] = useState(profile?.gpa?.toString() || '');
  const [ielts, setIelts] = useState(profile?.ielts_score?.toString() || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setCountry(profile.country || '');
      setSpecialty(profile.specialty || '');
      setGpa(profile.gpa?.toString() || '');
      setIelts(profile.ielts_score?.toString() || '');
    }
  }, [profile]);

  const fetchData = async () => {
    if (!user) return;
    const [uniRes, checkRes] = await Promise.all([
      supabase.from('saved_universities').select('*').eq('user_id', user.id).order('match_score', { ascending: false }),
      supabase.from('checklist_items').select('*').eq('user_id', user.id).order('deadline', { ascending: true }),
    ]);
    setUniversities((uniRes.data as SavedUniversity[]) || []);
    setChecklist((checkRes.data as ChecklistItem[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Получаем уникальные специальности для фильтра в каталоге
  const specialties = useMemo(() => {
    const specs = new Set<string>();
    allUniversities.forEach((u) => u.specialties.forEach((s: string) => specs.add(s)));
    return Array.from(specs);
  }, []);

  // Фильтрация каталога университетов
  const filteredCatalogUniversities = useMemo(() => {
    return allUniversities.filter((uni) => {
      const matchesSearch = uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            uni.nameRu.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            uni.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCountry = selectedCountry === 'all' || uni.country === selectedCountry;
      const matchesSpecialty = selectedSpecialty === 'all' || uni.specialties.includes(selectedSpecialty);
      return matchesSearch && matchesCountry && matchesSpecialty;
    });
  }, [searchQuery, selectedCountry, selectedSpecialty]);

  // Сжатие изображения для аватара
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0 || !user) return;
      setUploadingImage(true);
      const file = e.target.files[0];

      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        setUploadingImage(false);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const base64String = canvas.toDataURL('image/jpeg', 0.85);

          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: base64String })
            .eq('id', user.id);

          if (updateError) throw updateError;
          if (refreshProfile) await refreshProfile();
          setUploadingImage(false);
        };
      };

      reader.onerror = () => setUploadingImage(false);
    } catch {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        country: country,
        specialty: specialty,
        gpa: gpa ? parseFloat(gpa) : null,
        ielts_score: ielts ? parseFloat(ielts) : null,
      })
      .eq('id', user.id);

    if (!error) {
      if (refreshProfile) await refreshProfile();
      setIsProfileOpen(false);
    }
    setSavingProfile(false);
  };

  const toggleChecklistItem = async (item: ChecklistItem) => {
    const newCompleted = !item.is_completed;
    setChecklist((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_completed: newCompleted } : i))
    );
    await supabase
      .from('checklist_items')
      .update({ is_completed: newCompleted })
      .eq('id', item.id);
  };

  const regenerateMatches = async () => {
    if (!user || !profile) return;
    setRegenerating(true);

    const matches = matchUniversities({
      gpa: profile.gpa ?? 0,
      ieltsScore: profile.ielts_score ?? 0,
      specialty: profile.specialty ?? 'Other',
      desiredCountries: profile.desired_countries ?? [],
      financialSituation: profile.financial_situation ?? 'medium',
    });

    const uniRows = matches.map((m: any) => ({
      user_id: user.id,
      university_id: m.id,
      university_name: m.name,
      country: m.country,
      category: m.category,
      match_score: m.matchScore,
      tuition_fee: m.tuitionUsd,
    }));

    await supabase.from('saved_universities').delete().eq('user_id', user.id);
    if (uniRows.length > 0) {
      await supabase.from('saved_universities').insert(uniRows);
    }

    const checklistItems = generateChecklist({
      gpa: profile.gpa ?? 0,
      ieltsScore: profile.ielts_score ?? 0,
      specialty: profile.specialty ?? 'Other',
      desiredCountries: profile.desired_countries ?? [],
      financialSituation: profile.financial_situation ?? 'medium',
    });

    await supabase.from('checklist_items').delete().eq('user_id', user.id);
    await supabase.from('checklist_items').insert(
      checklistItems.map((item: any) => ({
        user_id: user.id,
        title: item.title,
        description: item.description,
        deadline: item.deadline,
        category: item.category,
      }))
    );

    await fetchData();
    setRegenerating(false);
  };

  const openUniversityDetail = (uni: University, category: UniversityCategory = 'Target', matchScore: number = 85) => {
    setSelectedUni({ uni, category, matchScore });
  };

  const openSavedUniversityDetail = (savedUni: SavedUniversity) => {
    const fullUni = allUniversities.find((u: University) => u.id === savedUni.university_id);
    if (fullUni) {
      setSelectedUni({ uni: fullUni, category: savedUni.category, matchScore: savedUni.match_score });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-3">
          <RefreshCw size={20} className="animate-spin text-cyan-400" />
          Загрузка вашего кабинета...
        </div>
      </div>
    );
  }

  const completedItems = checklist.filter((i) => i.is_completed).length;
  const totalItems = checklist.length;
  const checklistProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const financeLabel: Record<string, string> = {
    low: 'До $10k/год',
    medium: '$10k–$30k/год',
    high: '$30k+/год',
  };

  const daysUntil = (date: string | null) => {
    if (!date) return null;
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top nav */}
      <nav className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20">
              <GraduationCap size={20} />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">EduCompass</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-3 rounded-2xl bg-slate-900 border border-slate-800 p-1.5 pr-4 hover:border-cyan-500/50 transition-all shadow-sm group"
            >
              <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.full_name?.[0]?.toUpperCase() || <User size={16} />
                )}
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                {profile?.full_name || 'Личный кабинет'}
              </span>
            </button>

            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">
              Привет, {profile?.full_name || 'студент'}! 👋
            </h1>
            <p className="text-slate-400 mt-1">Твой персональный путеводитель по поступлению</p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'ai' && (
              <button
                onClick={regenerateMatches}
                disabled={regenerating}
                className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                <RefreshCw size={15} className={regenerating ? 'animate-spin' : ''} />
                Обновить подбор вузов
              </button>
            )}
          </div>
        </div>

        {/* Карточки с параметрами пользователя */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: MapPin, label: 'Страна', value: studyCountriesRu[profile?.country || ''] || profile?.country || '—' },
            { icon: BookOpen, label: 'Специальность', value: profile?.specialty || '—' },
            { icon: Award, label: 'GPA', value: profile?.gpa?.toFixed(2) || '—' },
            { icon: Award, label: 'IELTS', value: profile?.ielts_score?.toFixed(1) || '—' },
            { icon: DollarSign, label: 'Бюджет', value: financeLabel[profile?.financial_situation || ''] || '—' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Icon size={15} className="text-cyan-400" />
                  <span className="text-xs font-medium uppercase tracking-wide">{item.label}</span>
                </div>
                <div className="text-lg font-bold text-white truncate">{item.value}</div>
              </div>
            );
          })}
        </div>

        {/* Переключатель вкладок (Мой подбор ИИ / Каталог мира) */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'ai'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white bg-slate-900/40 border border-transparent'
            }`}
          >
            <Compass size={18} />
            Мой подбор ИИ
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'catalog'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white bg-slate-900/40 border border-transparent'
            }`}
          >
            <ListChecks size={18} />
            Каталог вузов мира
          </button>
        </div>

        {/* КОНТЕНТ ВКЛАДКИ: МОЙ ПОДБОР ИИ */}
        {activeTab === 'ai' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Рекомендации под ваш профиль</h2>
                <span className="text-sm text-slate-400">{universities.length} вузов</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['Safety', 'Target', 'Reach'] as UniversityCategory[]).map((cat) => {
                  const config = categoryConfig[cat];
                  const count = universities.filter((u) => u.category === cat).length;
                  const Icon = config.icon;
                  return (
                    <div key={cat} className={`rounded-2xl border ${config.border} ${config.bg} p-4 backdrop-blur-sm`}>
                      <div className="flex items-center justify-between mb-1">
                        <Icon size={18} className={config.color} />
                        <span className={`text-2xl font-bold ${config.color}`}>{count}</span>
                      </div>
                      <div className={`text-sm font-semibold ${config.color}`}>{config.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{config.desc}</div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                {universities.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center bg-slate-900/30">
                    <p className="text-slate-400">Университеты ещё не подобраны. Нажмите «Обновить подбор вузов».</p>
                  </div>
                ) : (
                  universities.map((uni) => {
                    const config = categoryConfig[uni.category];
                    const CatIcon = config.icon;
                    return (
                      <button
                        key={uni.id}
                        onClick={() => openSavedUniversityDetail(uni)}
                        className="group w-full text-left rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-900 hover:border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`inline-flex items-center gap-1 rounded-full ${config.bg} ${config.color} px-2.5 py-0.5 text-xs font-semibold border ${config.border}`}>
                                <CatIcon size={11} />
                                {config.label}
                              </span>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <MapPin size={11} />
                                {studyCountriesRu[uni.country] || uni.country}
                              </span>
                            </div>
                            <h3 className="font-bold text-white text-base leading-tight mb-2 group-hover:text-cyan-400 transition-colors">
                              {allUniversities.find((u: University) => u.id === uni.university_id)?.nameRu || uni.university_name}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span className="flex items-center gap-1">
                                <Trophy size={13} className="text-amber-400" />
                                {uni.match_score}% совпадение
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign size={13} />
                                ${uni.tuition_fee.toLocaleString()}/год
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-2 flex-shrink-0">
                            <div className="relative w-14 h-14">
                              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                                <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-800" />
                                <circle
                                  cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4"
                                  className={config.color}
                                  strokeDasharray={`${(uni.match_score / 100) * 150.8} 150.8`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${config.color}`}>
                                {uni.match_score}
                              </div>
                            </div>
                            <ArrowUpRight size={14} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Чек-лист подготовки */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Чек-лист</h2>
                <span className="text-sm text-slate-400">{completedItems}/{totalItems}</span>
              </div>

              <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-5">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-800" />
                      <circle
                        cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6"
                        className="text-emerald-400"
                        strokeDasharray={`${(checklistProgress / 100) * 213.6} 213.6`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                      {checklistProgress}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Прогресс подготовки</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {completedItems} из {totalItems} задач выполнено
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {checklist.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center bg-slate-900/30">
                    <p className="text-sm text-slate-400">Нет задач в чек-листе.</p>
                  </div>
                ) : (
                  checklist.map((item) => {
                    const days = daysUntil(item.deadline);
                    const isOverdue = days !== null && days < 0 && !item.is_completed;
                    const CatIcon = checklistCategoryIcons[item.category] || FileText;
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleChecklistItem(item)}
                        className="group w-full text-left rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-900 hover:border-slate-700"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 mt-0.5 ${item.is_completed ? 'text-emerald-400' : 'text-slate-600 group-hover:text-cyan-400'}`}>
                            {item.is_completed ? <Check size={18} /> : <Circle size={18} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <CatIcon size={12} className="text-slate-500" />
                              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                                {checklistCategoryLabels[item.category] || item.category}
                              </span>
                            </div>
                            <h4 className={`text-sm font-semibold leading-tight ${item.is_completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                              {item.title}
                            </h4>
                            {item.description && (
                              <p className={`text-xs mt-1 leading-relaxed ${item.is_completed ? 'text-slate-600' : 'text-slate-400'}`}>
                                {item.description}
                              </p>
                            )}
                            {item.deadline && (
                              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isOverdue ? 'text-red-400' : days !== null && days <= 14 ? 'text-amber-400' : 'text-slate-500'}`}>
                                <Calendar size={11} />
                                {isOverdue
                                  ? `просрочено на ${Math.abs(days!)} дн.`
                                  : days !== null && days === 0
                                    ? 'сегодня'
                                    : days !== null
                                      ? `${days} дн. осталось`
                                      : item.deadline}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* КОНТЕНТ ВКЛАДКИ: КАТАЛОГ ВУЗОВ МИРА */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Все университеты мира</h2>
                <p className="text-sm text-slate-400 mt-0.5">Самостоятельный поиск и фильтрация по странам и направлениям</p>
              </div>
              <span className="text-sm text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-3.5 py-1.5 rounded-xl font-semibold">
                Найдено: {filteredCatalogUniversities.length}
              </span>
            </div>

            {/* Фильтры и поиск каталога */}
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

            {/* Карточки каталога */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCatalogUniversities.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/30">
                  <p className="text-slate-400">По вашему запросу университетов не найдено. Измените параметры фильтрации.</p>
                </div>
              ) : (
                filteredCatalogUniversities.map((uni) => (
                  <div
                    key={uni.id}
                    onClick={() => openUniversityDetail(uni)}
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
        )}
      </div>

      {/* Модальное окно профиля */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
                  <Settings size={18} />
                </div>
                <h3 className="text-lg font-bold text-white">Личный кабинет и данные</h3>
              </div>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60">
              <div className="relative group">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile?.full_name?.[0]?.toUpperCase() || <User size={28} />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity rounded-2xl"
                >
                  <Edit3 size={18} />
                </button>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Фото профиля</h4>
                <p className="text-xs text-slate-400 mt-0.5">Выберите файл изображения с устройства</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Upload size={13} className="text-cyan-400" />
                  {uploadingImage ? 'Обработка...' : 'Выбрать файл'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                  <User size={14} className="text-cyan-400" /> Имя и Фамилия
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
                  placeholder="Ваше имя"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                    <MapPin size={14} className="text-cyan-400" /> Страна
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
                    placeholder="Казахстан"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                    <BookOpen size={14} className="text-cyan-400" /> Специальность
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
                    placeholder="Marketing / Business"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                    <Award size={14} className="text-cyan-400" /> GPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
                    placeholder="4.0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 href outline-none text-slate-400 mb-1 flex items-center gap-1.5">
                    <Award size={14} className="text-cyan-400" /> IELTS
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={ielts}
                    onChange={(e) => setIelts(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
                    placeholder="7.0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  <Save size={14} />
                  {savingProfile ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedUni && (
        <UniversityDetailModal
          university={selectedUni.uni}
          category={selectedUni.category}
          matchScore={selectedUni.matchScore}
          onClose={() => setSelectedUni(null)}
        />
      )}
    </div>
  );
}