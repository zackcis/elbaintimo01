import { usePage } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';

type HarimiProps = {
    locales?: string[];
    currentLocale?: string;
    publicDefaultLocale?: string;
};

type PageProps = {
    ui?: Record<string, string>;
    harimi?: HarimiProps;
};

export function useUi() {
    const page = usePage<PageProps>();
    const ui = page.props.ui ?? {};
    const locale = page.props.harimi?.currentLocale ?? 'it';
    const otherLocale = locale === 'it' ? 'en' : 'it';

    const t = useCallback(
        (key: string) => {
            const value = ui[key];
            if (value !== undefined && value !== '') {
                return value;
            }

            return key;
        },
        [ui],
    );

    return useMemo(
        () => ({
            t,
            locale,
            otherLocale,
            locales: page.props.harimi?.locales ?? ['it', 'en'],
        }),
        [t, locale, otherLocale, page.props.harimi?.locales],
    );
}
