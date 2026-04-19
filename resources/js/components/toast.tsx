/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastProps {
    toast: Toast;
    onClose: (id: string) => void;
}

export function ToastComponent({ toast, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation
        setTimeout(() => setIsVisible(true), 10);
        
        // Auto-dismiss after 4 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose(toast.id), 300);
        }, 4000);

        return () => clearTimeout(timer);
    }, [toast.id, onClose]);

    const typeStyles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-orange-50 border-orange-200 text-orange-800',
    };

    return (
        <div
            className={`transition-all duration-300 ease-in-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
        >
            <Alert
                className={`${typeStyles[toast.type]} border rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] min-w-[300px] max-w-md`}
            >
                <AlertDescription className="flex items-center justify-between gap-4">
                    <span className="font-sans text-sm">{toast.message}</span>
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(() => onClose(toast.id), 300);
                        }}
                        className="flex-shrink-0 text-current hover:opacity-70 transition-opacity"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </AlertDescription>
            </Alert>
        </div>
    );
}

interface ToastContainerProps {
    toasts: Toast[];
    onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <ToastComponent key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    );
}

