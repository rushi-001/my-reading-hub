import { useCallback, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { Plus, Trash2 } from "lucide-react";
import { useBooks } from "@/store/bookStore";

const obsidianTheme = EditorView.theme({
  "&": { background: "hsl(0 0% 0%)", color: "hsl(0 0% 100%)" },
  ".cm-content": { caretColor: "hsl(142 100% 50%)" },
  ".cm-cursor": { borderLeftColor: "hsl(142 100% 50%)" },
  ".cm-selectionBackground": { background: "hsl(142 100% 50% / 0.15)" },
  ".cm-line": { padding: "0 12px" },
  ".cm-gutters": { background: "hsl(0 0% 0%)", border: "none", color: "hsl(0 0% 30%)" },
  ".cm-activeLineGutter": { background: "hsl(0 0% 4%)" },
  ".cm-activeLine": { background: "hsl(0 0% 4%)" },
}, { dark: true });

interface Props { bookId: string; }

export function NoteEditor({ bookId }: Props) {
  const { notesForBook, activeNote, addNote, updateNote, deleteNote, openNote } = useBooks();
  const notes = notesForBook(bookId);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((value: string) => {
    if (!activeNote) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => updateNote(activeNote.id, { content: value }), 500);
  }, [activeNote, updateNote]);

  return (
    <div className="flex flex-col h-full border-l border-muted bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-muted shrink-0">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Notes ({notes.length})
        </span>
        <button
          onClick={() => addNote(bookId, `Note ${notes.length + 1}`)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus size={10} /> New
        </button>
      </div>

      {notes.length > 0 && (
        <div className="flex flex-col border-b border-muted max-h-36 overflow-y-auto shrink-0">
          {notes.map((n) => (
            <div
              key={n.id}
              onClick={() => openNote(n.id)}
              className={`group flex items-center gap-2 px-4 py-2 cursor-pointer text-xs border-b border-muted/40 transition-colors ${
                activeNote?.id === n.id ? "text-foreground bg-surface-1" : "text-muted-foreground hover:text-foreground hover:bg-surface-1"
              }`}
            >
              <span className="flex-1 truncate">{n.title}</span>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }}
              >
                <Trash2 size={9} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeNote ? (
          <CodeMirror
            value={activeNote.content}
            onChange={handleChange}
            extensions={[markdown(), obsidianTheme]}
            theme="none"
            basicSetup={{ lineNumbers: true, foldGutter: false }}
            style={{ height: "100%", overflow: "auto" }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <p className="text-[11px] text-muted-foreground">No note selected</p>
            <button
              onClick={() => addNote(bookId, `Note ${notes.length + 1}`)}
              className="text-xs border border-muted px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              + New Note
            </button>
          </div>
        )}
      </div>

      {activeNote && (
        <div className="px-4 py-2 border-t border-muted shrink-0">
          <span className="text-[9px] text-muted-foreground/60 font-mono">
            auto-save · {new Date(activeNote.updatedAt).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}
