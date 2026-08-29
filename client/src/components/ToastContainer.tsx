import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { useApp } from "@/components/AppProvider";

export interface Toast {
  id: string;
  message: string;
  variant: "success" | "error" | "info";
  duration?: number;
}

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  return (
    <div
      className="fixed bottom-6 right-6 z-[99990] flex flex-col-reverse gap-3 pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 3500);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const icons = {
    success: <CheckCircle className="size-5 shrink-0 text-[#46d369]" />,
    error: <XCircle className="size-5 shrink-0 text-[#e50914]" />,
    info: <Info className="size-5 shrink-0 text-[#3b82f6]" />,
  };

  const borders = {
    success: "border-l-[#46d369]",
    error: "border-l-[#e50914]",
    info: "border-l-[#3b82f6]",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: "spring" as const, damping: 20, stiffness: 260 }}
      className={`pointer-events-auto flex min-w-[260px] max-w-[360px] items-start gap-3 rounded-xl border border-white/10 border-l-4 ${borders[toast.variant]} bg-[#1a1a1a]/95 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-xl`}
    >
      {icons[toast.variant]}
      <p className="flex-1 text-sm font-medium text-white leading-snug pt-0.5">
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-full p-1 text-white/40 transition hover:text-white hover:bg-white/10"
        aria-label="Dismiss notification"
      >
        <X className="size-3.5" />
      </button>
    </motion.div>
  );
}
