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
import ReactPlayer from "react-player";
import { useBooks } from "@/store/bookStore";

export function AudioPlayerBar() {
    const { audioUrl, isPlaying, setPlaying, setAudioUrl, activeBook } =
        useBooks();
    const [volume, setVolume] = useState(80);
    const [muted, setMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showVolume, setShowVolume] = useState(false);
    const playerRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        setCurrentTime(0);
        setDuration(0);
    }, [audioUrl]);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = Number(e.target.value);
        if (!Number.isFinite(t)) return;
        setCurrentTime(t);
        if (playerRef.current) {
            playerRef.current.currentTime = t;
        }
    };

    const skip = (seconds: number) => {
        if (!playerRef.current || !Number.isFinite(duration) || duration <= 0)
            return;
        const next = Math.max(
            0,
            Math.min(duration, playerRef.current.currentTime + seconds),
        );
        playerRef.current.currentTime = next;
        setCurrentTime(next);
    };

    const canSeek = Number.isFinite(duration) && duration > 0;

    const fmt = (s: number) => {
        if (!isFinite(s)) return "0:00";
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    if (!audioUrl) return null;

    return (
        <div className="border-t border-muted bg-surface-1 shrink-0">
            <ReactPlayer
                ref={playerRef}
                src={audioUrl}
                playing={isPlaying}
                volume={volume / 100}
                muted={muted}
                width={0}
                height={0}
                style={{
                    position: "absolute",
                    opacity: 0,
                    pointerEvents: "none",
                }}
                controls={false}
                onReady={() => {
                    const d = playerRef.current?.duration;
                    if (Number.isFinite(d) && d) {
                        setDuration(d);
                    }
                }}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onTimeUpdate={(event) => {
                    setCurrentTime(event.currentTarget.currentTime || 0);
                    const d = event.currentTarget.duration;
                    if (Number.isFinite(d) && d) {
                        setDuration(d);
                    }
                }}
                onDurationChange={() => {
                    const d = playerRef.current?.duration;
                    if (Number.isFinite(d) && d) {
                        setDuration(d);
                    }
                }}
            />

            <div className="mx-auto w-full flex items-center justify-between px-3 py-2">
                <div className="flex gap-3 text-center">
                    <p className="text-[12px] text-foreground truncate font-mono leading-tight">
                        {activeBook?.title ?? "Audio"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                        {activeBook?.author ?? audioUrl}
                    </p>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                    <button
                        onClick={() => skip(-10)}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        title="-10s"
                    >
                        <SkipBack size={13} />
                    </button>

                    <button
                        onClick={() => setPlaying(!isPlaying)}
                        className="w-7 h-7 border border-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors shrink-0"
                    >
                        {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                    </button>

                    <button
                        onClick={() => skip(10)}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        title="+10s"
                    >
                        <SkipForward size={13} />
                    </button>

                    {canSeek && (
                        <div className="order-3 w-full max-w-[560px] basis-full flex items-center gap-1.5 sm:order-none sm:basis-auto sm:w-[360px]">
                            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                                {fmt(currentTime)}
                            </span>
                            <input
                                type="range"
                                min={0}
                                max={duration}
                                step={0.5}
                                value={currentTime}
                                onChange={handleSeek}
                                className="flex-1 h-px accent-terminal cursor-pointer"
                                style={{
                                    accentColor: "hsl(var(--terminal-green))",
                                }}
                            />
                            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                                {fmt(duration)}
                            </span>
                        </div>
                    )}

                    <div className="relative shrink-0">
                        <button
                            onClick={() => setShowVolume((v) => !v)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {muted || volume === 0 ? (
                                <VolumeX size={13} />
                            ) : (
                                <Volume2 size={13} />
                            )}
                        </button>
                        {showVolume && (
                            <div className="absolute bottom-8 right-0 bg-surface-1 border border-muted p-2 flex flex-col items-center gap-1 z-10">
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={muted ? 0 : volume}
                                    onChange={(e) => {
                                        setVolume(Number(e.target.value));
                                        setMuted(false);
                                    }}
                                    className="h-16 cursor-pointer"
                                    style={{
                                        writingMode: "vertical-lr",
                                        direction: "rtl",
                                        accentColor:
                                            "hsl(var(--terminal-green))",
                                    }}
                                />
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                    {muted ? 0 : volume}
                                </span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            setMuted(!muted);
                        }}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        title="Toggle mute"
                    >
                        {muted ? "UN" : "M"}
                    </button>

                    <button
                        onClick={() => {
                            setAudioUrl(null);
                            setPlaying(false);
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                        <X size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
}
