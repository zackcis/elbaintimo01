<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="utf-8">
    <title>Rimborso {{ $order->reference }}</title>
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
                        <h1 style="margin:24px 0 8px;font-size:28px;font-weight:500;">Rimborso confermato</h1>
                        <p style="margin:0;font-size:14px;line-height:1.6;color:#6b6560;">
                            Abbiamo elaborato il rimborso per l’ordine <strong>{{ $order->reference }}</strong>.
                            L’importo verrà riaccreditato sul metodo di pagamento utilizzato, di solito entro alcuni giorni lavorativi.
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
                            Importo rimborsato: <strong>{{ number_format((float) $order->total_amount, 2, ',', '.') }} €</strong>
                        </p>

                        <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b6560;">
                            Per qualsiasi domanda, rispondi a questa email citando il riferimento ordine.
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
