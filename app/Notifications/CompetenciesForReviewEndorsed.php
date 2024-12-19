<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CompetenciesForReviewEndorsed extends Notification
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
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $competency = $conn2->table('staff_competency_review')
                ->where('id', $this->payload['competency_id'])
                ->first();

        $sender = $conn3->table('tblemployee')
        ->where('emp_id', $this->payload['endorser_id'])
        ->first();

        $salutation = $sender->gender == 'Male' ? 'Mr.' : 'Ms.';
        $middleInitial = $sender->mname != '' ? strtoupper(substr($sender->mname, 0, 1)).'.' : '';
        $name = $middleInitial != '' ? $salutation.' '.$sender->fname.' '.$middleInitial.' '.$sender->lname : $salutation.' '.$sender->fname.' '.$sender->lname;

        $dateCreated = Carbon::parse($competency->date_created);
        $dateCreated = $dateCreated->format('F j, Y g:i A');

        $dateEndorsed = Carbon::parse($competency->date_endorsed);
        $dateEndorsed = $dateEndorsed->format('F j, Y g:i A');

        $url = '/my-cga';

        try {
            return (new MailMessage)
                    ->subject('Your CGA submitted on '.$dateCreated.' has been endorsed to your DC!')
                    ->line('You are receiving this email because '.$name.' already endorsed your CGA on '.$dateEndorsed.' to your DC')
                    ->line(Lang::get('Thank you for using our application'))
                    ->action(Lang::get('Check it now'), url($url));

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
