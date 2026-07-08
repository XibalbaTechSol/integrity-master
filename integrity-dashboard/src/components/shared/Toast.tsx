import { useDashboard } from '../../context/useDashboard';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export function ToastManager() {
  const { toasts, removeToast } = useDashboard();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
          {toast.type === 'success' && <CheckCircle size={18} color="var(--success)" aria-hidden="true" />}
          {toast.type === 'error' && <AlertCircle size={18} color="var(--danger)" aria-hidden="true" />}
          {toast.type === 'info' && <Info size={18} color="var(--primary)" aria-hidden="true" />}
          
          <div style={{ flex: 1, fontSize: '0.875rem' }}>{toast.message}</div>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="btn-ghost"
            style={{ padding: '4px' }}
            aria-label="Dismiss notification"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
