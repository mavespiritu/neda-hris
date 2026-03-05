@component('mail::message')
# Vehicle Request Return

You are receiving this email because your vehicle request was returned.

Below are the details of the vehicle request:

<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
    <tr>
        <td>Reference No.</td>
        <td>{{ $order['reference_no'] }}</td>
    </tr>
    <tr>
        <td>Date of Travel</td>
        <td>{{ $order['dates'] }}</td>
    </tr>
    <tr>
        <td>Purpose</td>
        <td>({{ $order['category_title'] }}) {{ $order['purpose'] }}</td>
    </tr>
    <tr>
        <td>Authorized Passengers</td>
        <td>
            <ol style="margin:0; padding-left: 20px;">
                @foreach($order['staffs'] as $staff)
                    <li>{{ $staff['name'] }}</li>
                @endforeach
            </ol>
        </td>
    </tr>
    <tr>
        <td>Destinations</td>
        <td>
            <ol style="margin:0; padding-left: 20px;">
                @foreach($order['destinations'] as $destination)
                    <li>{{ $destination->type === 'Local' ? $destination->location.', '.$destination->citymunName.', '.$destination->provinceName : $destination->location.', '.$destination->country }}</li>
                @endforeach
            </ol>
        </td>
    </tr>
    <tr>
        <td>Remarks for Returning</td>
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
