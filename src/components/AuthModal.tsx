import { useState } from 'react';
import { X, GraduationCap, Mail, Lock, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  isDarkMode?: boolean;
}

export default function AuthModal({ open, onClose, initialMode = 'signup', isDarkMode = true }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && !acceptedTerms) {
      setError('Необходимо принять правила и условия пользовательского соглашения');
      return;
    }

    setError(null);
    setLoading(true);

    const result = mode === 'signup'
      ? await signUp(email, password)
      : await signIn(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Затемнение фона в стиле лендинга */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xl transition-opacity"
        onClick={onClose}
      />
      
      {/* Карточка в стиле блоков лендинга */}
      <div className={`relative w-full max-w-md rounded-3xl border p-8 shadow-2xl backdrop-blur-2xl transition-all ${
        isDarkMode 
          ? 'border-zinc-800 bg-[#09090b]/90 text-zinc-100 shadow-zinc-950/80' 
          : 'border-zinc-200 bg-white/90 text-zinc-800 shadow-zinc-200/50'
      }`}>
        
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className={`absolute top-6 right-6 p-2 rounded-xl border transition-all ${
            isDarkMode 
              ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800' 
              : 'border-zinc-200 bg-zinc-100 text-zinc-600 hover:text-black hover:bg-zinc-200'
          }`}
        >
          <X size={18} />
        </button>

        {/* Шапка модального окна */}
        <div className="flex items-center gap-3.5 mb-7">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
            isDarkMode ? 'border-zinc-800 bg-zinc-900 text-indigo-400' : 'border-zinc-200 bg-indigo-50 text-indigo-600 shadow-sm'
          }`}>
            <GraduationCap size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {mode === 'signup' ? 'Создать аккаунт' : 'С возвращением'}
            </h2>
            <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {mode === 'signup' ? 'Начните путь к обучению за рубежом' : 'Войдите в личный кабинет'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-mono uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Электронная почта
            </label>
            <div className="relative">
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full rounded-2xl border py-3.5 pl-11 pr-4 text-xs font-medium outline-none transition-all ${
                  isDarkMode 
                    ? 'border-zinc-800 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:bg-zinc-900' 
                    : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-mono uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Пароль
            </label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} size={16} />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (мин. 6 символов)"
                className={`w-full rounded-2xl border py-3.5 pl-11 pr-4 text-xs font-medium outline-none transition-all ${
                  isDarkMode 
                    ? 'border-zinc-800 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:bg-zinc-900' 
                    : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white'
                }`}
              />
            </div>
          </div>

          {/* Чекбокс соглашения (только при регистрации) */}
          {mode === 'signup' && (
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className={`mt-0.5 h-4 w-4 rounded border cursor-pointer accent-indigo-500 ${
                  isDarkMode ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-300 bg-zinc-100'
                }`}
              />
              <label htmlFor="terms" className={`text-xs leading-relaxed cursor-pointer select-none ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Я согласен с <span className="text-indigo-500 hover:underline font-medium">правилами пользования</span> и <span className="text-indigo-500 hover:underline font-medium">политикой конфиденциальности</span>
              </label>
            </div>
          )}

          {error && (
            <div className={`rounded-2xl border px-4 py-3 text-xs flex items-center gap-2 ${
              isDarkMode ? 'border-red-900/50 bg-red-950/30 text-red-400' : 'border-red-200 bg-red-50 text-red-600'
            }`}>
              <ShieldCheck size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Кнопка в стиле главного лендинга */}
          <button
            type="submit"
            disabled={loading || (mode === 'signup' && !acceptedTerms)}
            className={`w-full py-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
              isDarkMode 
                ? 'bg-zinc-100 text-black border-white hover:bg-zinc-200' 
                : 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
            }`}
          >
            <span>{loading ? 'Подождите...' : (mode === 'signup' ? 'Создать аккаунт' : 'Войти в кабинет')}</span>
            {!loading && <ArrowUpRight size={14} />}
          </button>
        </form>

        {/* Переключатель режимов */}
        <div className={`mt-6 text-center text-xs border-t pt-5 ${isDarkMode ? 'border-zinc-800/80 text-zinc-400' : 'border-zinc-100 text-zinc-500'}`}>
          {mode === 'signup' ? (
            <>
              Уже есть аккаунт?{' '}
              <button
                onClick={() => { setMode('signin'); setError(null); }}
                className="font-bold text-indigo-500 hover:underline transition-colors ml-1"
              >
                Войти
              </button>
            </>
          ) : (
            <>
              Нет аккаунта?{' '}
              <button
                onClick={() => { setMode('signup'); setError(null); }}
                className="font-bold text-indigo-500 hover:underline transition-colors ml-1"
              >
                Зарегистрироваться
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}