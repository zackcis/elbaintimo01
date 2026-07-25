/* Registration disabled — staff accounts are invite-only. */
import { login } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { useUi } from '@/hooks/use-ui';
import AuthLayout from '@/layouts/auth-layout';

export default function Register() {
    const { t } = useUi();

    return (
        <AuthLayout
            title={t('auth.login.title')}
            description={t('auth.login.description')}
        >
            <Head title={t('auth.login.heading')} />
            <p className="text-center text-sm text-muted-foreground">
                {t('auth.register.have_account')}{' '}
                <Link href={login()} className="text-foreground underline">
                    {t('welcome.log_in')}
                </Link>
            </p>
        </AuthLayout>
    );
}
