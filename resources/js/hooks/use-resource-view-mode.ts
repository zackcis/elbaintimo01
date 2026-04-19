import { useCallback, useEffect, useState } from 'react';
import {
    type ResourceViewMode,
    isResourceViewMode,
} from '@/lib/resource-view';

const DEFAULT_MODE: ResourceViewMode = 'medium-icons';

export function useResourceViewMode(storageKey: string) {
    const [mode, setModeState] = useState<ResourceViewMode>(() => {
        if (typeof window === 'undefined') {
            return DEFAULT_MODE;
        }
        const raw = localStorage.getItem(storageKey);
        if (raw && isResourceViewMode(raw)) {
            return raw;
        }
        return DEFAULT_MODE;
    });

    const setMode = useCallback((next: ResourceViewMode) => {
        setModeState(next);
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, mode);
        } catch {
            /* ignore quota / private mode */
        }
    }, [storageKey, mode]);

    return { mode, setMode };
}
