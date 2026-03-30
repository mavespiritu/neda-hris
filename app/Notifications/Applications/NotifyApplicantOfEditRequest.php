<?php

namespace App\Notifications\Applications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NotifyApplicantOfEditRequest extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(protected array $payload)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $applicantName = $this->payload['applicant_name'] ?? 'Applicant';
        $position = $this->payload['position'] ?? 'your application';
        $remarks = $this->payload['remarks'] ?? '';
        $expiresAt = $this->payload['expires_at'] ?? null;

        return (new MailMessage)
            ->subject('(DEPDev RO1 HRIS) Your application was reopened for editing')
            ->markdown('emails.applications.application-edit-request', [
                'applicantName' => $applicantName,
                'position' => $position,
                'remarks' => $remarks,
                'expiresAt' => $expiresAt,
            ]);
    }
}
