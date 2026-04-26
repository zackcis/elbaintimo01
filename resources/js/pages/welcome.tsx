/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { LocaleSwitcher } from '@/components/locale-switcher';
import { LocaleWayfinderSync } from '@/components/locale-wayfinder-sync';
import { useUi } from '@/hooks/use-ui';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;
    const { t } = useUi();

    return (
        <>
            <Head title="HARIMI">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=playfair-display:500,600,700&family=instrument-sans:400,500,600,700&family=inter:300,400,500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <LocaleWayfinderSync />
            <div className="flex min-h-screen flex-col items-center bg-beige p-6 text-foreground lg:justify-center lg:p-8 dark:bg-beige-2">
                <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        <LocaleSwitcher />
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-block rounded-[10px] border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:border-burgundy/50"
                            >
                                {t('welcome.dashboard')}
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="inline-block rounded-[10px] border border-transparent px-5 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:border-border"
                                >
                                    {t('welcome.log_in')}
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="inline-block rounded-[10px] border-2 border-burgundy px-5 py-2 text-sm font-medium text-burgundy transition-colors duration-200 hover:bg-burgundy/10"
                                    >
                                        {t('welcome.register')}
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>
                <div className="flex w-full items-center justify-center opacity-100 transition-opacity duration-300 lg:grow">
                    <main className="flex w-full max-w-[400px] flex-col-reverse gap-0 lg:max-w-4xl lg:flex-row lg:gap-0">
                        <div className="flex-1 rounded-2xl rounded-t-none bg-card p-8 pb-12 text-sm leading-relaxed shadow-[0_1px_3px_rgba(0,0,0,0.06)] lg:rounded-r-none lg:rounded-tl-2xl lg:p-12 dark:border dark:border-border dark:shadow-none">
                            <h1 className="mb-3 font-serif text-2xl font-semibold text-foreground">
                                {t('welcome.title')}
                            </h1>
                            <p className="mb-6 text-muted-foreground">{t('welcome.tagline')}</p>
                            {!auth.user && (
                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        href={login()}
                                        className="inline-flex items-center justify-center rounded-[10px] bg-burgundy px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-burgundy-dark"
                                    >
                                        {t('welcome.log_in')}
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="inline-flex items-center justify-center rounded-[10px] border-2 border-burgundy bg-transparent px-4 py-2.5 text-sm font-medium text-burgundy transition-colors duration-200 hover:bg-burgundy/10"
                                        >
                                            {t('welcome.register')}
                                        </Link>
                                    )}
                                </div>
                            )}
                            {auth.user && (
                                <p className="text-sm text-muted-foreground">{t('welcome.logged_in_hint')}</p>
                            )}
                        </div>
                        <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-t-2xl bg-gradient-to-br from-foreground/8 via-[var(--gold)]/15 to-transparent lg:h-auto lg:min-h-[320px] lg:w-[380px] lg:rounded-t-none lg:rounded-r-2xl dark:from-foreground/15 dark:via-[var(--gold)]/20 dark:to-transparent" />
                    </main>
                </div>
                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
