import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-beige/40 p-6 md:bg-background md:p-10">
            <div className="flex w-full max-w-md flex-col gap-6">
                <Link
                    href={home()}
                    className="flex flex-col items-center gap-2 self-center font-medium"
                >
                    <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
                        <AppLogoIcon className="size-7 text-foreground dark:text-[#f5f0e8]" />
                    </span>
                    <span className="font-serif text-xs font-semibold tracking-[0.22em] text-muted-foreground">
                        HARIMI
                    </span>
                </Link>

                <div className="flex flex-col gap-6">
                    <Card className="rounded-2xl border-border/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                        <CardHeader className="px-10 pb-0 pt-8 text-center">
                            <CardTitle className="font-serif text-xl font-semibold">{title}</CardTitle>
                            <CardDescription className="text-muted-foreground">{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">{children}</CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
