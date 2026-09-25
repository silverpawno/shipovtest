import { useState } from 'react';
import { 
  ArrowUpRight, Globe2, Compass, 
  Sun, Moon, Cpu, 
  CheckCircle2, Sparkles, GraduationCap, Trophy 
} from 'lucide-react';
import Globe3D from './Globe3D';
import AuthModal from './AuthModal';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { user } = useAuth();

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden font-sans transition-colors duration-700 ${
      isDarkMode 
        ? 'bg-[#09090b] text-zinc-100 selection:bg-zinc-100 selection:text-black' 
        : 'bg-[#f8f9fa] text-zinc-800 selection:bg-zinc-900 selection:text-white'
    }`}>
      
      {/* Фоновые градиенты */}
      <div className={`pointer-events-none absolute top-0 left-1/4 w-[700px] h-[350px] rounded-full blur-[160px] opacity-20 ${
        isDarkMode ? 'bg-indigo-600' : 'bg-indigo-400/30'
      }`} />

      {/* Навигация (Shadcn Navbar Style) */}
      <nav className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors ${
        isDarkMode ? 'border-zinc-800/80 bg-[#09090b]/80' : 'border-zinc-200/60 bg-white/70 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              isDarkMode ? 'border-zinc-800 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-900 shadow-sm'
            }`}>
              <Compass size={18} className="animate-spin-slow" />
            </div>
            <span className="text-sm font-bold tracking-tight uppercase">EduCompass <span className="text-xs text-indigo-500 font-mono ml-1">v2.6</span></span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono ${
              isDarkMode ? 'border-zinc-800 bg-zinc-900/50 text-zinc-400' : 'border-zinc-200/80 bg-zinc-100/60 text-zinc-600'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ИИ-модель активна
            </div>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl border transition-all ${
                isDarkMode 
                  ? 'border-zinc-800 bg-zinc-900 text-amber-400 hover:bg-zinc-800' 
                  : 'border-zinc-200 bg-white text-amber-600 hover:bg-zinc-100 shadow-sm'
              }`}
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {!user && (
              <button
                onClick={() => openAuth('signup')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  isDarkMode 
                    ? 'border-zinc-700 bg-zinc-100 text-black hover:bg-white' 
                    : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm'
                }`}
              >
                <span>Начать</span>
                <ArrowUpRight size={13} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24">
        
        {/* Главный блок Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
          <div className="lg:col-span-7">
            <div className={`inline-flex items-center gap-2 text-xs font-mono mb-4 px-3 py-1 rounded-md border ${
              isDarkMode ? 'border-zinc-800 bg-zinc-900 text-zinc-400' : 'border-zinc-200 bg-white text-zinc-600 shadow-sm'
            }`}>
              <Sparkles size={13} className="text-amber-500" />
              <span>Платформа умного поступления для СНГ</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6">
              Твой академический вектор в <span className="bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">лучшие вузы</span> мира
            </h1>

            <p className={`text-sm sm:text-base font-light leading-relaxed mb-8 max-w-xl ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Автоматический подбор университетов на основе вашего GPA и целей. Четкое разделение на категории: <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Запас</span>, <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Цель</span> и <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Мечта</span>.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => openAuth('signup')}
                className={`px-6 py-3.5 rounded-xl font-medium text-xs uppercase tracking-wider border transition-all flex items-center gap-2 shadow-sm ${
                  isDarkMode 
                    ? 'bg-zinc-100 text-black border-white hover:bg-zinc-200' 
                    : 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
                }`}
              >
                <span>Создать профиль</span>
                <ArrowUpRight size={15} />
              </button>
              <button
                onClick={() => openAuth('signin')}
                className={`px-6 py-3.5 rounded-xl font-medium text-xs uppercase tracking-wider border transition-all ${
                  isDarkMode ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 shadow-sm'
                }`}
              >
                Войти в кабинет
              </button>
            </div>
          </div>

          {/* Правая карточка-виджет в стиле Shadcn Dashboard */}
          <div className="lg:col-span-5">
            <div className={`p-6 rounded-3xl border backdrop-blur-xl ${
              isDarkMode ? 'border-zinc-800 bg-zinc-900/50 shadow-2xl' : 'border-zinc-200/80 bg-white shadow-xl shadow-zinc-200/50'
            }`}>
              <div className={`flex items-center justify-between mb-6 pb-4 border-b ${isDarkMode ? 'border-zinc-800/50' : 'border-zinc-100'}`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Статус профиля</h3>
                    <p className={`text-[11px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Алгоритм подбора: Готов</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Активен
                </span>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { label: "Целевые страны", val: "Европа, США, Азия", icon: <Globe2 size={14} className="text-cyan-500" /> },
                  { label: "Модель подбора", val: "ИИ Нейро-ранжирование", icon: <Cpu size={14} className="text-indigo-500" /> },
                  { label: "Вероятность гранта", val: "Рассчитывается индивидуально", icon: <Trophy size={14} className="text-amber-500" /> }
                ].map((row, i) => (
                  <div key={i} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    isDarkMode ? 'border-zinc-800/60 bg-zinc-950/40 text-zinc-300' : 'border-zinc-100 bg-zinc-50/80 text-zinc-700'
                  }`}>
                    <div className="flex items-center gap-2 font-medium">
                      {row.icon}
                      <span>{row.label}</span>
                    </div>
                    <span className="font-semibold">{row.val}</span>
                  </div>
                ))}
              </div>

              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                isDarkMode ? 'border-indigo-500/30 bg-indigo-500/5 text-indigo-300' : 'border-indigo-100 bg-indigo-50/60 text-indigo-900'
              }`}>
                <CheckCircle2 size={20} className="text-indigo-500 shrink-0" />
                <p className="text-xs leading-relaxed">
                  Пройдите быстрый опрос в личном кабинете для точного расчёта шансов по вашей специальности.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Сетка метрик и достижений */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { stat: "40+", title: "Университетов", desc: "Проверенные вузы с аккредитацией" },
            { stat: "15+", title: "Стран мира", desc: "Широкий выбор направлений" },
            { stat: "100%", title: "Контроль дедлайнов", desc: "Никаких пропущенных сроков" },
            { stat: "0₸", title: "Без скрытых плат", desc: "Бесплатный базовый функционал" },
          ].map((item, idx) => (
            <div key={idx} className={`p-5 rounded-2xl border backdrop-blur-md ${
              isDarkMode ? 'border-zinc-800/80 bg-zinc-900/30' : 'border-zinc-200/80 bg-white shadow-sm shadow-zinc-200/40'
            }`}>
              <div className="text-2xl sm:text-3xl font-black mb-1">{item.stat}</div>
              <div className="text-xs font-bold mb-1">{item.title}</div>
              <div className={`text-[11px] font-light ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Секция с 3D Глобусом и текстовым блоком */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-20">
          <div className="lg:col-span-6 flex flex-col items-start">
            <div className={`inline-flex items-center gap-2 text-xs font-mono mb-4 px-3 py-1 rounded-md border ${
              isDarkMode ? 'border-zinc-800 bg-zinc-900 text-indigo-400' : 'border-zinc-200 bg-white text-indigo-600 shadow-sm'
            }`}>
              <Globe2 size={13} />
              <span>Глобальная сеть образования</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-6 leading-[1.1]">
              Открываем границы <br />
              <span className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">для вашего будущего</span>
            </h2>

            <p className={`text-sm sm:text-base font-light leading-relaxed mb-6 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Современный мир стирает барьеры между странами. Наша интерактивная модель объединяет ведущие академические центры планеты, помогая студентам из Казахстана и СНГ находить гранты, стипендиальные программы и топовые университеты в один клик.
            </p>

            <div className={`p-5 rounded-2xl border backdrop-blur-md w-full ${
              isDarkMode ? 'border-zinc-800/80 bg-zinc-900/40' : 'border-zinc-200/80 bg-white shadow-sm shadow-zinc-200/40'
            }`}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 font-mono">
                // Интерактивная навигация
              </h4>
              <p className={`text-xs font-light leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Вращайте трехмерную модель планеты мышкой, приближайте колесиком и наводите на маркеры, чтобы изучить доступные образовательные направления в режиме реального времени.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col items-center">
            <div className={`w-full max-w-[520px] aspect-square rounded-3xl border p-4 backdrop-blur-xl relative shadow-2xl ${
              isDarkMode ? 'border-zinc-800 bg-zinc-950/60' : 'border-zinc-200/80 bg-white shadow-xl shadow-zinc-200/50'
            }`}>
              <Globe3D />
            </div>
          </div>
        </div>

        {/* Финальный CTA блочный баннер */}
        <div className={`rounded-3xl border p-8 md:p-12 text-center relative overflow-hidden backdrop-blur-xl ${
          isDarkMode ? 'border-zinc-800 bg-gradient-to-r from-zinc-900/80 via-zinc-950 to-zinc-900/80 shadow-2xl' : 'border-zinc-200/80 bg-indigo-50/50 shadow-lg shadow-indigo-100/50'
        }`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
          
          <h3 className="text-2xl md:text-3xl font-black mb-3 tracking-tight">Готовы построить академическую карьеру?</h3>
          <p className={`text-xs md:text-sm max-w-md mx-auto mb-6 font-light ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Зарегистрируйте профиль и запустите ИИ-анализ ваших шансов на поступление за 1 минуту.
          </p>
          <button
            onClick={() => openAuth('signup')}
            className={`px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all shadow-md ${
              isDarkMode 
                ? 'border-zinc-700 bg-zinc-100 text-black hover:bg-white' 
                : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
          >
            Начать бесплатно
          </button>
        </div>

      </main>

      {/* Футер */}
      <footer className={`border-t py-8 text-center text-xs font-mono tracking-wider uppercase ${
        isDarkMode ? 'border-zinc-900 text-zinc-600 bg-[#09090b]' : 'border-zinc-200 text-zinc-400 bg-white'
      }`}>
        EduCompass System // Academic Intelligence © 2026
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}