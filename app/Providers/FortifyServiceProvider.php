<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Http\Responses\Fortify\LocalizedRedirectAsIntended;
use App\Http\Responses\Fortify\LoginResponse as LocalizedLoginResponse;
use App\Http\Responses\Fortify\LogoutResponse as LocalizedLogoutResponse;
use App\Http\Responses\Fortify\PasswordConfirmedResponse as LocalizedPasswordConfirmedResponse;
use App\Http\Responses\Fortify\PasswordResetResponse as LocalizedPasswordResetResponse;
use App\Http\Responses\Fortify\RegisterResponse as LocalizedRegisterResponse;
use App\Http\Responses\Fortify\TwoFactorLoginResponse as LocalizedTwoFactorLoginResponse;
use App\Http\Responses\Fortify\VerifyEmailResponse as LocalizedVerifyEmailResponse;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;
use Laravel\Fortify\Contracts\PasswordConfirmedResponse as PasswordConfirmedResponseContract;
use Laravel\Fortify\Contracts\PasswordResetResponse as PasswordResetResponseContract;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;
use Laravel\Fortify\Contracts\VerifyEmailResponse as VerifyEmailResponseContract;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Http\Responses\RedirectAsIntended;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        Fortify::$registersRoutes = false;
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
        $this->configureFortifyResponses();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register'));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }

    private function configureFortifyResponses(): void
    {
        $this->app->bind(RedirectAsIntended::class, LocalizedRedirectAsIntended::class);

        $this->app->singleton(LoginResponseContract::class, LocalizedLoginResponse::class);
        $this->app->singleton(LogoutResponseContract::class, LocalizedLogoutResponse::class);
        $this->app->singleton(RegisterResponseContract::class, LocalizedRegisterResponse::class);
        $this->app->singleton(TwoFactorLoginResponseContract::class, LocalizedTwoFactorLoginResponse::class);
        $this->app->singleton(VerifyEmailResponseContract::class, LocalizedVerifyEmailResponse::class);
        $this->app->singleton(PasswordConfirmedResponseContract::class, LocalizedPasswordConfirmedResponse::class);
        $this->app->singleton(PasswordResetResponseContract::class, LocalizedPasswordResetResponse::class);
    }
}
