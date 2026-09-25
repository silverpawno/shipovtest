import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.volume = 0.4;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.log("Ошибка воспроизведения:", err);
        });
    }
  };

  return (
    <>
      {/* Используем стабильную тестовую ссылку на короткий звуковой сигнал/трек */}
      <audio 
        ref={audioRef} 
        src="https://github.com/silverpawno/shipovtest/releases/download/v1v1v1/Kanye_West_-_ALL_THE_LOVE_feat_Andre_Troutman_81159719.mp3" 
        loop 
        preload="auto" 
      />

      <button
        onClick={togglePlay}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-full shadow-lg transition-all hover:bg-slate-800 focus:outline-none"
        title={isPlaying ? "Выключить музыку" : "Включить музыку"}
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