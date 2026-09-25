import { useState } from 'react';
import { GraduationCap, Sparkles, ArrowRight, Globe2, Compass, ShieldCheck } from 'lucide-react';
import Globe3D from './Globe3D';
import AuthModal from './AuthModal';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const { user } = useAuth();

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Фоновые неоновые подсветки (глоу-эффекты) */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-[450px] w-[450px] rounded-full bg-cyan-600/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-10 h-[400px] w-[400px] rounded-full bg-emerald-600/10 blur-[140px]" />

      {/* Навигация */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 md:px-12 border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-slate-950 shadow-lg shadow-cyan-500/20">
            <Compass size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">EduCompass</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? null : (
            <>
              <button
                onClick={() => openAuth('signin')}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Войти
              </button>
              <button
                onClick={() => openAuth('signup')}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 shadow-lg shadow-cyan-500/20"
              >
                Начать бесплатно
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Главный экран (Hero) */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-8 pb-20 md:pt-12">
        {/* Глобус */}
        <div className="relative w-full max-w-[500px] aspect-square mx-auto">
          <Globe3D />
        </div>

        {/* Текстовый блок поверх / под глобусом */}
        <div className="relative -mt-16 md:-mt-20 z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 border border-slate-800 px-4 py-1.5 text-xs font-medium text-cyan-400 shadow-inner backdrop-blur-md mb-6">
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            Платформа нового поколения с ИИ-анализом
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.1] mb-6">
            Твой путь к образованию в{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              лучших вузах мира
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
            Для амбициозных студентов из СНГ и Центральной Азии. Получите персональный подбор университетов за рубежом — «Запас», «Цель», «Мечта» — и пошаговый план подготовки.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <button
              onClick={() => openAuth('signup')}
              className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Создать профиль
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => openAuth('signin')}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900/80 border border-slate-800 px-8 py-4 text-base font-semibold text-slate-300 backdrop-blur-md transition-all hover:bg-slate-800 hover:text-white"
            >
              У меня есть аккаунт
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="mt-28 md:mt-36 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl w-full">
          {[
            { num: '40+', label: 'Топ-университетов' },
            { num: '15+', label: 'Стран мира' },
            { num: '100%', label: 'ИИ-алгоритм' },
            { num: '0₸', label: 'Старт без затрат' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 text-center backdrop-blur-sm"
            >
              <div className="text-2xl md:text-3xl font-extrabold text-white bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                {stat.num}
              </div>
              <div className="text-xs md:text-sm text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Карточки преимуществ */}
        <div className="mt-20 grid md:grid-cols-3 gap-6 max-w-5xl w-full">
          {[
            {
              icon: <Globe2 size={24} className="text-cyan-400" />,
              title: 'Глобальный охват',
              desc: 'Доступ к вузам США, Европы, Великобритании и Азии с детальными требованиями к GPA и языковым тестам.',
            },
            {
              icon: <Sparkles size={24} className="text-indigo-400" />,
              title: 'Умная стратегия ИИ',
              desc: 'Автоматическое разделение вузов на категории риска и успеха: Запас, Цель и Мечта под ваши показатели.',
            },
            {
              icon: <ShieldCheck size={24} className="text-emerald-400" />,
              title: 'Четкие дедлайны',
              desc: 'Персональный чек-лист подготовки документов, визовых требований и подачи заявок без лишней суеты.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-8 shadow-xl backdrop-blur-xl transition-all hover:border-slate-700 hover:bg-slate-900"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 mb-5 shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Футер */}
      <footer className="relative z-10 border-t border-slate-900 py-10 text-center text-xs text-slate-500 bg-slate-950/80">
        EduCompass — ваш персональный навигатор в мире международного образования
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}