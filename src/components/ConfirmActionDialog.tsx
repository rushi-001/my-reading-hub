import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoaderCircle } from "lucide-react";

interface ConfirmActionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmTone?: "default" | "destructive";
    closeOnConfirm?: boolean;
    isProcessing?: boolean;
    processingLabel?: string;
    processingMessage?: string;
    onConfirm: () => void;
}

export function ConfirmActionDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Delete",
    cancelLabel = "Cancel",
    confirmTone = "destructive",
    closeOnConfirm = true,
    isProcessing = false,
    processingLabel,
    processingMessage,
    onConfirm,
}: ConfirmActionDialogProps) {
    const activeProcessingLabel = processingLabel ?? "Processing...";

    return (
        <AlertDialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (isProcessing) return;
                onOpenChange(nextOpen);
            }}
        >
            <AlertDialogContent
                className="border-muted bg-background text-foreground"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
            >
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-[14px] font-medium">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[11px] text-muted-foreground">
                        {description}
                    </AlertDialogDescription>
                    {isProcessing && (
                        <div className="flex items-center gap-2 rounded-md border border-terminal/30 bg-terminal/10 px-3 py-2 text-[11px] text-terminal">
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            <span>{activeProcessingLabel}</span>
                        </div>
                    )}
                    {isProcessing && processingMessage && (
                        <p className="text-[10px] text-terminal/90">{processingMessage}</p>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        disabled={isProcessing}
                        onClick={(event) => event.stopPropagation()}
                        className="border-muted bg-surface-1 text-muted-foreground hover:text-foreground hover:bg-surface-2 hover:border-muted-foreground"
                    >
                        {cancelLabel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        disabled={isProcessing}
                        onClick={(event) => {
                            if (!closeOnConfirm) {
                                event.preventDefault();
                            }
                            event.stopPropagation();
                            onConfirm();
                        }}
                        className={
                            confirmTone === "destructive"
                                ? "border border-destructive/70 bg-destructive/15 text-destructive hover:bg-destructive/25"
                                : "border border-terminal/70 bg-terminal/10 text-terminal hover:bg-terminal/20"
                        }
                    >
                        {isProcessing ? (
                            <>
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                {activeProcessingLabel}
                            </>
                        ) : (
                            confirmLabel
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
