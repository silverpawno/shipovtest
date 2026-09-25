import { useState } from 'react';
import { Check, ChevronRight, ChevronLeft, User, MapPin, BookOpen, Award, DollarSign, Plane } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { countries, specialties, studyCountries, studyCountriesRu, financialOptions } from '@/data/universities';
import { matchUniversities, generateChecklist } from '@/lib/matching';
import { supabase } from '@/lib/supabase';

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

    const uniRows = matches.map((m) => ({
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
      checklist.map((item) => ({
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
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 to-white flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-sm border-b border-teal-50">
        <div className="mx-auto max-w-2xl px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              Шаг {currentStep + 1} из {steps.length}
            </span>
            <span className="text-sm text-slate-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 pt-20 pb-8">
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white">
              <Icon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{step.title}</h2>
              <p className="text-sm text-slate-500">{step.subtitle}</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-teal-50 shadow-sm p-6 md:p-8 min-h-[240px]">
            {step.key === 'name' && (
              <input
                autoFocus
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canProceed() && next()}
                placeholder="Ваше полное имя"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-lg text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            )}

            {step.key === 'country' && (
              <div className="grid grid-cols-2 gap-3">
                {countries.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCountry(c)}
                    className={`rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all ${
                      country === c
                        ? 'border-teal-700 bg-teal-700 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50/30'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {step.key === 'specialty' && (
              <div className="grid grid-cols-2 gap-3">
                {specialties.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpecialty(s)}
                    className={`rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all ${
                      specialty === s
                        ? 'border-teal-700 bg-teal-700 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50/30'
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-lg text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-lg text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                  />
                  <p className="text-xs text-slate-400 mt-2">Укажите 0, если ещё не сдавали IELTS</p>
                </div>
              </div>
            )}

            {step.key === 'finance' && (
              <div className="space-y-3">
                {financialOptions.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFinance(f.value)}
                    className={`w-full rounded-xl border px-5 py-4 text-left transition-all ${
                      finance === f.value
                        ? 'border-teal-700 bg-teal-700 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50/30'
                    }`}
                  >
                    <span className="text-sm font-semibold">{f.label}</span>
                  </button>
                ))}
              </div>
            )}

            {step.key === 'destinations' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {studyCountries.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleDestination(c)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-4 py-3.5 text-sm font-medium transition-all ${
                      destinations.includes(c)
                        ? 'border-teal-700 bg-teal-700 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50/30'
                    }`}
                  >
                    {destinations.includes(c) && <Check size={14} />}
                    {studyCountriesRu[c] || c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={back}
              disabled={currentStep === 0}
              className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-teal-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Назад
            </button>
            <button
              onClick={next}
              disabled={!canProceed() || saving}
              className="group flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving
                ? 'Сохранение...'
                : currentStep === steps.length - 1
                  ? 'Подобрать университеты'
                  : 'Продолжить'}
              {!saving && <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
