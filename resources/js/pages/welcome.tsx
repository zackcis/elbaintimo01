/* REDESIGN: updated for ElbaIntimo UI refresh — kept props unchanged */
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="ElbaIntimo">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700&family=inter:300,400,500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <div className="flex min-h-screen flex-col items-center bg-beige p-6 text-foreground lg:justify-center lg:p-8 dark:bg-beige-2">
                <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-block rounded-[10px] border border-border px-5 py-2 text-sm font-medium text-foreground hover:border-burgundy/50 transition-colors duration-200"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="inline-block rounded-[10px] border border-transparent px-5 py-2 text-sm font-medium text-foreground hover:border-border transition-colors duration-200"
                                >
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="inline-block rounded-[10px] border-2 border-burgundy px-5 py-2 text-sm font-medium text-burgundy hover:bg-burgundy/10 transition-colors duration-200"
                                    >
                                        Register
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>
                <div className="flex w-full items-center justify-center opacity-100 transition-opacity duration-300 lg:grow">
                    <main className="flex w-full max-w-[400px] flex-col-reverse gap-0 lg:max-w-4xl lg:flex-row lg:gap-0">
                        <div className="flex-1 rounded-2xl rounded-t-none bg-card p-8 pb-12 text-sm leading-relaxed shadow-[0_1px_3px_rgba(0,0,0,0.06)] lg:rounded-r-none lg:rounded-tl-2xl lg:p-12 dark:shadow-none dark:border dark:border-border">
                            <h1 className="mb-3 font-serif text-2xl font-semibold text-foreground">
                                ElbaIntimo
                            </h1>
                            <p className="mb-6 text-muted-foreground">
                                Back office for your boutique. Manage products, categories, orders, and clients in one place.
                            </p>
                            {!auth.user && (
                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        href={login()}
                                        className="inline-flex items-center justify-center rounded-[10px] bg-burgundy px-4 py-2.5 text-sm font-medium text-white hover:bg-burgundy-dark transition-colors duration-200"
                                    >
                                        Log in
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="inline-flex items-center justify-center rounded-[10px] border-2 border-burgundy bg-transparent px-4 py-2.5 text-sm font-medium text-burgundy hover:bg-burgundy/10 transition-colors duration-200"
                                        >
                                            Register
                                        </Link>
                                    )}
                                </div>
                            )}
                            {auth.user && (
                                <p className="text-sm text-muted-foreground">
                                    Use the navigation above to open the dashboard.
                                </p>
                            )}
                        </div>
                        <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-t-2xl bg-gradient-to-br from-burgundy/20 to-accent/20 lg:h-auto lg:min-h-[320px] lg:w-[380px] lg:rounded-t-none lg:rounded-r-2xl dark:from-burgundy/30 dark:to-burgundy-dark/40" />
                    </main>
                </div>
                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
