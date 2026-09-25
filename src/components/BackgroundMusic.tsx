import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export default function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Прямая ссылка из ваших GitHub Releases
  const [audio] = useState(() => new Audio("https://github.com/silverpawno/shipovtest/releases/download/v1v1v1/bruh.mp3"));

  audio.loop = true;
  audio.volume = 0.4;

  const togglePlay = () => {
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Ошибка воспроизведения:", err));
    }
  };

  return (
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
  );
}