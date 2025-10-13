@component('mail::message')
# Job Application

Greetings <b>{{ $applicantName }}</b>,

Your application for the position <b>{{ $position }}</b> with Plantilla Item No. <b>{{  $itemNo }}</b> was successfully submitted and received by the Human Resource Unit of Department of Economy, Planning, and Development Regional Office 1.


Your application is now under review. You will be notified via email for any updates regarding your application. 

You can also track your application status anytime under <b>My Applications</b> in your DEPDev RO1 HRIS account.

Best Regards,<br>
DEPDev RO1 Human Resource Unit
@endcomponent
