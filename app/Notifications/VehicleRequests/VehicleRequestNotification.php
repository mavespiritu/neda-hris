<?php

namespace App\Notifications\VehicleRequests;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VehicleRequestNotification extends Notification implements ShouldQueue
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
        $subject = $this->payload['subject'] ?? 'Vehicle Request Update';
        $view    = $this->payload['view'] ?? 'emails.vehicle-requests.updated';

        return (new MailMessage)
            ->subject($subject)
            ->view($view, $this->payload);
    }
}