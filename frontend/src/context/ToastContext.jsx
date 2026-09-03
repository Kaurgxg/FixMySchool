import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

// A small, dependency-free toast system: call useToast() anywhere inside
// <ToastProvider> to get a `showToast(message, type)` function. Used for
// success/error feedback on actions (assign, status update, reminders,
// user activation, exports) that don't otherwise navigate anywhere, so the
// person always gets a clear confirmation the action actually happened.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const showToast = useCallback((message, type = "success") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "fixed",
          bottom: 18,
          right: 18,
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: "min(340px, calc(100vw - 32px))",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            style={{
              background: t.type === "error" ? "#3D1208" : "#1C0D04",
              border: `1.5px solid ${t.type === "error" ? "#E05252" : "#C8960C"}`,
              color: t.type === "error" ? "#FFD8D8" : "#F2E5C4",
              borderRadius: 10,
              padding: "11px 14px",
              fontSize: ".82rem",
              fontWeight: 600,
              boxShadow: "0 8px 24px -6px rgba(0,0,0,.35)",
              animation: "toastIn .2s ease-out",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
