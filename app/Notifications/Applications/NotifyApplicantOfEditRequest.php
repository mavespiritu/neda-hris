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

        $mail = (new MailMessage)
            ->subject('(DEPDev RO1 HRIS) Your application was reopened for editing')
            ->greeting("Hello {$applicantName},")
            ->line("Your submitted application for {$position} has been reopened for editing.");

        if ($remarks) {
            $mail->line('Remarks / Instructions:')
                ->line(strip_tags($remarks));
        }

        if ($expiresAt) {
            $mail->line("You may update your application until {$expiresAt}.");
        }

        return $mail->line('Please review your submission and update it within the allowed period.');
    }
}
