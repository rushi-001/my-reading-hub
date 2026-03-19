import { useState, useEffect, ChangeEvent, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Link2, FileText, Headphones } from "lucide-react";
import { useBooks } from "@/store/bookStore";
import { CoverUpload, StarRating } from "@/components/ui/BookUI";
import type { BookFormat, Book } from "@/types/book";
import { normalizeBookGroup } from "@/lib/bookSearch";

// Reusing the same formats and input styles
const FORMATS: { value: BookFormat; label: string; icon: React.ReactNode }[] = [
    { value: "pdf", label: "PDF", icon: <FileText size={13} /> },
    { value: "epub", label: "EPUB", icon: <FileText size={13} /> },
    { value: "audio", label: "Audio", icon: <Headphones size={13} /> },
    { value: "video", label: "Video", icon: <Headphones size={13} /> },
    { value: "podcast", label: "Podcast", icon: <Headphones size={13} /> },
];

const INPUT_CLS =
    "w-full bg-surface-1 border border-muted px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-muted-foreground transition-colors font-mono";

interface Props {
    open: boolean;
    onClose: () => void;
    book: Book | null; // The book to edit
}

export function EditBookDrawer({ open, onClose, book }: Props) {
    const { updateBook, books } = useBooks();
    const fileRef = useRef<HTMLInputElement>(null);
    const groupOptions = Array.from(
        new Set(
            books
                .map((item) => item.groupId)
                .filter((group): group is string => Boolean(group)),
        ),
    ).sort((a, b) => a.localeCompare(b));

    // Form State
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [desc, setDesc] = useState("");
    const [cover, setCover] = useState<string | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [format, setFormat] = useState<BookFormat>("pdf");
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [contentFile, setContentFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState("");
    const [audioUrl, setAudioUrl] = useState("");
    const [rating, setRating] = useState(0);
    const [tags, setTags] = useState("");
    const [group, setGroup] = useState("");
    const [error, setError] = useState("");

    // Reset helper
    const reset = () => {
        setTitle("");
        setAuthor("");
        setDesc("");
        setCover(null);
        setCoverFile(null);
        setFormat("pdf");
        setFileUrl(null);
        setContentFile(null);
        setFileName("");
        setAudioUrl("");
        setRating(0);
        setTags("");
        setGroup("");
        setError("");
    };

    // Populate form when book changes or drawer opens
    useEffect(() => {
        if (open && book) {
            setTitle(book.title);
            setAuthor(book.author);
            setDesc(book.description || "");
            setCover(book.cover);
            setCoverFile(null);
            setFormat(book.format);
            setFileUrl(book.fileUrl);
            setContentFile(null);
            setFileName(book.fileUrl ? "Current file" : "");
            setAudioUrl(book.audioUrl || "");
            setRating(book.rating);
            setTags(book.tags.join(", "));
            setGroup(book.groupId || "");
            setError("");
        } else if (!open) {
            reset();
        }
    }, [open, book]);

    const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFileName(f.name);
        setContentFile(f);
        setFileUrl(URL.createObjectURL(f));
    };

    const isAudioFormat = ["audio", "video", "podcast"].includes(format);

    const handleSubmit = () => {
        if (!book) return;
        if (!title.trim()) {
            setError("Title is required");
            return;
        }

        // Validation logic (same as add)
        if (!isAudioFormat && !fileUrl) {
            setError("Please select a file");
            return;
        }
        if (isAudioFormat && !audioUrl.trim()) {
            setError("Please provide a URL");
            return;
        }

        updateBook(book.id, {
            title: title.trim(),
            author: author.trim() || "Unknown Author",
            description: desc.trim(),
            cover,
            format,
            // If it's a file format, use the new fileUrl or keep the existing one
            fileUrl: isAudioFormat ? null : fileUrl || book.fileUrl,
            // If it's audio format, use new audioUrl or keep existing
            audioUrl: isAudioFormat ? audioUrl.trim() : book.audioUrl,
            rating,
            tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            groupId: normalizeBookGroup(group),
        }, {
            coverFile,
            contentFile: isAudioFormat ? null : contentFile,
        });

        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key="drawer-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/60"
                        onClick={onClose}
                    />
                    <motion.div
                        key="drawer"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed right-0 top-0 bottom-0 z-50 w-[420px] max-w-full
              bg-background border-l border-muted flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-muted">
                            <span className="text-sm font-mono font-medium">
                                Edit Book
                            </span>
                            <button
                                onClick={onClose}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div className="flex gap-4">
                                <CoverUpload
                                    value={cover}
                                    onChange={setCover}
                                    onFileSelect={setCoverFile}
                                />
                                <div className="flex-1 space-y-3">
                                    <Field label="Title *">
                                        <input
                                            value={title}
                                            onChange={(e) =>
                                                setTitle(e.target.value)
                                            }
                                            className={INPUT_CLS}
                                        />
                                    </Field>
                                    <Field label="Author">
                                        <input
                                            value={author}
                                            onChange={(e) =>
                                                setAuthor(e.target.value)
                                            }
                                            className={INPUT_CLS}
                                        />
                                    </Field>
                                </div>
                            </div>

                            {/* Format */}
                            <Field label="Format">
                                <div className="flex flex-wrap gap-1">
                                    {FORMATS.map((f) => (
                                        <button
                                            key={f.value}
                                            type="button"
                                            onClick={() => setFormat(f.value)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs border transition-colors ${
                                                format === f.value
                                                    ? "border-terminal text-terminal"
                                                    : "border-muted text-muted-foreground hover:border-muted-foreground"
                                            }`}
                                        >
                                            {f.icon} {f.label}
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            {/* File or URL */}
                            {isAudioFormat ? (
                                <Field label="URL (YouTube / audio / podcast)">
                                    <div className="flex items-center gap-2">
                                        <Link2
                                            size={12}
                                            className="text-muted-foreground shrink-0"
                                        />
                                        <input
                                            value={audioUrl}
                                            onChange={(e) =>
                                                setAudioUrl(e.target.value)
                                            }
                                            className={INPUT_CLS + " flex-1"}
                                        />
                                    </div>
                                </Field>
                            ) : (
                                <Field label="File">
                                    <button
                                        type="button"
                                        onClick={() => fileRef.current?.click()}
                                        className="flex items-center gap-2 px-3 py-2 border border-muted text-xs
                      text-muted-foreground hover:border-muted-foreground hover:text-foreground transition-colors w-full"
                                    >
                                        <Upload size={11} />
                                        {fileName || "Replace file…"}
                                    </button>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept=".pdf,.epub"
                                        className="hidden"
                                        onChange={handleFile}
                                    />
                                </Field>
                            )}

                            {/* Description */}
                            <Field label="Description">
                                <textarea
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                    rows={3}
                                    className={INPUT_CLS + " resize-none"}
                                />
                            </Field>

                            {/* Tags */}
                            <Field label="Tags (comma-separated)">
                                <input
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    className={INPUT_CLS}
                                />
                            </Field>

                            <Field label="Group (optional)">
                                <input
                                    value={group}
                                    onChange={(e) => setGroup(e.target.value)}
                                    placeholder="e.g. History Stack"
                                    list="group-options-edit"
                                    className={INPUT_CLS}
                                />
                                <datalist id="group-options-edit">
                                    {groupOptions.map((groupName) => (
                                        <option key={groupName} value={groupName} />
                                    ))}
                                </datalist>
                            </Field>

                            {/* Rating */}
                            <Field label="Rating">
                                <StarRating
                                    value={rating}
                                    onChange={setRating}
                                />
                            </Field>

                            {error && (
                                <p className="text-xs text-destructive border border-destructive/30 px-3 py-2">
                                    {error}
                                </p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-muted flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 text-xs border border-muted text-muted-foreground
                  hover:border-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 py-2.5 text-xs bg-foreground text-background
                  hover:bg-terminal hover:text-background transition-colors font-medium"
                            >
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                {label}
            </label>
            {children}
        </div>
    );
}
