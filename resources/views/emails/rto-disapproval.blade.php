@component('mail::message')
# RTO Disapproval

You are receiving this email because {{ $senderName }} has disapproved your submitted RTO.

Below are the details of the RTO:

<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
    <tr>
        <td>Date of Flexiplace</td>
        <td>{{ $rtoDate }}</td>
    </tr>
    <tr>
        <td>Target Output</td>
        <td>
            <ol style="margin:0; padding-left: 20px;">
                @foreach($outputs as $output)
                    <li>{{ $output->output }}</li>
                @endforeach
            </ol>
        </td>
    </tr>
    <tr>
        <td>Remarks for disapproval</td>
        <td>{!! $remarks !!}</td>
    </tr>
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

Thanks,<br>
{{ config('app.name') }}
@endcomponent
