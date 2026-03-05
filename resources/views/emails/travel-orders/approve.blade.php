@component('mail::message')
# Travel Order Approval

You are receiving this email because this travel order requires your approval. By clicking the Approve button below, you are approving this travel order and affixing your e-signature.

Below are the details of the travel order:

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
        <td>Authorized Personnel</td>
        <td>
            <ol style="margin:0; padding-left: 20px;">
                @foreach($order['staffs'] as $staff)
                    <li>{{ $staff['name'] }}</li>
                @endforeach
            </ol>
        </td>
    </tr>
    <tr>
        <td>Destination/s</td>
        <td>
            <ol style="margin:0; padding-left: 20px;">
                @foreach($order['destinations'] as $destination)
                    <li>{{ $destination->type === 'Local' ? $destination->location.', '.$destination->citymunName.', '.$destination->provinceName : $destination->location.', '.$destination->country }}</li>
                @endforeach
            </ol>
        </td>
    </tr>
</table>

<br>

To decline, you need to visit the travel order using the HRIS by clicking the Open in HRIS button below.

<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
        <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                    <td>
                        <a href="{{ $approveUrl }}" 
                           style="display:inline-block; background-color:#38b2ac; border-radius:4px; color:#ffffff; font-size:14px; font-weight:bold; line-height:40px; text-align:center; text-decoration:none; width:160px; margin-right:10px;">
                            Approve
                        </a>
                    </td>
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
