<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="utf-8">
    <title>Ordine {{ $order->reference }}</title>
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
                        <h1 style="margin:24px 0 8px;font-size:28px;font-weight:500;">Grazie per il tuo ordine</h1>
                        <p style="margin:0;font-size:14px;line-height:1.6;color:#6b6560;">
                            Abbiamo ricevuto il pagamento per l’ordine <strong>{{ $order->reference }}</strong>.
                        </p>

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;border-top:1px solid #e0d9ce;">
                            @foreach ($order->items as $item)
                                <tr>
                                    <td style="padding:12px 0;font-size:14px;border-bottom:1px solid #efe8dc;">
                                        {{ $item->product_name }}
                                        @if ($item->size || $item->color)
                                            <span style="color:#6b6560;"> — {{ trim(implode(' / ', array_filter([$item->color, $item->size]))) }}</span>
                                        @endif
                                        <br>
                                        <span style="color:#6b6560;">× {{ $item->quantity }}</span>
                                    </td>
                                    <td align="right" style="padding:12px 0;font-size:14px;border-bottom:1px solid #efe8dc;white-space:nowrap;">
                                        {{ number_format((float) $item->total_price, 2, ',', '.') }} €
                                    </td>
                                </tr>
                            @endforeach
                        </table>

                        <p style="margin:20px 0 0;font-size:16px;">
                            Totale: <strong>{{ number_format((float) $order->total_amount, 2, ',', '.') }} €</strong>
                            <span style="display:block;margin-top:4px;font-size:12px;color:#6b6560;font-weight:normal;">IVA inclusa · spedizione inclusa nel totale</span>
                        </p>

                        @if ($order->shipping_line1)
                            <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b6560;">
                                Spedizione a:<br>
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
