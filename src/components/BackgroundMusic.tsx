import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Пытаемся запустить музыку при первом клике/взаимодействии пользователя с сайтом
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted && audioRef.current) {
        audioRef.current.volume = 0.4; // Громкость (от 0 до 1)
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setHasInteracted(true);
          })
          .catch((err) => console.log("Автозапуск заблокирован браузером:", err));
      }
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [hasInteracted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <>
      {/* Аудио элемент, ссылающийся на файл из папки public */}
      <audio ref={audioRef} src="/audio/bruh.mp3" loop preload="auto" />

      {/* Аккуратная плавающая кнопка управления звуком в углу экрана */}
      <button
        onClick={togglePlay}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-full shadow-lg transition-all hover:bg-slate-800 focus:outline-none"
        title={isPlaying ? "Выключить музыку" : "Включить муыку"}
      >
        {isPlaying ? (
          <>
            <Volume2 className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span>Музыка вкл</span>
          </>
        ) : (
          <>
            <VolumeX className="w-4 h-4 text-slate-400" />
            <span>Музыка выкл</span>
          </>
        )}
      </button>
    </>
  );
}