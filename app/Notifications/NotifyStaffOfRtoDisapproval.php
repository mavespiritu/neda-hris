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

class NotifyStaffOfRtoDisapproval extends Notification implements ShouldQueue
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
        ->where('emp_id', $this->payload['disapprover_id'])
        ->first();

        $senderSalutation = $sender->gender == 'Male' ? 'Mr.' : 'Ms.';
        $senderMiddleInitial = $sender->mname != '' ? strtoupper(substr($sender->mname, 0, 1)).'.' : '';
        $senderName = $senderMiddleInitial != '' ? $senderSalutation.' '.$sender->fname.' '.$senderMiddleInitial.' '.$sender->lname : $senderSalutation.' '.$sender->fname.' '.$sender->lname;

        $rtoDate = Carbon::parse($rto->date)->format('F j, Y');

        $url = '/rto';

        try {
            $mail = (new MailMessage)
                    ->subject('(DEPDev RO1 HRIS) Your RTO for flexiplace arrangement on '.$rtoDate.' has been disapproved')
                    ->markdown('emails.rto-disapproval', [
                        'senderName' => $senderName,
                        'rto' => $rto,
                        'outputs' => $outputs,
                        'rtoDate' => $rtoDate,
                        'remarks' => $this->payload['remarks'],
                        'url' => url('/rto'),
                    ]);
                
            if (!empty($this->payload['supervisor_emails'])) {
                $mail->cc($this->payload['supervisor_emails']);
            }

            return $mail;

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
