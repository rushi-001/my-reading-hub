import { useEffect, useRef, useState } from "react";
import {
    Pause,
    Play,
    Redo,
    SkipBack,
    SkipForward,
    Undo,
    Volume2,
    VolumeX,
    X,
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
        setShowVolume(false);
    }, [audioUrl]);

    if (!audioUrl) return null;

    const canSeek = Number.isFinite(duration) && duration > 0;

    const formatTime = (seconds: number) => {
        if (!Number.isFinite(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainder = Math.floor(seconds % 60);
        return `${minutes}:${String(remainder).padStart(2, "0")}`;
    };

    const skip = (seconds: number) => {
        if (!playerRef.current || !canSeek) return;
        const current = playerRef.current.currentTime || 0;
        const next = Math.max(0, Math.min(duration, current + seconds));
        playerRef.current.currentTime = next;
        setCurrentTime(next);
    };

    return (
        <div className="border-t border-muted bg-surface-1 shrink-0">
            {/* Hidden media element used by the custom controls below. */}
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
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onReady={() => {
                    const mediaDuration = playerRef.current?.duration;
                    if (Number.isFinite(mediaDuration) && mediaDuration > 0) {
                        setDuration(mediaDuration);
                    }
                }}
                onDurationChange={() => {
                    const mediaDuration = playerRef.current?.duration;
                    if (Number.isFinite(mediaDuration) && mediaDuration > 0) {
                        setDuration(mediaDuration);
                    }
                }}
                onTimeUpdate={(event) => {
                    setCurrentTime(event.currentTarget.currentTime || 0);
                    const mediaDuration = event.currentTarget.duration;
                    if (Number.isFinite(mediaDuration) && mediaDuration > 0) {
                        setDuration(mediaDuration);
                    }
                }}
            />

            <div className="w-full px-3 py-2">
                <div className="flex items-center gap-3">
                    <div className="min-w-0">
                        <p className="text-[12px] text-foreground truncate font-mono leading-tight">
                            {activeBook?.title ?? "Audio"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                            {activeBook?.author ?? audioUrl}
                        </p>
                    </div>

                    <div className="ml-auto flex items-center gap-2 shrink-0">
                        {/* Transport controls together */}
                        <div className="flex items-center gap-2 border border-muted px-2 py-1">
                            <button
                                onClick={() => skip(-10)}
                                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                title="Previous / rewind 10s"
                            >
                                <Undo size={13} />
                            </button>

                            <button
                                onClick={() => setPlaying(!isPlaying)}
                                className="w-7 h-7 border border-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors shrink-0"
                                title={isPlaying ? "Pause" : "Play"}
                            >
                                {isPlaying ? (
                                    <Pause size={12} />
                                ) : (
                                    <Play size={12} />
                                )}
                            </button>

                            <button
                                onClick={() => skip(10)}
                                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                title="Next / forward 10s"
                            >
                                <Redo size={13} />
                            </button>
                        </div>

                        {/* Sound controls together */}
                        <div className="relative flex items-center gap-2 border border-muted px-2 py-1">
                            <button
                                onClick={() => setMuted((value) => !value)}
                                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                title="Mute / unmute"
                            >
                                {muted ? "UNMUTE" : "MUTE"}
                            </button>
                            <button
                                onClick={() => setShowVolume((value) => !value)}
                                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                title="Volume"
                            >
                                {muted || volume === 0 ? (
                                    <VolumeX size={13} />
                                ) : (
                                    <Volume2 size={13} />
                                )}
                            </button>

                            {showVolume && (
                                <div className="absolute bottom-10 right-0 bg-surface-1 border border-muted p-2 flex flex-col items-center gap-1 z-10">
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={muted ? 0 : volume}
                                        onChange={(event) => {
                                            setVolume(
                                                Number(event.target.value),
                                            );
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

                        {/* Close button at far end */}
                        <button
                            onClick={() => {
                                setAudioUrl(null);
                                setPlaying(false);
                            }}
                            className="w-7 h-7 border border-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors shrink-0"
                            title="Close player"
                        >
                            <X size={13} />
                        </button>
                    </div>
                </div>
                {canSeek && (
                    <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                            {formatTime(currentTime)}
                        </span>
                        <input
                            type="range"
                            min={0}
                            max={duration}
                            step={0.5}
                            value={currentTime}
                            onChange={(event) => {
                                const next = Number(event.target.value);
                                if (!Number.isFinite(next)) return;
                                setCurrentTime(next);
                                if (playerRef.current)
                                    playerRef.current.currentTime = next;
                            }}
                            className="flex-1 h-px accent-terminal cursor-pointer"
                            style={{
                                accentColor: "hsl(var(--terminal-green))",
                            }}
                        />
                        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                            {formatTime(duration)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
