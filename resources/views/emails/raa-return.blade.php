<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RAA Needs Revision</title>
</head>
<body style="margin: 0; padding: 24px; font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
    <h2 style="margin-top: 0;">RAA Needs Revision</h2>

    <p>You are receiving this email because {{ $senderName }} has returned your submitted RAA for revision.</p>

    <p>Below are the details of the RAA:</p>

    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <tr>
            <td>Date of Flexiplace</td>
            <td>{{ $rtoDate }}</td>
        </tr>
        <tr>
            <td>Remarks for returning</td>
            <td>{!! $remarks !!}</td>
        </tr>
    </table>

    <br>

    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <tbody>
            <tr>
                <td colspan="2" style="text-align: center; font-weight: bolder;">Target per RTO</td>
                <td style="text-align: center; font-weight: bolder;">Actual Accomplishment with MOV (As attachment or link to actual output)</td>
                <td style="text-align: center; font-weight: bolder;">Remark/Justification</td>
            </tr>
            @foreach($outputs as $i => $output)
                @foreach($output->accomplishments as $j => $accomplishment)
                    <tr>
                        @if($j === 0)
                            <td rowspan="{{ count($output->accomplishments) }}" style="width: 5%; text-align:center;">{{ $i + 1 }}.</td>
                            <td rowspan="{{ count($output->accomplishments) }}">{{ $output->output ?? '' }}</td>
                        @endif
                        <td>
                            {!! $accomplishment->accomplishment ?? '' !!}
                            @include('emails.partials.raa-movs', ['accomplishment' => $accomplishment])
                        </td>
                        <td>{!! $accomplishment->remarks ?? '' !!}</td>
                    </tr>
                @endforeach
            @endforeach
        </tbody>
    </table>

    <br>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                        <td>
                            <a href="{{ $url }}"
                               style="display:inline-block; background-color:#4a90e2; border-radius:4px; color:#ffffff; font-size:14px; font-weight:bold; line-height:40px; text-align:center; text-decoration:none; width:160px;">
                                Open in HRIS
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <p style="margin-top: 24px;">
        Thanks,<br>
        {{ config('app.name') }}
    </p>
</body>
</html>
