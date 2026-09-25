import { useEffect, useState } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";

export default function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Скачиваем весь файл в память браузера в фоновом режиме при открытии сайта
    const loadAudio = async () => {
      try {
        const response = await fetch("https://github.com/silverpawno/shipovtest/releases/download/v1v1v1/Kanye_West_-_ALL_THE_LOVE_feat_Andre_Troutman_81159719.mp3");
        const arrayBuffer = await response.arrayBuffer();

        const Context = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Context();
        setAudioCtx(ctx);

        const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
        setAudioBuffer(decodedBuffer);
        setIsLoading(false); // Файл готов к мгновенному воспроизведению
      } catch (err) {
        console.error("Ошибка загрузки аудио в память:", err);
        setIsLoading(false);
      }
    };

    loadAudio();
  }, []);

  const togglePlay = () => {
    if (!audioCtx || !audioBuffer) return;

    if (isPlaying) {
      // Останавливаем воспроизведение
      if (sourceNode) {
        sourceNode.stop();
        setSourceNode(null);
      }
      setIsPlaying(false);
    } else {
      // Активируем контекст (требование безопасности браузеров)
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      // Создаем узел источника из готового буфера в памяти
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;

      // Настраиваем громкость
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0.4;

      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      source.start(0);
      setSourceNode(source);
      setIsPlaying(true);
    }
  };

  return (
    <button
      onClick={togglePlay}
      disabled={isLoading}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-full shadow-lg transition-all hover:bg-slate-800 focus:outline-none disabled:opacity-50"
      title={isLoading ? "Загрузка трека..." : isPlaying ? "Выключить музыку" : "Включить музыку"}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>Загрузка музыки...</span>
        </>
      ) : isPlaying ? (
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