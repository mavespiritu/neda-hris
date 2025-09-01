<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class NotifySupervisorOfRtoSubmission extends Notification implements ShouldQueue
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
        $conn4 = DB::connection('mysql4');

        $rto = $conn2->table('flexi_rto')
            ->where('id', $this->payload['rto_id'])
            ->first();

        $outputs = $conn2->table('flexi_target')
            ->where('rto_id', $rto->id)
            ->get();

        $sender = $conn3->table('tblemployee')
        ->where('emp_id', $rto->emp_id)
        ->first();

        $token = (string) Str::uuid();

        $conn4->table('email_links')->insert([
            'token' => $token,
            'model' => 'RTO',
            'model_id' => $rto->id,
            'user_id' => $notifiable->id,
            'is_used' => false,
            'expires_at' => now()->addWeek(),
            'created_at' => now(),
        ]);

        $endorseUrl = URL::temporarySignedRoute(
            'rto.endorse.email',
            now()->addWeek(),
            ['token' => $token]
        );

        $rtoDate = Carbon::parse($rto->date)->format('F j, Y');

        $salutation = $sender->gender == 'Male' ? 'Mr.' : 'Ms.';
        $middleInitial = $sender->mname != '' ? strtoupper(substr($sender->mname, 0, 1)).'.' : '';
        $name = $middleInitial != '' ? $salutation.' '.$sender->fname.' '.$middleInitial.' '.$sender->lname : $salutation.' '.$sender->fname.' '.$sender->lname;

        $url = '/rto';

        try {
            return (new MailMessage)
                    ->subject('(DEPDev RO1 HRIS) Submission of RTO for flexiplace arrangement of '.$name.' on '.$rtoDate)
                    ->markdown('emails.rto-submission', [
                        'sender' => $sender,
                        'rto' => $rto,
                        'outputs' => $outputs,
                        'rtoDate' => $rtoDate,
                        'url' => url('/rto'),
                        'endorseUrl' => $endorseUrl
                    ]);

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
