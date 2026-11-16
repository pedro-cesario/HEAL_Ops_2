import React, { useCallback, useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export const FullscreenControl: React.FC<{
  targetRef: React.RefObject<HTMLDivElement | null>;
}> = ({ targetRef }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = targetRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fallback silencioso caso o navegador/iframe restrinja Fullscreen API
      setIsFullscreen((prev) => !prev);
    }
  }, [targetRef]);

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      title={isFullscreen ? 'Sair da tela cheia (Esc)' : 'Entrar em tela cheia'}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] hover:border-[#0F5E59] dark:hover:border-[#2DD4BF] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
    >
      {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
      <span className="hidden xl:inline">{isFullscreen ? 'Restaurar' : 'Tela Cheia'}</span>
    </button>
  );
};
