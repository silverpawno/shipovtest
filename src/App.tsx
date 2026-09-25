import { useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import Questionnaire from './components/Questionnaire';
import Dashboard from './components/Dashboard';
import { GraduationCap } from 'lucide-react';
import BackgroundMusic from './components/BackgroundMusic';

export default function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-50/20">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-700 text-white animate-pulse">
            <GraduationCap size={26} />
          </div>
          <p className="text-sm text-slate-500">Загрузка EduCompass...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!user && <LandingPage />}
      {user && (!profile || !profile.profile_completed) && <Questionnaire />}
      {user && profile && profile.profile_completed && <Dashboard />}
      
      {/* Фоновая музыка */}
      <BackgroundMusic />
    </>
  );
}