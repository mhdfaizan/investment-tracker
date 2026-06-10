import type { Toast, ToastVariant } from '../hooks/useToast';

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const variantIcons: Record<ToastVariant, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
};

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 sm:right-4 sm:top-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${variantStyles[toast.variant]} border rounded-lg px-4 py-3 shadow-lg flex items-start gap-2 animate-[slideIn_0.3s_ease-out]`}
          role="alert"
        >
          <span className="flex-shrink-0">{variantIcons[toast.variant]}</span>
          <p className="text-sm flex-1">{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
