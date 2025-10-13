@component('mail::message')
# Job Application

Greetings <b>HR Unit</b>,

Please be informed that applicant <b>{{ $applicantName }}</b> has submitted an application to the position <b>{{ $position }}</b> with Plantilla Item No. <b>{{  $itemNo }}</b>.

Click the button below to view details.

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