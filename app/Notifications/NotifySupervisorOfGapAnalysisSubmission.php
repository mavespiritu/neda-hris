<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotifySupervisorOfGapAnalysisSubmission extends Notification implements ShouldQueue
{
    use Queueable;

    private $payload;

    /**
     * Create a new notification instance.
     */
    public function __construct($payload)
    {
        $this->payload = $payload;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $conn3 = DB::connection('mysql3');

        $sender = $conn3->table('tblemployee')
        ->where('emp_id', $this->payload['emp_id'])
        ->first();

        $salutation = $sender->gender == 'Male' ? 'Mr.' : 'Ms.';
        $middleInitial = $sender->mname != '' ? strtoupper(substr($sender->mname, 0, 1)).'.' : '';
        $name = $middleInitial != '' ? $salutation.' '.$sender->fname.' '.$middleInitial.' '.$sender->lname : $salutation.' '.$sender->fname.' '.$sender->lname;

        $url = '/cga/review';

        try {
            return (new MailMessage)
                    ->subject('(DEPDev RO1 HRIS) Submission of Competency Gap Analysis (CGA) of '.$name)
                    ->line('You are receiving this email because '.$name.' is requesting you to review '.($salutation === 'Mr.' ? 'his' : 'her').' submitted CGA.')
                    ->line(Lang::get('Please click the button below to review the submission.'))
                    ->action(Lang::get('Review Submission'), url($url));

        } catch (\Exception $e) {
            Log::error('Error sending email: ' . $e->getMessage());
        }
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
