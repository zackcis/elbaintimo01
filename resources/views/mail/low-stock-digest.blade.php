<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="utf-8">
    <title>Alert scorte HARIMI</title>
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
                        <h1 style="margin:24px 0 8px;font-size:28px;font-weight:500;">Alert scorte</h1>
                        <p style="margin:0;font-size:14px;line-height:1.6;color:#6b6560;">
                            Soglia: <strong>≤ {{ $threshold }}</strong> —
                            <strong>{{ $outCount }}</strong> esaurite,
                            <strong>{{ $lowCount }}</strong> basse.
                        </p>

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;border-collapse:collapse;">
                            <thead>
                                <tr>
                                    <th align="left" style="padding:8px 0;border-bottom:1px solid #e0d9ce;font-size:12px;color:#6b6560;font-weight:normal;">Prodotto</th>
                                    <th align="left" style="padding:8px 0;border-bottom:1px solid #e0d9ce;font-size:12px;color:#6b6560;font-weight:normal;">Variante</th>
                                    <th align="right" style="padding:8px 0;border-bottom:1px solid #e0d9ce;font-size:12px;color:#6b6560;font-weight:normal;">Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($rows as $row)
                                    <tr>
                                        <td style="padding:10px 0;border-bottom:1px solid #f0ebe3;font-size:13px;vertical-align:top;">
                                            <strong>{{ $row['product_title'] }}</strong>
                                            @if (!empty($row['brand_name']))
                                                <br><span style="color:#6b6560;font-size:12px;">{{ $row['brand_name'] }}</span>
                                            @endif
                                        </td>
                                        <td style="padding:10px 0;border-bottom:1px solid #f0ebe3;font-size:13px;vertical-align:top;color:#6b6560;">
                                            {{ $row['size'] ?? '—' }}
                                            @if (!empty($row['color']))
                                                · {{ $row['color'] }}
                                            @endif
                                        </td>
                                        <td align="right" style="padding:10px 0;border-bottom:1px solid #f0ebe3;font-size:14px;vertical-align:top;font-weight:600;color:{{ $row['is_out_of_stock'] ? '#b42318' : '#b54708' }};">
                                            {{ $row['stock'] }}
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>

                        <p style="margin:28px 0 0;font-size:14px;">
                            <a href="{{ $adminUrl }}" style="color:#141414;text-decoration:underline;">Apri scorte in back-office</a>
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
