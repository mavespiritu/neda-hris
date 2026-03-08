<?php

namespace App\Notifications\TravelRequests;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TravelRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private array $payload
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $subject = $this->payload['subject'] ?? 'Travel Request Update';
        $view    = $this->payload['view'] ?? 'emails.travel-requests.updated';

        return (new MailMessage)
            ->subject($subject)
            ->view($view, $this->payload);
    }
}