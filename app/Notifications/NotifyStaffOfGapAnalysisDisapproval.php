<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class NotifyStaffOfGapAnalysisDisapproval extends Notification implements ShouldQueue
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
        ->where('emp_id', $this->payload['disapprover_id'])
        ->first();

        $salutation = $sender->gender == 'Male' ? 'Mr.' : 'Ms.';
        $middleInitial = $sender->mname != '' ? strtoupper(substr($sender->mname, 0, 1)).'.' : '';
        $name = $middleInitial != '' ? $salutation.' '.$sender->fname.' '.$middleInitial.' '.$sender->lname : $salutation.' '.$sender->fname.' '.$sender->lname;

        $dateCreated = Carbon::parse($competency->date_created);
        $dateCreated = $dateCreated->format('F j, Y g:i A');

        $dateApproved = Carbon::parse($competency->date_acted);
        $dateApproved = $dateApproved->format('F j, Y g:i A');

        $url = '/cga';

        try {
            return (new MailMessage)
                    ->subject('(DEPDev RO1 HRIS) Your Competency Gap Analysis (CGA) Submission dated '.$dateCreated.' has been disapproved')
                    ->line('You are receiving this email because '.$name.' has disapproved your CGA on '.$dateApproved)
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
