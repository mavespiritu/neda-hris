<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CompetenciesForReviewEndorsedToDc extends Notification
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

        $staff = $conn3->table('tblemployee')
        ->where('emp_id', $competency->emp_id)
        ->first();

        $senderSalutation = $sender->gender == 'Male' ? 'Mr.' : 'Ms.';
        $senderMiddleInitial = $sender->mname != '' ? strtoupper(substr($sender->mname, 0, 1)).'.' : '';
        $senderName = $senderMiddleInitial != '' ? $senderSalutation.' '.$sender->fname.' '.$senderMiddleInitial.' '.$sender->lname : $senderSalutation.' '.$sender->fname.' '.$sender->lname;

        $staffSalutation = $staff->gender == 'Male' ? 'Mr.' : 'Ms.';
        $staffMiddleInitial = $staff->mname != '' ? strtoupper(substr($staff->mname, 0, 1)).'.' : '';
        $staffName = $staffMiddleInitial != '' ? $staffSalutation.' '.$staff->fname.' '.$staffMiddleInitial.' '.$staff->lname : $staffSalutation.' '.$staff->fname.' '.$staff->lname;

        $dateCreated = Carbon::parse($competency->date_created);
        $dateCreated = $dateCreated->format('F j, Y g:i A');

        $dateEndorsed = Carbon::parse($competency->date_endorsed);
        $dateEndorsed = $dateEndorsed->format('F j, Y g:i A');

        $url = '/review-cga';

        try {
            return (new MailMessage)
                    ->subject('The CGA submitted by '.$staffName.' on '.$dateCreated.' has been endorsed to you by '.$senderName)
                    ->line('You are receiving this email because '.$senderName.' already endorsed the CGA submitted by '.$staffName.' (dated '.$dateCreated.') on '.$dateEndorsed)
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
