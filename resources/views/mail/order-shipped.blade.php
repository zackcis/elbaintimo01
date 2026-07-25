<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="utf-8">
    <title>Spedizione {{ $order->reference }}</title>
</head>
<body style="margin:0;padding:0;background:#f7f3ec;font-family:Georgia,serif;color:#141414;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f3ec;">
    <tr>
        <td align="center" style="padding:40px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e0d9ce;">
                <tr>
                    <td style="padding:32px 28px;">
                        <p style="margin:0;letter-spacing:0.28em;font-size:14px;text-transform:uppercase;">HARIMI</p>
                        <div style="margin-top:8px;width:96px;height:1px;background:#141414;opacity:0.4;"></div>
                        <h1 style="margin:24px 0 8px;font-size:28px;font-weight:500;">Il tuo ordine è in viaggio</h1>
                        <p style="margin:0;font-size:14px;line-height:1.6;color:#6b6560;">
                            L’ordine <strong>{{ $order->reference }}</strong> è stato spedito.
                        </p>

                        @if ($order->shipping_carrier || $order->tracking_number)
                            <div style="margin-top:24px;padding:16px;border:1px solid #e0d9ce;background:#faf7f2;">
                                @if ($order->shipping_carrier)
                                    <p style="margin:0 0 8px;font-size:14px;">
                                        Corriere: <strong>{{ $order->shipping_carrier }}</strong>
                                    </p>
                                @endif
                                @if ($order->tracking_number)
                                    <p style="margin:0;font-size:14px;">
                                        Tracking: <strong>{{ $order->tracking_number }}</strong>
                                    </p>
                                @endif
                                @if ($order->tracking_url)
                                    <p style="margin:12px 0 0;font-size:14px;">
                                        <a href="{{ $order->tracking_url }}" style="color:#141414;">Segui la spedizione</a>
                                    </p>
                                @endif
                            </div>
                        @endif

                        @if ($order->shipping_line1)
                            <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b6560;">
                                Destinazione:<br>
                                {{ $order->client_name }}<br>
                                {{ $order->shipping_line1 }}
                                @if ($order->shipping_line2)<br>{{ $order->shipping_line2 }}@endif
                                <br>
                                {{ $order->shipping_postal_code }} {{ $order->shipping_city }} ({{ $order->shipping_province }})
                                <br>
                                {{ $order->shipping_country }}
                            </p>
                        @endif
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
