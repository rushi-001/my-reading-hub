import { Play, Pause, Volume2, X } from "lucide-react";
import { useBooks } from "@/store/bookStore";

export function AudioPlayerBar() {
  const { audioUrl, isPlaying, setPlaying, setAudioUrl, activeBook } = useBooks();

  if (!audioUrl) return null;

  return (
    <div className="h-player border-t border-muted bg-surface-1 flex items-center px-6 gap-4 shrink-0">
      {/* react-player rendered as iframe for YouTube */}
      {isPlaying && (
        <iframe
          src={`https://www.youtube.com/embed/${extractYoutubeId(audioUrl)}?autoplay=1&controls=0`}
          allow="autoplay"
          className="hidden"
          title="audio"
        />
      )}
      <button
        onClick={() => setPlaying(!isPlaying)}
        className="w-7 h-7 border border-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors shrink-0"
      >
        {isPlaying ? <Pause size={11} /> : <Play size={11} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-foreground truncate font-mono">{activeBook?.title ?? "Audio"}</p>
        <p className="text-[10px] text-muted-foreground truncate">{activeBook?.author ?? audioUrl}</p>
      </div>
      <Volume2 size={11} className="text-muted-foreground shrink-0" />
      <button
        onClick={() => { setAudioUrl(null); setPlaying(false); }}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <X size={11} />
      </button>
    </div>
  );
}

function extractYoutubeId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : "";
}
