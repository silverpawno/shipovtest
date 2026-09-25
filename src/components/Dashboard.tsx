import { useEffect, useState, useMemo, useRef } from 'react';
import {
  GraduationCap, LogOut, MapPin, BookOpen, Award, DollarSign,
  Check, Circle, Calendar, TrendingUp, Target, Shield,
  Trophy, FileText, Coins, Building2, RefreshCw, ArrowUpRight, User, Settings, Save, Upload, Edit3, X, Search, Compass, ListChecks, Sun, Moon, Sparkles, MessageSquarePlus, Kanban, Briefcase, Plus, Trash2, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { universities as allUniversities, studyCountriesRu } from '../data/universities';
import { matchUniversities, generateChecklist } from '../lib/matching';
import type { SavedUniversity, ChecklistItem, UniversityCategory, University } from '../types';
import UniversityDetailModal from './UniversityDetailModal';

const categoryConfig: Record<UniversityCategory, { icon: typeof Shield; color: string; bg: string; border: string; label: string; desc: string }> = {
  Safety: { icon: Shield, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-950/40', border: 'border-emerald-500/20 dark:border-emerald-800/60', label: 'Запас', desc: 'Высокий шанс поступления' },
  Target: { icon: Target, color: 'text-cyan-500 dark:text-cyan-400', bg: 'bg-cyan-500/10 dark:bg-cyan-950/40', border: 'border-cyan-500/20 dark:border-cyan-800/60', label: 'Цель', desc: 'Умеренный шанс поступления' },
  Reach: { icon: TrendingUp, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-950/40', border: 'border-amber-500/20 dark:border-amber-800/60', label: 'Мечта', desc: 'Амбициозная цель' },
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

type AppStage = 'research' | 'essay' | 'submitted' | 'accepted';

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
}

export default function Dashboard() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [universities, setUniversities] = useState<SavedUniversity[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [selectedUni, setSelectedUni] = useState<{ uni: University; category: UniversityCategory; matchScore: number } | null>(null);

  const [activeTab, setActiveTab] = useState<'ai' | 'catalog' | 'pipeline' | 'portfolio' | 'insights'>('ai');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [maxBudget, setMaxBudget] = useState<number>(50000);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [specialty, setSpecialty] = useState(profile?.specialty || '');
  const [gpa, setGpa] = useState(profile?.gpa?.toString() || '');
  const [ielts, setIelts] = useState(profile?.ielts_score?.toString() || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Персистентные заметки и статусы (хранятся в БД)
  const [uniNotes, setUniNotes] = useState<Record<string, string>>({});
  const [uniStages, setUniStages] = useState<Record<string, AppStage>>({});
  const [activeNoteUniId, setActiveNoteUniId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Портфолио внеучебных достижений
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [newPortfolioTitle, setNewPortfolioTitle] = useState('');
  const [newPortfolioCategory, setNewPortfolioCategory] = useState('Academic');
  const [newPortfolioDesc, setNewPortfolioDesc] = useState('');

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
    const [uniRes, checkRes, portfolioRes] = await Promise.all([
      supabase.from('saved_universities').select('*').eq('user_id', user.id).order('match_score', { ascending: false }),
      supabase.from('checklist_items').select('*').eq('user_id', user.id).order('deadline', { ascending: true }),
      supabase.from('user_portfolio').select('*').eq('user_id', user.id),
    ]);

    const unis = (uniRes.data as SavedUniversity[]) || [];
    setUniversities(unis);
    setChecklist((checkRes.data as ChecklistItem[]) || []);

    const notesMap: Record<string, string> = {};
    const stagesMap: Record<string, AppStage> = {};
    unis.forEach((u: any) => {
      if (u.note) notesMap[u.university_id] = u.note;
      if (u.stage) stagesMap[u.university_id] = u.stage;
    });
    setUniNotes(notesMap);
    setUniStages(stagesMap);

    setPortfolio((portfolioRes.data as PortfolioItem[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const specialties = useMemo(() => {
    const specs = new Set<string>();
    allUniversities.forEach((u) => u.specialties.forEach((s: string) => specs.add(s)));
    return Array.from(specs);
  }, []);

  const filteredCatalogUniversities = useMemo(() => {
    return allUniversities.filter((uni) => {
      const matchesSearch = uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            uni.nameRu.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            uni.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCountry = selectedCountry === 'all' || uni.country === selectedCountry;
      const matchesSpecialty = selectedSpecialty === 'all' || uni.specialties.includes(selectedSpecialty);
      const matchesBudget = uni.tuitionUsd <= maxBudget;
      return matchesSearch && matchesCountry && matchesSpecialty && matchesBudget;
    });
  }, [searchQuery, selectedCountry, selectedSpecialty, maxBudget]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0 || !user) return;
      setUploadingImage(true);
      const file = e.target.files[0];
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
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const base64String = canvas.toDataURL('image/jpeg', 0.85);

          await supabase.from('profiles').update({ avatar_url: base64String }).eq('id', user.id);
          if (refreshProfile) await refreshProfile();
          setUploadingImage(false);
        };
      };
    } catch {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);

    await supabase.from('profiles').update({
      full_name: fullName,
      country: country,
      specialty: specialty,
      gpa: gpa ? parseFloat(gpa) : null,
      ielts_score: ielts ? parseFloat(ielts) : null,
    }).eq('id', user.id);

    if (refreshProfile) await refreshProfile();
    setIsProfileOpen(false);
    setSavingProfile(false);
  };

  const toggleChecklistItem = async (item: ChecklistItem) => {
    const newCompleted = !item.is_completed;
    setChecklist((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_completed: newCompleted } : i)));
    await supabase.from('checklist_items').update({ is_completed: newCompleted }).eq('id', item.id);
  };

  // Сохранение заметки и статуса в таблицу saved_universities
  const saveNoteAndStage = async (uniId: string, newNote: string, newStage: AppStage) => {
    if (!user) return;
    setUniNotes((prev) => ({ ...prev, [uniId]: newNote }));
    setUniStages((prev) => ({ ...prev, [uniId]: newStage }));
    setActiveNoteUniId(null);

    await supabase.from('saved_universities').update({
      note: newNote,
      stage: newStage,
    }).eq('user_id', user.id).eq('university_id', uniId);
  };

  // Добавление записи в портфолио
  const addPortfolioItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPortfolioTitle) return;
    const newItem = {
      user_id: user.id,
      title: newPortfolioTitle,
      category: newPortfolioCategory,
      description: newPortfolioDesc,
      date: new Date().toISOString().split('T')[0],
    };

    const { data, error } = await supabase.from('user_portfolio').insert(newItem).select().single();
    if (!error && data) {
      setPortfolio((prev) => [data, ...prev]);
      setNewPortfolioTitle('');
      setNewPortfolioDesc('');
      setIsPortfolioModalOpen(false);
    }
  };

  const deletePortfolioItem = async (id: string) => {
    setPortfolio((prev) => prev.filter((i) => i.id !== id));
    await supabase.from('user_portfolio').delete().eq('id', id);
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
    if (uniRows.length > 0) await supabase.from('saved_universities').insert(uniRows);

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

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${isDarkMode ? 'bg-[#09090b] text-zinc-300' : 'bg-[#f8f9fa] text-zinc-700'}`}>
        <div className="flex items-center gap-3 font-mono text-xs">
          <RefreshCw size={16} className="animate-spin text-indigo-500" />
          Синхронизация данных с сервером...
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
    <div className={`min-h-screen transition-colors duration-700 flex flex-col ${
      isDarkMode ? 'bg-[#09090b] text-zinc-100' : 'bg-[#f8f9fa] text-zinc-800'
    }`}>
      <div className={`pointer-events-none absolute top-0 left-1/4 w-[600px] h-[300px] rounded-full blur-[160px] opacity-15 ${isDarkMode ? 'bg-indigo-600' : 'bg-indigo-400/30'}`} />

      {/* Навигация */}
      <nav className={`sticky top-0 z-30 border-b backdrop-blur-xl ${isDarkMode ? 'border-zinc-800/80 bg-[#09090b]/80' : 'border-zinc-200/60 bg-white/70 shadow-sm'}`}>
        <div className="mx-auto max-w-6xl px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${isDarkMode ? 'border-zinc-800 bg-zinc-900 text-indigo-400' : 'border-zinc-200 bg-white text-indigo-600 shadow-sm'}`}>
              <GraduationCap size={18} />
            </div>
            <span className="text-base font-black tracking-tight">EduCompass Pro</span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-xl border transition-all ${isDarkMode ? 'border-zinc-800 bg-zinc-900 text-amber-400' : 'border-zinc-200 bg-white text-amber-600 shadow-sm'}`}>
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button onClick={() => setIsProfileOpen(true)} className={`flex items-center gap-2.5 rounded-2xl border p-1.5 pr-3.5 transition-all ${isDarkMode ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-white shadow-sm'}`}>
              <div className="relative w-7 h-7 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : (profile?.full_name?.[0]?.toUpperCase() || <User size={14} />)}
              </div>
              <span className="text-xs font-semibold">{profile?.full_name || 'Кабинет'}</span>
            </button>
            <button onClick={signOut} className={`p-2 rounded-xl border ${isDarkMode ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-red-400' : 'border-zinc-200 bg-white text-zinc-600 hover:text-red-600 shadow-sm'}`} title="Выйти">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8 flex-1 w-full relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Привет, {profile?.full_name || 'студент'}! 👋</h1>
            <p className={`text-xs font-light mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Интеллектуальная система управления поступлением</p>
          </div>
          {activeTab === 'ai' && (
            <button onClick={regenerateMatches} disabled={regenerating} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${isDarkMode ? 'border-zinc-800 bg-zinc-900 text-zinc-200' : 'border-zinc-200 bg-white text-zinc-700 shadow-sm'}`}>
              <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
              Пересчитать ИИ-модель
            </button>
          )}
        </div>

        {/* Сводка профиля */}
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
              <div key={item.label} className={`rounded-2xl border p-4 backdrop-blur-xl ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200/80 bg-white shadow-sm'}`}>
                <div className={`flex items-center gap-2 mb-2 text-[11px] font-mono uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  <Icon size={14} className="text-indigo-500" />
                  <span>{item.label}</span>
                </div>
                <div className="text-sm font-bold truncate">{item.value}</div>
              </div>
            );
          })}
        </div>

        {/* Навигационные вкладки */}
        <div className={`flex items-center gap-2 border-b pb-4 overflow-x-auto ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          {[
            { id: 'ai', label: 'Мой подбор ИИ', icon: Compass },
            { id: 'catalog', label: 'Каталог вузов', icon: ListChecks },
            { id: 'pipeline', label: 'Трекер заявок', icon: Kanban },
            { id: 'portfolio', label: 'Мое портфолио', icon: Briefcase },
            { id: 'insights', label: 'Аналитика', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                  isActive
                    ? isDarkMode ? 'border-white bg-zinc-100 text-black shadow-md' : 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                    : isDarkMode ? 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white' : 'border-zinc-200 bg-white text-zinc-600 hover:text-black shadow-sm'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ВКЛАДКА: AI РЕКОМЕНДАЦИИ */}
        {activeTab === 'ai' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Рекомендованные университеты</h2>
                <span className={`text-xs font-mono ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{universities.length} вузов</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['Safety', 'Target', 'Reach'] as UniversityCategory[]).map((cat) => {
                  const config = categoryConfig[cat];
                  const count = universities.filter((u) => u.category === cat).length;
                  const Icon = config.icon;
                  return (
                    <div key={cat} className={`rounded-2xl border ${config.border} ${config.bg} p-4 backdrop-blur-xl`}>
                      <div className="flex items-center justify-between mb-1">
                        <Icon size={18} className={config.color} />
                        <span className={`text-xl font-black ${config.color}`}>{count}</span>
                      </div>
                      <div className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>{config.label}</div>
                      <div className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{config.desc}</div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                {universities.length === 0 ? (
                  <div className={`rounded-2xl border border-dashed p-8 text-center ${isDarkMode ? 'border-zinc-800 bg-zinc-900/30 text-zinc-400' : 'border-zinc-300 bg-white text-zinc-500'}`}>
                    <p className="text-xs">Университеты не найдены. Нажмите кнопку пересчета ИИ-модели.</p>
                  </div>
                ) : (
                  universities.map((uni) => {
                    const config = categoryConfig[uni.category];
                    const CatIcon = config.icon;
                    const hasNote = uniNotes[uni.university_id];
                    const currentStage = uniStages[uni.university_id] || 'research';
                    return (
                      <div
                        key={uni.id}
                        className={`group rounded-2xl border p-5 backdrop-blur-xl transition-all ${
                          isDarkMode ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700' : 'border-zinc-200/80 bg-white shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                            const fullUni = allUniversities.find((u: University) => u.id === uni.university_id);
                            if (fullUni) setSelectedUni({ uni: fullUni, category: uni.category, matchScore: uni.match_score });
                          }}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`inline-flex items-center gap-1 rounded-full ${config.bg} ${config.color} px-2.5 py-0.5 text-[11px] font-bold border ${config.border}`}>
                                <CatIcon size={11} /> {config.label}
                              </span>
                              <span className={`text-[11px] font-mono flex items-center gap-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                <MapPin size={11} /> {studyCountriesRu[uni.country] || uni.country}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                Статус: {currentStage}
                              </span>
                            </div>
                            <h3 className="font-bold text-sm leading-tight mb-2 group-hover:text-indigo-500 transition-colors">
                              {allUniversities.find((u: University) => u.id === uni.university_id)?.nameRu || uni.university_name}
                            </h3>
                            <div className={`flex items-center gap-4 text-xs font-mono ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              <span className="flex items-center gap-1"><Trophy size={13} className="text-amber-400" /> {uni.match_score}% совпадение</span>
                              <span className="flex items-center gap-1"><DollarSign size={13} /> ${uni.tuition_fee.toLocaleString()}/год</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center gap-3 flex-shrink-0">
                            <button 
                              onClick={() => { setActiveNoteUniId(uni.university_id); setNoteText(uniNotes[uni.university_id] || ''); }}
                              className={`p-2 rounded-xl border transition-colors ${hasNote ? 'text-indigo-500 border-indigo-500/30 bg-indigo-500/10' : isDarkMode ? 'text-zinc-500 border-zinc-800 hover:text-zinc-300' : 'text-zinc-400 border-zinc-200'}`}
                              title="Редактировать заметку и статус"
                            >
                              <MessageSquarePlus size={16} />
                            </button>
                          </div>
                        </div>

                        {hasNote && (
                          <div className={`mt-3 p-3 rounded-xl text-xs border font-mono ${isDarkMode ? 'bg-zinc-950/60 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'}`}>
                            <span className="font-bold text-indigo-500 mr-2">Заметка:</span> {hasNote}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Чек-лист */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Чек-лист задач</h2>
                <span className={`text-xs font-mono ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{completedItems}/{totalItems}</span>
              </div>

              <div className={`rounded-2xl border p-6 backdrop-blur-xl ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200/80 bg-white shadow-sm'}`}>
                <div className="flex items-center gap-5">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className={isDarkMode ? 'text-zinc-800' : 'text-zinc-200'} />
                      <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-emerald-500" strokeDasharray={`${(checklistProgress / 100) * 213.6} 213.6`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">{checklistProgress}%</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">Прогресс подготовки</div>
                    <div className={`text-[11px] mt-1 font-mono ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{completedItems} из {totalItems} задач выполнено</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {checklist.map((item) => {
                  const days = daysUntil(item.deadline);
                  const isOverdue = days !== null && days < 0 && !item.is_completed;
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleChecklistItem(item)}
                      className={`group w-full text-left rounded-xl border p-3.5 backdrop-blur-xl transition-all ${
                        isDarkMode ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700' : 'border-zinc-200/80 bg-white shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 mt-0.5 ${item.is_completed ? 'text-emerald-500' : isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                          {item.is_completed ? <Check size={16} /> : <Circle size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-xs font-semibold leading-tight ${item.is_completed ? 'text-zinc-500 line-through' : ''}`}>{item.title}</h4>
                          {item.deadline && (
                            <div className={`flex items-center gap-1 mt-2 text-[10px] font-mono ${isOverdue ? 'text-red-500' : days !== null && days <= 14 ? 'text-amber-500' : 'text-zinc-500'}`}>
                              <Calendar size={11} /> {isOverdue ? `просрочено на ${Math.abs(days!)} дн.` : `${days} дн. осталось`}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ВКЛАДКА: КАТАЛОГ ВУЗОВ */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Каталог университетов мира</h2>
                <p className={`text-xs font-light mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Продвинутый фильтр по направлениям и финансовым требованиям</p>
              </div>
              <span className="text-xs font-mono text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl font-semibold">Найдено: {filteredCatalogUniversities.length}</span>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-4 gap-3 border p-4 rounded-2xl backdrop-blur-xl ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200/80 bg-white shadow-sm'}`}>
              <div className="relative">
                <Search size={15} className={`absolute left-3.5 top-3.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по вузу или городу..."
                  className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium outline-none ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`}
                />
              </div>

              <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`}>
                <option value="all">Все страны</option>
                {Object.entries(studyCountriesRu).map(([key, name]) => (<option key={key} value={key}>{name}</option>))}
              </select>

              <select value={selectedSpecialty} onChange={(e) => setSelectedSpecialty(e.target.value)} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`}>
                <option value="all">Все специальности</option>
                {specialties.map((spec) => (<option key={spec} value={spec}>{spec}</option>))}
              </select>

              <select value={maxBudget} onChange={(e) => setMaxBudget(Number(e.target.value))} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`}>
                <option value={50000}>Макс. бюджет: Любой</option>
                <option value={10000}>Бюджет до $10,000 / год</option>
                <option value={20000}>Бюджет до $20,000 / год</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCatalogUniversities.map((uni) => (
                <div key={uni.id} onClick={() => setSelectedUni({ uni, category: 'Target', matchScore: 85 })} className={`group cursor-pointer rounded-2xl border p-5 backdrop-blur-xl flex flex-col justify-between ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700' : 'border-zinc-200/80 bg-white shadow-sm'}`}>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                        <MapPin size={11} /> {studyCountriesRu[uni.country] || uni.country}, {uni.city}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm leading-tight mb-2 group-hover:text-indigo-500 transition-colors">{uni.nameRu}</h3>
                    <p className={`text-xs line-clamp-2 mb-4 font-light ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{uni.descriptionRu}</p>
                  </div>
                  <div className={`flex items-center justify-between pt-3 border-t text-xs font-mono ${isDarkMode ? 'border-zinc-800/80' : 'border-zinc-100'}`}>
                    <span className="font-semibold flex items-center gap-1"><DollarSign size={13} className="text-emerald-500" /> ${uni.tuitionUsd.toLocaleString()} / год</span>
                    <span className="text-indigo-500 flex items-center gap-1 font-bold group-hover:underline">Подробнее <ArrowUpRight size={13} /></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ВКЛАДКА: ТРЕКЕР ЗАЯВОК (KANBAN) */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold">Канбан-трекер статусов вузов</h2>
              <p className={`text-xs font-light mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Отслеживайте прогресс взаимодействия с приемными комиссиями</p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {[
                { id: 'research', title: '1. Изучение', color: 'border-zinc-700 text-zinc-400' },
                { id: 'essay', title: '2. Эссе и документы', color: 'border-amber-500/30 text-amber-400' },
                { id: 'submitted', title: '3. Заявка отправлена', color: 'border-cyan-500/30 text-cyan-400' },
                { id: 'accepted', title: '4. Оффер получен! 🎉', color: 'border-emerald-500/30 text-emerald-400' },
              ].map((col) => {
                const unisInCol = universities.filter((u) => (uniStages[u.university_id] || 'research') === col.id);
                return (
                  <div key={col.id} className={`rounded-2xl border p-4 backdrop-blur-xl space-y-3 ${isDarkMode ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-200 bg-white shadow-sm'}`}>
                    <div className={`text-xs font-bold uppercase tracking-wider pb-2 border-b border-dashed ${col.color}`}>
                      {col.title} ({unisInCol.length})
                    </div>
                    <div className="space-y-2.5">
                      {unisInCol.map((u) => {
                        const fullUni = allUniversities.find((item) => item.id === u.university_id);
                        return (
                          <div key={u.id} className={`p-3 rounded-xl border text-xs font-medium ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-800'}`}>
                            <div className="font-bold mb-1">{fullUni?.nameRu || u.university_name}</div>
                            <div className="text-[10px] font-mono text-indigo-400">{studyCountriesRu[u.country] || u.country}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ВКЛАДКА: ПОРТФОЛИО */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Внеучебные достижения и проекты</h2>
                <p className={`text-xs font-light mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Ваше портфолио для усиления мотивационных писем</p>
              </div>
              <button onClick={() => setIsPortfolioModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all">
                <Plus size={14} /> Добавить проект
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {portfolio.length === 0 ? (
                <div className={`col-span-full rounded-2xl border border-dashed p-8 text-center ${isDarkMode ? 'border-zinc-800 text-zinc-400' : 'border-zinc-300 text-zinc-500'}`}>
                  <p className="text-xs">Портфолио пока пусто. Добавьте свои проекты, сертификаты или олимпиады.</p>
                </div>
              ) : (
                portfolio.map((item) => (
                  <div key={item.id} className={`rounded-2xl border p-5 backdrop-blur-xl flex flex-col justify-between space-y-3 ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white shadow-sm'}`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{item.category}</span>
                        <button onClick={() => deletePortfolioItem(item.id)} className="text-zinc-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </div>
                      <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                      <p className={`text-xs font-light ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{item.description}</p>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 pt-2 border-t border-dashed border-zinc-800">{item.date}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ВКЛАДКА: АНАЛИТИКА */}
        {activeTab === 'insights' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className={`rounded-2xl border p-6 backdrop-blur-xl space-y-4 ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white shadow-sm'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500"><Sparkles size={20} /></div>
                <div>
                  <h3 className="text-sm font-bold">Оценка шансов поступления</h3>
                  <p className={`text-xs font-light ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Анализ академического профиля</p>
                </div>
              </div>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                Ваш текущий GPA ({profile?.gpa || '—'}) и IELTS ({profile?.ielts_score || '—'}) соответствуют требованиям большинства университетов категории **Target**.
              </p>
            </div>
            <div className={`rounded-2xl border p-6 backdrop-blur-xl space-y-4 ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white shadow-sm'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500"><Calendar size={20} /></div>
                <div>
                  <h3 className="text-sm font-bold">Стратегия дедлайнов</h3>
                  <p className={`text-xs font-light ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Сроки подачи документов</p>
                </div>
              </div>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                Ранняя подача (Early Action) обычно завершается 1 ноября. Регулярная подача (Regular Decision) — с января по март.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно заметки и статуса */}
      {activeNoteUniId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-4 ${isDarkMode ? 'border-zinc-800 bg-zinc-900 text-zinc-100' : 'border-zinc-200 bg-white text-zinc-800'}`}>
            <h3 className="text-sm font-bold">Редактировать университет</h3>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5 text-zinc-400">Статус заявки</label>
              <select
                id="modalStageSelect"
                defaultValue={uniStages[activeNoteUniId] || 'research'}
                className={`w-full rounded-xl border p-2.5 text-xs font-medium outline-none ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`}
              >
                <option value="research">1. Изучение</option>
                <option value="essay">2. Эссе и документы</option>
                <option value="submitted">3. Заявка отправлена</option>
                <option value="accepted">4. Оффер получен</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5 text-zinc-400">Персональная заметка</label>
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className={`w-full rounded-xl border p-3 text-xs font-medium outline-none ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setActiveNoteUniId(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Отмена</button>
              <button
                onClick={() => {
                  const selectEl = document.getElementById('modalStageSelect') as HTMLSelectElement;
                  saveNoteAndStage(activeNoteUniId, noteText, (selectEl?.value || 'research') as AppStage);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider"
              >
                Сохранить в БД
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления в портфолио */}
      {isPortfolioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <form onSubmit={addPortfolioItem} className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-4 ${isDarkMode ? 'border-zinc-800 bg-zinc-900 text-zinc-100' : 'border-zinc-200 bg-white text-zinc-800'}`}>
            <h3 className="text-sm font-bold">Добавить достижение / проект</h3>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5 text-zinc-400">Название</label>
              <input type="text" required value={newPortfolioTitle} onChange={(e) => setNewPortfolioTitle(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs font-medium outline-none ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`} placeholder="Напр. Дизайн-проект платформы" />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5 text-zinc-400">Категория</label>
              <select value={newPortfolioCategory} onChange={(e) => setNewPortfolioCategory(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs font-medium outline-none ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`}>
                <option value="Academic">Академическое</option>
                <option value="Extracurricular">Внеучебное / Волонтерство</option>
                <option value="Tech & Design">Технологии и Дизайн</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5 text-zinc-400">Описание</label>
              <textarea rows={3} value={newPortfolioDesc} onChange={(e) => setNewPortfolioDesc(e.target.value)} className={`w-full rounded-xl border p-3 text-xs font-medium outline-none ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`} placeholder="Краткие детали достижения..." />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsPortfolioModalOpen(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Отмена</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider">Добавить</button>
            </div>
          </form>
        </div>
      )}

      {/* Модальное окно профиля */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className={`relative w-full max-w-lg rounded-3xl border p-6 shadow-2xl space-y-6 ${isDarkMode ? 'border-zinc-800 bg-zinc-900 text-zinc-100' : 'border-zinc-200 bg-white text-zinc-800'}`}>
            <div className="flex items-center justify-between border-b pb-4 border-zinc-800">
              <h3 className="text-base font-bold">Настройки профиля</h3>
              <button onClick={() => setIsProfileOpen(false)} className="p-2 rounded-xl border border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:text-white"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1.5 text-zinc-400">Имя</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs font-medium outline-none ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider mb-1.5 text-zinc-400">GPA</label>
                  <input type="number" step="0.01" value={gpa} onChange={(e) => setGpa(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs font-medium outline-none ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`} />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider mb-1.5 text-zinc-400">IELTS</label>
                  <input type="number" step="0.5" value={ielts} onChange={(e) => setIelts(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs font-medium outline-none ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button type="submit" disabled={savingProfile} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white">
                  <Save size={14} /> {savingProfile ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedUni && (
        <UniversityDetailModal university={selectedUni.uni} category={selectedUni.category} matchScore={selectedUni.matchScore} onClose={() => setSelectedUni(null)} />
      )}
    </div>
  );
}