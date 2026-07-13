import { setUrlDefaults } from '@/wayfinder';
import { usePage } from '@inertiajs/react';

type PageLike = {
    url: string;
    props?: { harimi?: { currentLocale?: string } };
};

/**
 * Infer storefront locale segment from Inertia page props or URL path.
 */
export function inferHarimiLocale(page: PageLike): string {
    const path = page.url.split('?')[0] ?? '';
    const fromPath = path.match(/^\/(it|en)(?:\/|$)/)?.[1];
    const fromProps = page.props?.harimi?.currentLocale;
    if (typeof fromProps === 'string' && fromProps.length > 0) {
        return fromProps;
    }
    return fromPath ?? 'it';
}

/**
 * Sets Wayfinder URL defaults from the current Inertia page.
 * Call at the top of any page component that builds localized `href`s in JSX
 * (before `login()`, `register()`, etc.) — child components like
 * `<LocaleWayfinderSync />` run too late because sibling `href={login()}`
 * arguments are evaluated before their function bodies execute.
 */
export function syncHarimiWayfinderDefaults(page: PageLike): void {
    setUrlDefaults({ locale: inferHarimiLocale(page) });
}

/**
 * Keeps Wayfinder URL defaults aligned when navigating between pages (same
 * pattern as syncHarimiWayfinderDefaults; safe to mount under layouts).
 */
export function LocaleWayfinderSync(): null {
    const page = usePage<{ harimi?: { currentLocale?: string } }>();
    syncHarimiWayfinderDefaults(page);
    return null;
}
