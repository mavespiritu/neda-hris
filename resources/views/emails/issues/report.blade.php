@component('mail::message')
# New Issue Reported

A new issue has been submitted through the system.

@component('mail::panel')
**Name:** {{ $name ?: 'N/A' }}  
**Email:** {{ $email ?: 'N/A' }}  
**Message:**  
{{ $message }}  
**Date Received:** {{ \Carbon\Carbon::createFromTimestamp($created_at)->format('F j, Y H:i:s') }}
@endcomponent

Please review this issue and take the necessary action.

Best regards,  
DEPDev RO1 HRIS
@endcomponent