import { useState, useRef, useEffect } from "react";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    X,
    SkipBack,
    SkipForward,
} from "lucide-react";
import { useBooks } from "@/store/bookStore";

// We use a plain HTML5 video/audio element underneath an iframe for YouTube.
// For YouTube we can't control seek via HTML5, so we show the iframe directly.

export function AudioPlayerBar() {
    const { audioUrl, isPlaying, setPlaying, setAudioUrl, activeBook } =
        useBooks();
    const [volume, setVolume] = useState(0.8);
    const [muted, setMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showVolume, setShowVolume] = useState(false);
    const audioRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const isYouTube = audioUrl
        ? /youtube\.com|youtu\.be/.test(audioUrl)
        : false;

    // For non-YouTube: create an audio element dynamically
    useEffect(() => {
        if (!audioUrl || isYouTube) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
            return;
        }
        let el = audioRef.current as HTMLAudioElement;
        if (!el) {
            el = new Audio();
            audioRef.current = el;
        }
        el.src = audioUrl;
        el.volume = volume;
        el.muted = muted;
        setCurrentTime(0);
        setDuration(0);

        const onLoadedMetadata = () => setDuration(el.duration || 0);
        const onTimeUpdate = () => setCurrentTime(el.currentTime);
        const onEnded = () => { setPlaying(false); setCurrentTime(0); };
        const onPlay = () => setPlaying(true);
        const onPause = () => setPlaying(false);

        el.addEventListener("loadedmetadata", onLoadedMetadata);
        el.addEventListener("timeupdate", onTimeUpdate);
        el.addEventListener("ended", onEnded);
        el.addEventListener("play", onPlay);
        el.addEventListener("pause", onPause);

        return () => {
            el.removeEventListener("loadedmetadata", onLoadedMetadata);
            el.removeEventListener("timeupdate", onTimeUpdate);
            el.removeEventListener("ended", onEnded);
            el.removeEventListener("play", onPlay);
            el.removeEventListener("pause", onPause);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioUrl, isYouTube]);

    // Sync volume/muted
    useEffect(() => {
        const el = audioRef.current as HTMLAudioElement | null;
        if (!el) return;
        el.volume = volume;
        el.muted = muted;
    }, [volume, muted]);

    // Sync play/pause
    useEffect(() => {
        const el = audioRef.current as HTMLAudioElement | null;
        if (!el || isYouTube) return;
        if (isPlaying) {
            el.play().catch(() => {});
        } else {
            el.pause();
        }
    }, [isPlaying, isYouTube]);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = Number(e.target.value);
        if (!Number.isFinite(t)) return;
        setCurrentTime(t);
        const el = audioRef.current as HTMLAudioElement | null;
        if (el) el.currentTime = t;
    };

    const skip = (seconds: number) => {
        const el = audioRef.current as HTMLAudioElement | null;
        if (!el || !Number.isFinite(duration) || duration <= 0) return;
        const next = Math.max(0, Math.min(duration, el.currentTime + seconds));
        el.currentTime = next;
        setCurrentTime(next);
    };

    const canSeek = !isYouTube && Number.isFinite(duration) && duration > 0;

    const fmt = (s: number) => {
        if (!isFinite(s) || s < 0) return "0:00";
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    if (!audioUrl) return null;

    return (
        <div className="border-t border-muted bg-surface-1 shrink-0" ref={containerRef}>
            {/* YouTube embed */}
            {isYouTube && (
                <div className="w-full">
                    <iframe
                        src={`https://www.youtube.com/embed/${extractYouTubeId(audioUrl)}?autoplay=${isPlaying ? 1 : 0}&controls=1`}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        className="w-full"
                        style={{ height: "56px", border: 0 }}
                        title="YouTube player"
                    />
                </div>
            )}

            <div className="flex items-center gap-3 px-3 py-2 flex-wrap">
                {/* Track info */}
                <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-[12px] text-foreground truncate font-mono leading-tight">
                        {activeBook?.title ?? "Audio"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                        {activeBook?.author ?? audioUrl}
                    </p>
                </div>

                {/* Controls (non-YouTube only for skip) */}
                {!isYouTube && (
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => skip(-10)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="-10s"
                        >
                            <SkipBack size={13} />
                        </button>

                        <button
                            onClick={() => setPlaying(!isPlaying)}
                            className="w-7 h-7 border border-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                        >
                            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                        </button>

                        <button
                            onClick={() => skip(10)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="+10s"
                        >
                            <SkipForward size={13} />
                        </button>
                    </div>
                )}

                {/* Seek bar (non-YouTube) */}
                {canSeek && (
                    <div className="flex items-center gap-1.5 flex-1 min-w-[140px] max-w-[440px]">
                        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 w-8 text-right">
                            {fmt(currentTime)}
                        </span>
                        <input
                            type="range"
                            min={0}
                            max={duration}
                            step={0.5}
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 h-px cursor-pointer"
                            style={{ accentColor: "hsl(var(--terminal-green))" }}
                        />
                        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 w-8">
                            {fmt(duration)}
                        </span>
                    </div>
                )}

                {/* Volume (non-YouTube) */}
                {!isYouTube && (
                    <div className="relative shrink-0 flex items-center gap-1">
                        <button
                            onClick={() => setMuted(!muted)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title={muted ? "Unmute" : "Mute"}
                        >
                            {muted || volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
                        </button>
                        <button
                            onClick={() => setShowVolume((v) => !v)}
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors w-7 text-center tabular-nums"
                        >
                            {muted ? 0 : Math.round(volume * 100)}
                        </button>
                        {showVolume && (
                            <div className="absolute bottom-10 right-0 bg-background border border-muted p-2 flex flex-col items-center gap-1 z-20 shadow-lg">
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={muted ? 0 : volume}
                                    onChange={(e) => {
                                        setVolume(Number(e.target.value));
                                        setMuted(false);
                                    }}
                                    className="h-20 cursor-pointer"
                                    style={{
                                        writingMode: "vertical-lr",
                                        direction: "rtl",
                                        accentColor: "hsl(var(--terminal-green))",
                                    }}
                                />
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                    {Math.round((muted ? 0 : volume) * 100)}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Close */}
                <button
                    onClick={() => {
                        const el = audioRef.current as HTMLAudioElement | null;
                        if (el) { el.pause(); el.src = ""; }
                        setAudioUrl(null);
                        setPlaying(false);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title="Close player"
                >
                    <X size={13} />
                </button>
            </div>
        </div>
    );
}

function extractYouTubeId(url: string): string {
    const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    return regExp.exec(url)?.[1] ?? "";
}
