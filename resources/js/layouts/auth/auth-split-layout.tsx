import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    const { name, quote } = usePage<SharedData>().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-[#1c1916] p-10 text-[#f5f0e8] lg:flex lg:border-r lg:border-border/40">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1c1916] via-[#25211d] to-[#1a1714]" />
                <Link
                    href={home()}
                    className="relative z-20 flex items-center gap-3 text-lg font-medium tracking-tight"
                >
                    <span className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 shadow-sm backdrop-blur-sm">
                        <AppLogoIcon className="size-6 text-[#f5f0e8]" />
                    </span>
                    <span className="font-serif text-base font-semibold tracking-[0.22em]">{name}</span>
                </Link>
                {quote && (
                    <div className="relative z-20 mt-auto">
                        <blockquote className="space-y-3 border-l-2 border-[var(--gold)]/60 pl-5">
                            <p className="text-lg leading-relaxed text-[#f5f0e8]/95">
                                &ldquo;{quote.message}&rdquo;
                            </p>
                            <footer className="text-sm font-medium tracking-wide text-[#c9a962]/90">
                                {quote.author}
                            </footer>
                        </blockquote>
                    </div>
                )}
            </div>
            <div className="w-full bg-background lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] lg:py-4">
                    <Link
                        href={home()}
                        className="relative z-20 flex flex-col items-center justify-center gap-2 lg:hidden"
                    >
                        <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
                            <AppLogoIcon className="size-8 text-foreground" />
                        </span>
                        <span className="font-serif text-xs font-semibold tracking-[0.22em] text-foreground">
                            {name}
                        </span>
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="font-serif text-xl font-semibold text-foreground">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">{description}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
