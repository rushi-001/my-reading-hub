import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, X, SkipBack, SkipForward } from "lucide-react";
import { useBooks } from "@/store/bookStore";

export function AudioPlayerBar() {
  const { audioUrl, isPlaying, setPlaying, setAudioUrl, activeBook } = useBooks();
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showVolume, setShowVolume] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const isYoutube = audioUrl ? /youtube\.com|youtu\.be/.test(audioUrl) : false;

  // For non-YouTube audio, use an audio element
  useEffect(() => {
    if (!audioUrl || isYoutube) return;
    const audio = new Audio(audioUrl);
    audio.volume = muted ? 0 : volume / 100;
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("durationchange", () => setDuration(audio.duration));
    audio.addEventListener("ended", () => setPlaying(false));

    if (isPlaying) audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  useEffect(() => {
    if (!audioRef.current || isYoutube) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isYoutube]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = muted ? 0 : volume / 100;
  }, [volume, muted]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    setCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!audioUrl) return null;

  const ytId = isYoutube ? extractYoutubeId(audioUrl) : null;

  return (
    <div className="border-t border-muted bg-surface-1 shrink-0">
      {/* YouTube iframe (hidden, handles audio) */}
      {isYoutube && isPlaying && (
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&controls=0&mute=${muted ? 1 : 0}`}
          allow="autoplay"
          className="hidden"
          title="audio"
        />
      )}

      <div className="flex items-center px-4 py-2 gap-3">
        {/* Book info */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-foreground truncate font-mono leading-tight">
            {activeBook?.title ?? "Audio"}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {activeBook?.author ?? audioUrl}
          </p>
        </div>

        {/* Skip back */}
        <button
          onClick={() => skip(-10)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="-10s"
        >
          <SkipBack size={13} />
        </button>

        {/* Play/Pause */}
        <button
          onClick={() => setPlaying(!isPlaying)}
          className="w-7 h-7 border border-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors shrink-0"
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
        </button>

        {/* Skip forward */}
        <button
          onClick={() => skip(10)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="+10s"
        >
          <SkipForward size={13} />
        </button>

        {/* Seek bar — only for non-YouTube */}
        {!isYoutube && duration > 0 && (
          <div className="flex items-center gap-1.5 flex-1 max-w-[200px]">
            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{fmt(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration}
              step={0.5}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-px accent-terminal cursor-pointer"
              style={{ accentColor: "hsl(var(--terminal-green))" }}
            />
            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{fmt(duration)}</span>
          </div>
        )}

        {/* YouTube note */}
        {isYoutube && (
          <span className="text-[10px] text-muted-foreground/50 shrink-0 font-mono">YT</span>
        )}

        {/* Volume */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowVolume((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {muted || volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
          {showVolume && (
            <div className="absolute bottom-8 right-0 bg-surface-1 border border-muted p-2 flex flex-col items-center gap-1 z-10">
              <input
                type="range"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
                className="h-16 cursor-pointer"
                style={{ writingMode: "vertical-lr", direction: "rtl", accentColor: "hsl(var(--terminal-green))" }}
              />
              <span className="text-[10px] text-muted-foreground tabular-nums">{muted ? 0 : volume}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => { setMuted(!muted); }}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Toggle mute"
        >
          {muted ? "UN" : "M"}
        </button>

        {/* Close */}
        <button
          onClick={() => { setAudioUrl(null); setPlaying(false); }}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

function extractYoutubeId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : "";
}
