import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <AppLogoIcon className="size-8 shrink-0 text-sidebar-foreground" />
            <div className="grid min-w-0 flex-1 text-left">
                <span className="font-serif text-[1.05rem] font-semibold tracking-[0.22em] text-sidebar-foreground">
                    HARIMI
                </span>
                <span
                    className="mt-1.5 h-px w-full max-w-[4.5rem] bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-90"
                    aria-hidden
                />
            </div>
        </div>
    );
}
