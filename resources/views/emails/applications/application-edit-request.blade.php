@component('mail::message')
# Your application was reopened for editing

Hello <b>{{ $applicantName }}</b>,

Your submitted application for <b>{{ $position }}</b> has been reopened for editing.

@if(!empty($remarks))
Remarks / Instructions:

<div style="margin: 12px 0 16px; padding: 12px; border: 1px solid #e5e7eb; border-left: 4px solid #f59e0b; background: #fffbeb; line-height: 1.6;">
{!! $remarks !!}
</div>
@endif

@if(!empty($expiresAt))
You may update your application until <b>{{ $expiresAt }}</b>.

@endif
Please review your submission and update it within the allowed period.

Regards,<br>
DEPDev RO1 HRIS
@endcomponent
