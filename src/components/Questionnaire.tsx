import { useState } from 'react';
import { Check, ChevronRight, ChevronLeft, User, MapPin, BookOpen, Award, DollarSign, Plane, Sparkles, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { countries, specialties, studyCountries, studyCountriesRu, financialOptions } from '../data/universities';
import { matchUniversities, generateChecklist } from '../lib/matching';
import { supabase } from '../lib/supabase';

const steps = [
  { key: 'name', icon: User, title: 'Как вас зовут?', subtitle: 'Давайте персонализируем ваш опыт' },
  { key: 'country', icon: MapPin, title: 'Откуда вы?', subtitle: 'Выберите вашу страну' },
  { key: 'specialty', icon: BookOpen, title: 'Что хотите изучать?', subtitle: 'Выберите желаемую специальность' },
  { key: 'academic', icon: Award, title: 'Ваш академический профиль', subtitle: 'Расскажите об оценках и уровне английского' },
  { key: 'finance', icon: DollarSign, title: 'Финансовое положение', subtitle: 'Сколько ваша семья может тратить в год?' },
  { key: 'destinations', icon: Plane, title: 'Желаемые страны обучения', subtitle: 'Где бы вы хотели учиться?' },
] as const;

export default function Questionnaire() {
  const { user, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [gpa, setGpa] = useState('');
  const [ielts, setIelts] = useState('');
  const [finance, setFinance] = useState('');
  const [destinations, setDestinations] = useState<string[]>([]);

  const canProceed = () => {
    switch (steps[currentStep].key) {
      case 'name': return fullName.trim().length > 0;
      case 'country': return country.length > 0;
      case 'specialty': return specialty.length > 0;
      case 'academic': return gpa !== '' && ielts !== '' && Number(gpa) > 0 && Number(ielts) >= 0;
      case 'finance': return finance.length > 0;
      case 'destinations': return destinations.length > 0;
      default: return false;
    }
  };

  const toggleDestination = (c: string) => {
    setDestinations((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

    const gpaNum = Number(gpa);
    const ieltsNum = Number(ielts);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        country,
        specialty,
        gpa: gpaNum,
        ielts_score: ieltsNum,
        financial_situation: finance,
        desired_countries: destinations,
        profile_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      setError('Не удалось сохранить профиль. Попробуйте снова.');
      setSaving(false);
      return;
    }

    const matches = matchUniversities({
      gpa: gpaNum,
      ieltsScore: ieltsNum,
      specialty,
      desiredCountries: destinations,
      financialSituation: finance,
    });

    const uniRows = matches.map((m: { id: string; name: string; country: string; category: string; matchScore: number; tuitionUsd: number }) => ({
      user_id: user.id,
      university_id: m.id,
      university_name: m.name,
      country: m.country,
      category: m.category,
      match_score: m.matchScore,
      tuition_fee: m.tuitionUsd,
    }));

    if (uniRows.length > 0) {
      await supabase.from('saved_universities').delete().eq('user_id', user.id);
      await supabase.from('saved_universities').insert(uniRows);
    }

    const checklist = generateChecklist({
      gpa: gpaNum,
      ieltsScore: ieltsNum,
      specialty,
      desiredCountries: destinations,
      financialSituation: finance,
    });

    await supabase.from('checklist_items').delete().eq('user_id', user.id);
    await supabase.from('checklist_items').insert(
      checklist.map((item: { title: string; description: string; deadline: string; category: string }) => ({
        user_id: user.id,
        title: item.title,
        description: item.description,
        deadline: item.deadline,
        category: item.category,
      }))
    );

    await refreshProfile();
    setSaving(false);
  };

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const back = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`min-h-screen transition-colors duration-700 flex flex-col ${
      isDarkMode 
        ? 'bg-[#09090b] text-zinc-100 selection:bg-zinc-100 selection:text-black' 
        : 'bg-[#f8f9fa] text-zinc-800 selection:bg-zinc-900 selection:text-white'
    }`}>
      {/* Фоновый градиент */}
      <div className={`pointer-events-none absolute top-0 left-1/4 w-[600px] h-[300px] rounded-full blur-[160px] opacity-15 ${
        isDarkMode ? 'bg-indigo-600' : 'bg-indigo-400/30'
      }`} />

      {/* Верхняя панель с прогрессом и переключателем тем */}
      <div className={`fixed top-0 left-0 right-0 z-30 border-b backdrop-blur-xl transition-colors ${
        isDarkMode ? 'border-zinc-800/80 bg-[#09090b]/80' : 'border-zinc-200/60 bg-white/70 shadow-sm'
      }`}>
        <div className="mx-auto max-w-2xl px-6 py-3.5 flex items-center justify-between">
          <div className="flex-1 mr-6">
            <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
              <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}>
                Шаг 0{currentStep + 1} // 0{steps.length}
              </span>
              <span className="text-indigo-500 font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className={`h-1 rounded-full overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl border transition-all ${
              isDarkMode 
                ? 'border-zinc-800 bg-zinc-900 text-amber-400 hover:bg-zinc-800' 
                : 'border-zinc-200 bg-white text-amber-600 hover:bg-zinc-100 shadow-sm'
            }`}
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>

      {/* Основной контейнер опроса */}
      <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-12 relative z-10">
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-3.5 mb-8">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
              isDarkMode ? 'border-zinc-800 bg-zinc-900 text-indigo-400' : 'border-zinc-200 bg-white text-indigo-600 shadow-sm'
            }`}>
              <Icon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-500 uppercase tracking-wider mb-0.5">
                <Sparkles size={12} /> ИИ-Анкетирование
              </div>
              <h2 className="text-2xl font-black tracking-tight">{step.title}</h2>
              <p className={`text-xs font-light ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{step.subtitle}</p>
            </div>
          </div>

          <div className={`rounded-3xl border backdrop-blur-xl p-6 md:p-8 min-h-[260px] shadow-xl ${
            isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200/80 bg-white shadow-zinc-200/50'
          }`}>
            {step.key === 'name' && (
              <input
                autoFocus
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canProceed() && next()}
                placeholder="Ваше полное имя"
                className={`w-full rounded-2xl border px-5 py-4 text-sm font-medium outline-none transition-all ${
                  isDarkMode 
                    ? 'border-zinc-800 bg-zinc-950/80 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:bg-zinc-950' 
                    : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white'
                }`}
              />
            )}

            {step.key === 'country' && (
              <div className="grid grid-cols-2 gap-3">
                {countries.map((c: string) => (
                  <button
                    key={c}
                    onClick={() => setCountry(c)}
                    className={`rounded-2xl border px-4 py-3.5 text-left text-xs font-semibold tracking-wide transition-all ${
                      country === c
                        ? isDarkMode 
                          ? 'border-white bg-zinc-100 text-black shadow-md' 
                          : 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                        : isDarkMode
                          ? 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/60'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100/80'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {step.key === 'specialty' && (
              <div className="grid grid-cols-2 gap-3">
                {specialties.map((s: string) => (
                  <button
                    key={s}
                    onClick={() => setSpecialty(s)}
                    className={`rounded-2xl border px-4 py-3.5 text-left text-xs font-semibold tracking-wide transition-all ${
                      specialty === s
                        ? isDarkMode 
                          ? 'border-white bg-zinc-100 text-black shadow-md' 
                          : 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                        : isDarkMode
                          ? 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/60'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100/80'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {step.key === 'academic' && (
              <div className="space-y-5">
                <div>
                  <label className={`block text-xs font-mono uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Ваш текущий GPA (шкала 0 – 5)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    placeholder="напр. 3.8"
                    className={`w-full rounded-2xl border px-5 py-3.5 text-sm font-medium outline-none transition-all ${
                      isDarkMode 
                        ? 'border-zinc-800 bg-zinc-950/80 text-white placeholder:text-zinc-600 focus:border-indigo-500' 
                        : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-mono uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Балл IELTS (0 – 9)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="9"
                    value={ielts}
                    onChange={(e) => setIelts(e.target.value)}
                    placeholder="напр. 6.5"
                    className={`w-full rounded-2xl border px-5 py-3.5 text-sm font-medium outline-none transition-all ${
                      isDarkMode 
                        ? 'border-zinc-800 bg-zinc-950/80 text-white placeholder:text-zinc-600 focus:border-indigo-500' 
                        : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500'
                    }`}
                  />
                  <p className={`text-[11px] mt-2 font-mono ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Укажите 0, если ещё не сдавали IELTS</p>
                </div>
              </div>
            )}

            {step.key === 'finance' && (
              <div className="space-y-3">
                {financialOptions.map((f: { value: string; label: string }) => (
                  <button
                    key={f.value}
                    onClick={() => setFinance(f.value)}
                    className={`w-full rounded-2xl border px-5 py-3.5 text-left transition-all ${
                      finance === f.value
                        ? isDarkMode 
                          ? 'border-white bg-zinc-100 text-black shadow-md' 
                          : 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                        : isDarkMode
                          ? 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/60'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100/80'
                    }`}
                  >
                    <span className="text-xs font-semibold tracking-wide">{f.label}</span>
                  </button>
                ))}
              </div>
            )}

            {step.key === 'destinations' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {studyCountries.map((c: string) => (
                  <button
                    key={c}
                    onClick={() => toggleDestination(c)}
                    className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-xs font-semibold tracking-wide transition-all ${
                      destinations.includes(c)
                        ? isDarkMode 
                          ? 'border-white bg-zinc-100 text-black shadow-md' 
                          : 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                        : isDarkMode
                          ? 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/60'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100/80'
                    }`}
                  >
                    {destinations.includes(c) && <Check size={13} />}
                    {studyCountriesRu[c] || c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-xs ${
              isDarkMode ? 'border-red-900/50 bg-red-950/30 text-red-400' : 'border-red-200 bg-red-50 text-red-600'
            }`}>
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={back}
              disabled={currentStep === 0}
              className={`flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'
              }`}
            >
              <ChevronLeft size={15} />
              Назад
            </button>
            <button
              onClick={next}
              disabled={!canProceed() || saving}
              className={`px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                isDarkMode 
                  ? 'border-zinc-700 bg-zinc-100 text-black hover:bg-white' 
                  : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              <span>
                {saving
                  ? 'Обработка ИИ...'
                  : currentStep === steps.length - 1
                    ? 'Подобрать университеты'
                    : 'Продолжить'}
              </span>
              {!saving && <ChevronRight size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}