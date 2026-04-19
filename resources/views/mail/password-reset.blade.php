<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Réinitialisation du mot de passe — {{ config('app.name') }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f0e8;">
        <tr>
            <td align="center" style="padding:40px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;border:1px solid #e0d9ce;box-shadow:0 4px 24px rgba(20,20,20,0.06);">
                    <tr>
                        <td style="padding:36px 40px 28px 40px;text-align:center;border-bottom:1px solid #ebe5d8;">
                            <p style="margin:0;font-family:Georgia,'Times New Roman',Times,serif;font-size:26px;font-weight:700;color:#141414;letter-spacing:0.14em;">
                                {{ config('app.name', 'HARIMI') }}
                            </p>
                            <p style="margin:10px 0 0 0;font-size:11px;font-weight:600;color:#6b6560;text-transform:uppercase;letter-spacing:0.14em;">
                                Réinitialisation du mot de passe
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 40px 8px 40px;">
                            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.5;color:#374151;">
                                Bonjour{{ isset($user) && $user->name ? ' ' . e($user->name) : '' }},
                            </p>
                            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:#4b5563;">
                                Vous recevez cet e-mail parce qu’une demande de réinitialisation de mot de passe a été effectuée pour votre compte.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:8px 40px 28px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center" bgcolor="#141414" style="border-radius:6px;">
                                        <a href="{{ $url }}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#faf8f4;text-decoration:none;font-family:Georgia,'Times New Roman',Times,serif;letter-spacing:0.06em;text-transform:uppercase;">
                                            Réinitialiser le mot de passe
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 40px 28px 40px;">
                            <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">
                                Ce lien expirera dans {{ (int) ($expireMinutes ?? 60) }} minutes.
                            </p>
                            <p style="margin:16px 0 0 0;font-size:14px;line-height:1.6;color:#6b7280;">
                                Si vous n’êtes pas à l’origine de cette demande, ignorez simplement ce message.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 40px 32px 40px;border-top:1px solid #ebe5d8;background-color:#faf8f4;border-radius:0 0 12px 12px;">
                            <p style="margin:0 0 12px 0;font-size:12px;line-height:1.55;color:#6b6560;">
                                Si le bouton ne fonctionne pas, copiez-collez cette adresse dans votre navigateur&nbsp;:
                            </p>
                            <p style="margin:0;word-break:break-all;font-size:12px;line-height:1.5;color:#141414;">
                                <a href="{{ $url }}" style="color:#141414;text-decoration:underline;">{{ $url }}</a>
                            </p>
                            <p style="margin:24px 0 0 0;font-size:12px;color:#9ca3af;">
                                Cordialement,<br>
                                <span style="color:#141414;font-weight:600;">{{ config('app.name', 'HARIMI') }}</span>
                            </p>
                        </td>
                    </tr>
                </table>
                <p style="margin:24px 0 0 0;font-size:11px;color:#9ca3af;text-align:center;">
                    © {{ date('Y') }} {{ config('app.name', 'HARIMI') }}
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
