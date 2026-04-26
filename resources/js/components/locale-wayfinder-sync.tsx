import { setUrlDefaults } from '@/wayfinder';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * Keeps Wayfinder URL defaults aligned with the active `{locale}` route segment.
 */
export function LocaleWayfinderSync(): null {
    const page = usePage<{ harimi?: { currentLocale?: string } }>();

    useEffect(() => {
        const locale = page.props.harimi?.currentLocale ?? 'it';
        setUrlDefaults({ locale });
    }, [page.url, page.props.harimi?.currentLocale]);

    return null;
}
