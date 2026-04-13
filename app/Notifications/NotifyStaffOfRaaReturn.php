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
use App\Notifications\Concerns\BuildsRaaEmailPayload;

class NotifyStaffOfRaaReturn extends Notification implements ShouldQueue
{
    use Queueable, BuildsRaaEmailPayload;

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

        $raa = $conn2->table('flexi_raa')
            ->where('id', $this->payload['raa_id'])
            ->first();

        $rto = $conn2->table('flexi_rto')
            ->where('id', $raa->rto_id)
            ->first();

        $outputs = $this->buildRaaOutputs((int) $rto->id);

        $sender = $conn3->table('tblemployee')
        ->where('emp_id', $this->payload['returner_id'])
        ->first();

        $senderSalutation = $sender->gender == 'Male' ? 'Mr.' : 'Ms.';
        $senderName = $senderSalutation.' '.$this->formatEmployeeName($sender->fname, $sender->mname, $sender->lname);

        $rtoDate = Carbon::parse($rto->date)->format('F j, Y');

        try {
            $mail = (new MailMessage)
                    ->subject('(DEPDev RO1 HRIS) Your RAA for flexiplace arrangement on '.$rtoDate.' needs revision')
                    ->view('emails.raa-return', [
                        'senderName' => $senderName,
                        'rto' => $rto,
                        'outputs' => $outputs,
                        'rtoDate' => $rtoDate,
                        'remarks' => $this->payload['remarks'],
                        'url' => url('/raa'),
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

