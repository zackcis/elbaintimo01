import { useUi } from '@/hooks/use-ui';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';

export function LocaleSwitcher({ className }: { className?: string }) {
    const page = usePage();
    const { locale } = useUi();
    const path = page.url.split('?')[0] ?? '/';

    const hrefFor = (target: string) =>
        path.replace(/^\/(it|en)(?=\/|$)/, `/${target}`);

    return (
        <div
            className={cn(
                'flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/80 px-2 py-1 text-xs font-medium text-muted-foreground',
                className,
            )}
            role="navigation"
            aria-label="Language"
        >
            <Link
                href={hrefFor('it')}
                preserveScroll
                className={cn(
                    'rounded px-1.5 py-0.5 transition-colors',
                    locale === 'it'
                        ? 'bg-burgundy/15 text-foreground'
                        : 'hover:text-foreground',
                )}
            >
                IT
            </Link>
            <span className="text-border" aria-hidden>
                |
            </span>
            <Link
                href={hrefFor('en')}
                preserveScroll
                className={cn(
                    'rounded px-1.5 py-0.5 transition-colors',
                    locale === 'en'
                        ? 'bg-burgundy/15 text-foreground'
                        : 'hover:text-foreground',
                )}
            >
                EN
            </Link>
        </div>
    );
}
