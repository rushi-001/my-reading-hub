import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Eye,
  EyeOff,
  AlignCenter,
  ArrowUpToLine,
  Settings,
} from "lucide-react";
import { useBooks } from "@/store/bookStore";

export function SettingsPanel() {
  const { isSettingsOpen, setSettingsOpen, settings, updateSettings } = useBooks();

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <>
          <motion.div
            key="settings-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70"
            onClick={() => setSettingsOpen(false)}
          />
          <motion.div
            key="settings-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[340px] max-w-full bg-background border-l border-muted flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-muted">
              <div className="flex items-center gap-2">
                <Settings size={15} className="text-terminal" />
                <span className="text-[12px] font-mono font-medium">Settings</span>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* Command Palette */}
              <Section label="Command Palette">
                <Row
                  label="Show Icons"
                  description="Show format icons next to search results"
                >
                  <Toggle
                    value={settings.showIcons}
                    onChange={(v) => updateSettings({ showIcons: v })}
                  />
                </Row>
                <Row
                  label="Position"
                  description="Where the palette appears on screen"
                >
                  <div className="flex gap-1">
                    <PillBtn
                      active={settings.commandPalettePosition === "top"}
                      onClick={() => updateSettings({ commandPalettePosition: "top" })}
                      icon={<AlignTop size={12} />}
                      label="Top"
                    />
                    <PillBtn
                      active={settings.commandPalettePosition === "center"}
                      onClick={() => updateSettings({ commandPalettePosition: "center" })}
                      icon={<AlignCenter size={12} />}
                      label="Center"
                    />
                  </div>
                </Row>
              </Section>

              {/* Library */}
              <Section label="Library">
                <Row
                  label="Stack Groups"
                  description="Show grouped books as stacked cards"
                >
                  <Toggle
                    value={settings.stackGroups}
                    onChange={(v) => updateSettings({ stackGroups: v })}
                  />
                </Row>
                {settings.stackGroups && (
                  <Row
                    label="Max Visible in Stack"
                    description="How many covers to show stacked (2–5)"
                  >
                    <div className="flex gap-1">
                      {[2, 3, 4, 5].map((n) => (
                        <PillBtn
                          key={n}
                          active={settings.stackMaxVisible === n}
                          onClick={() => updateSettings({ stackMaxVisible: n })}
                          label={String(n)}
                        />
                      ))}
                    </div>
                  </Row>
                )}
              </Section>

              {/* Sidebar */}
              <Section label="Interface">
                <Row
                  label="Sidebar"
                  description="Show or hide the left sidebar"
                >
                  <div className="flex gap-1">
                    <PillBtn
                      active={settings.sidebarVisible}
                      onClick={() => updateSettings({ sidebarVisible: true })}
                      icon={<Eye size={12} />}
                      label="Show"
                    />
                    <PillBtn
                      active={!settings.sidebarVisible}
                      onClick={() => updateSettings({ sidebarVisible: false })}
                      icon={<EyeOff size={12} />}
                      label="Hide"
                    />
                  </div>
                </Row>
              </Section>

              {/* Auto Scroll */}
              <Section label="Reader">
                <Row
                  label="Auto-Scroll Speed"
                  description="0 = off, higher = faster"
                >
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <PillBtn
                        key={n}
                        active={settings.autoScrollSpeed === n}
                        onClick={() => updateSettings({ autoScrollSpeed: n })}
                        label={n === 0 ? "Off" : String(n)}
                      />
                    ))}
                  </div>
                </Row>
              </Section>
            </div>

            {/* Footer hint */}
            <div className="px-5 py-3 border-t border-muted">
              <p className="text-[10px] text-muted-foreground/60 font-mono">
                Settings saved automatically · ⌘, to open
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-mono">{label}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[12px] text-foreground">{label}</p>
        {description && <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-9 h-5 border transition-colors ${
        value ? "border-terminal bg-terminal/20" : "border-muted bg-surface-1"
      }`}
    >
      <span
        className={`absolute top-0.5 w-3.5 h-3.5 transition-all ${
          value ? "left-4 bg-terminal" : "left-0.5 bg-muted-foreground"
        }`}
      />
    </button>
  );
}

function PillBtn({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 text-[11px] border transition-colors ${
        active
          ? "border-terminal text-terminal"
          : "border-muted text-muted-foreground hover:border-muted-foreground"
      }`}
    >
      {icon}{label}
    </button>
  );
}
