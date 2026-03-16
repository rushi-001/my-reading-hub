import { useRef, ChangeEvent } from "react";

interface ProgressRingProps {
  progress: number; // 0–100
  size?: number;
  stroke?: number;
}

export function ProgressRing({ progress, size = 48, stroke = 1.5 }: ProgressRingProps) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (progress / 100) * circ;

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 pointer-events-none"
      style={{ transform: "rotate(-90deg)" }}
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="hsl(var(--muted))"
        strokeWidth={stroke}
        fill="none"
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="hsl(var(--terminal-green))"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="square"
        style={{ transition: "stroke-dasharray 0.4s ease" }}
      />
    </svg>
  );
}

// ── Star Rating ──
export function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange?: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          className={`text-xs leading-none transition-colors ${
            s <= value ? "text-terminal" : "text-muted-foreground"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Cover Upload ──
export function CoverUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="relative border border-muted bg-surface-1 w-20 h-28 flex items-center justify-center cursor-pointer hover:border-muted-foreground transition-colors overflow-hidden"
      onClick={() => fileRef.current?.click()}
    >
      {value ? (
        <img src={value} alt="cover" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[10px] text-muted-foreground text-center px-1">
          Click to upload cover
        </span>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
