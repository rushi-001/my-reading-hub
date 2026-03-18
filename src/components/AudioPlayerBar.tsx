import { useState, useRef } from "react";
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
    const [volume, setVolume] = useState(0.8);
    const [muted, setMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showVolume, setShowVolume] = useState(false);
    const playerRef = useRef<ReactPlayer>(null);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const frac = Number(e.target.value);
        if (!Number.isFinite(frac)) return;
        setCurrentTime(frac * duration);
        playerRef.current?.seekTo(frac, "fraction");
    };

    const skip = (seconds: number) => {
        if (!playerRef.current || !Number.isFinite(duration) || duration <= 0) return;
        const next = Math.max(0, Math.min(duration, currentTime + seconds));
        playerRef.current.seekTo(next, "seconds");
        setCurrentTime(next);
    };

    const canSeek = Number.isFinite(duration) && duration > 0;

    const fmt = (s: number) => {
        if (!isFinite(s) || s < 0) return "0:00";
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    if (!audioUrl) return null;

    const seekFraction = canSeek ? currentTime / duration : 0;

    return (
        <div className="border-t border-muted bg-surface-1 shrink-0 px-3 py-2">
            {/* Hidden ReactPlayer */}
            <ReactPlayer
                ref={playerRef}
                url={audioUrl}
                playing={isPlaying}
                volume={volume}
                muted={muted}
                width={0}
                height={0}
                style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                onDuration={(d) => setDuration(d)}
                onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => { setPlaying(false); setCurrentTime(0); }}
            />

            <div className="flex items-center gap-3 flex-wrap">
                {/* Track info */}
                <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-[12px] text-foreground truncate font-mono leading-tight">
                        {activeBook?.title ?? "Audio"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                        {activeBook?.author ?? audioUrl}
                    </p>
                </div>

                {/* Controls */}
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

                {/* Seek bar */}
                <div className="flex items-center gap-1.5 flex-1 min-w-[160px] max-w-[480px]">
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 w-8 text-right">
                        {fmt(currentTime)}
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.001}
                        value={seekFraction}
                        onChange={handleSeek}
                        disabled={!canSeek}
                        className="flex-1 h-px cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ accentColor: "hsl(var(--terminal-green))" }}
                    />
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 w-8">
                        {fmt(duration)}
                    </span>
                </div>

                {/* Volume */}
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
                        <div className="absolute bottom-9 right-0 bg-background border border-muted p-2 flex flex-col items-center gap-1 z-20 shadow-lg">
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

                {/* Close */}
                <button
                    onClick={() => { setAudioUrl(null); setPlaying(false); }}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title="Close player"
                >
                    <X size={13} />
                </button>
            </div>
        </div>
    );
}
