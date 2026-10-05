import { createContext, useCallback, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, X } from "lucide-react";

const ToastCtx = createContext({ addToast: () => {} });

let _uid = 0;
const EXIT_MS = 200;
const AUTO_DISMISS_MS = 4000;

function ToastCard({ t, onDismiss }) {
  const isError = t.type === "error";
  return (
    <div
      className={[
        "pointer-events-auto flex items-start gap-3 p-4 min-w-0 w-full",
        "bg-white dark:bg-zinc-900",
        "border border-slate-200/80 dark:border-zinc-800",
        "rounded-xl shadow-lg shadow-black/5 dark:shadow-black/30",
        t.removing ? "animate-toast-out" : "animate-toast-in",
      ].join(" ")}
    >
      <div className={`shrink-0 mt-0.5 ${isError ? "text-rose-500 dark:text-rose-400" : "text-emerald-500 dark:text-emerald-400"}`}>
        {isError
          ? <XCircle className="w-4 h-4" />
          : <CheckCircle2 className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100 leading-snug">{t.message}</p>
        {t.description && (
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{t.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(t.id)}
        aria-label="Dismiss notification"
        className="shrink-0 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 p-0.5 rounded transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const autoTimers = useRef({});

  const remove = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, removing: true } : t))
    );
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      EXIT_MS + 20
    );
  }, []);

  const dismiss = useCallback(
    (id) => {
      clearTimeout(autoTimers.current[id]);
      delete autoTimers.current[id];
      remove(id);
    },
    [remove]
  );

  const addToast = useCallback(
    (message, type = "success", description = "") => {
      const id = ++_uid;
      setToasts((prev) => [...prev, { id, message, type, description, removing: false }]);
      autoTimers.current[id] = setTimeout(() => remove(id), AUTO_DISMISS_MS);
    },
    [remove]
  );

  return (
    <ToastCtx.Provider value={{ addToast }}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          aria-label="Notifications"
          className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        >
          {toasts.map((t) => (
            <ToastCard key={t.id} t={t} onDismiss={dismiss} />
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
