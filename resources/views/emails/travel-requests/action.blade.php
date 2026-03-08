<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Travel Request Update</title>
</head>
<body style="margin:0;padding:20px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111827;">
@php
    $required = $required_action ?? 'view';

    $title = match($required) {
        'resubmit'        => 'Travel Request Returned',
        default           => 'Travel Request Update',
    };

    $primaryText = match($required) {
        'resubmit'        => 'This request was returned and needs your corrections/resubmission.',
        default           => 'A travel request has been updated.',
    };

    $primaryButtonLabel = match($required) {
        default     => null,
    };
@endphp

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:700px;margin:0 auto;">
    <tr>
        <td style="padding:0;">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;">{{ $title }}</h1>
            <p style="margin:0 0 16px;line-height:1.6;">{{ $primaryText }}</p>

            @if(!empty($order))
                <p style="margin:0 0 16px;line-height:1.6;">Details of Travel Request:</p>
                @if(!empty($remarks))
                    <div style="margin:0 0 16px;padding:12px;border:1px solid #e5e7eb;border-left:4px solid #f59e0b;background:#fffbeb;">
                        <p style="margin:0 0 6px;font-weight:700;">Remarks</p>
                        <div style="line-height:1.6;">
                            {!! $remarks !!}
                        </div>
                    </div>
                @endif
                <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
                    <tr>
                        <td style="border:1px solid #e5e7eb;width:35%;"><strong>Reference No.</strong></td>
                        <td style="border:1px solid #e5e7eb;">{{ $order['reference_no'] ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #e5e7eb;"><strong>Date of Travel</strong></td>
                        <td style="border:1px solid #e5e7eb;">{{ $order['dates'] ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #e5e7eb;"><strong>Purpose</strong></td>
                        <td style="border:1px solid #e5e7eb;">({{ $order['category_title'] ?? '-' }}) {{ $order['purpose'] ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #e5e7eb;"><strong>Acted By</strong></td>
                        <td style="border:1px solid #e5e7eb;">{{ $acted_by_name ?? $acted_by ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #e5e7eb;vertical-align:top;"><strong>Authorized Passengers</strong></td>
                        <td style="border:1px solid #e5e7eb;">
                            <ol style="margin:0;padding-left:18px;">
                                @forelse(($order['staffs'] ?? []) as $staff)
                                    <li>{{ $staff['name'] ?? '-' }}</li>
                                @empty
                                    <li>-</li>
                                @endforelse
                            </ol>
                        </td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #e5e7eb;vertical-align:top;"><strong>Destinations</strong></td>
                        <td style="border:1px solid #e5e7eb;">
                            <ol style="margin:0;padding-left:18px;">
                                @forelse(($order['destinations'] ?? []) as $destination)
                                    <li>
                                        @if(($destination->type ?? null) === 'Local')
                                            {{ $destination->location ?? '' }}, {{ $destination->citymunName ?? '' }}, {{ $destination->provinceName ?? '' }}
                                        @else
                                            {{ $destination->location ?? '' }}, {{ $destination->country ?? '' }}
                                        @endif
                                    </li>
                                @empty
                                    <li>-</li>
                                @endforelse
                            </ol>
                        </td>
                    </tr>
                </table>
            @else
                <p style="margin:0 0 16px;">Travel request details are not available right now. Please open in HRIS to view it.</p>
            @endif

            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 8px;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                                @if(!empty($actionUrl) && !empty($primaryButtonLabel))
                                    <td>
                                        <a href="{{ $actionUrl }}"
                                        style="display:inline-block; background-color:#38b2ac; border-radius:4px; color:#ffffff; font-size:14px; font-weight:bold; line-height:40px; text-align:center; text-decoration:none; width:160px; margin-right:10px;">
                                            {{ $primaryButtonLabel }}
                                        </a>
                                    </td>
                                @endif

                                @if(!empty($url))
                                    <td>
                                        <a href="{{ $url }}"
                                        style="display:inline-block; background-color:#4a90e2; border-radius:4px; color:#ffffff; font-size:14px; font-weight:bold; line-height:40px; text-align:center; text-decoration:none; width:160px;">
                                            Open in HRIS
                                        </a>
                                    </td>
                                @endif
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <p style="margin:20px 0 0;color:#6b7280;">Thanks,<br>{{ config('app.name') }}</p>
        </td>
    </tr>
</table>
</body>
</html>
