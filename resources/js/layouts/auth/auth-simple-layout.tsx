/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import AppLogoIcon from '@/components/app-logo-icon';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { LocaleWayfinderSync } from '@/components/locale-wayfinder-sync';
import { home as storefrontHome } from '@/routes/storefront';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <LocaleWayfinderSync />
            <div className="absolute right-4 top-4 md:right-8 md:top-8">
                <LocaleSwitcher />
            </div>
            <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/95 p-8 shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={storefrontHome()}
                            className="flex flex-col items-center gap-2 font-medium outline-none ring-ring/40 focus-visible:rounded-lg focus-visible:ring-2"
                        >
                            <span className="mb-0.5 flex size-12 items-center justify-center rounded-xl border border-border bg-beige/50 shadow-inner">
                                <AppLogoIcon className="size-7 text-foreground dark:text-[#f5f0e8]" />
                            </span>
                            <span className="font-serif text-xs font-semibold tracking-[0.22em] text-muted-foreground">
                                HARIMI
                            </span>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="font-serif text-xl font-semibold text-foreground">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">{description}</p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
