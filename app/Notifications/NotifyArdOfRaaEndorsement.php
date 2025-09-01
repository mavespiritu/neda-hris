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

class NotifyArdOfRaaEndorsement extends Notification implements ShouldQueue
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

        $raa = $conn2->table('flexi_raa')
            ->where('id', $this->payload['raa_id'])
            ->first();

        $rto = $conn2->table('flexi_rto')
            ->where('id', $raa->rto_id)
            ->first();

        $outputs = $conn2->table('flexi_target')
            ->where('rto_id', $rto->id)
            ->get();

        $outputIds = $outputs->pluck('id');

        $accomplishments = $conn2->table('flexi_accomplishment')
        ->whereIn('target_id', $outputIds)
        ->select('id', 'accomplishment', 'remarks', 'rto_id', 'raa_id', 'target_id')
        ->get();

        $accomplishmentsByTarget = $accomplishments->groupBy('target_id');

        foreach ($outputs as $output) {
            $accs = $accomplishmentsByTarget->get($output->id, collect());

            $output->accomplishments = $accs;
        }

        $sender = $conn3->table('tblemployee')
        ->where('emp_id', $this->payload['endorser_id'])
        ->first();

        $staff = $conn3->table('tblemployee')
        ->where('emp_id', $rto->emp_id)
        ->first();

        $senderSalutation = $sender->gender == 'Male' ? 'Mr.' : 'Ms.';
        $senderMiddleInitial = $sender->mname != '' ? strtoupper(substr($sender->mname, 0, 1)).'.' : '';
        $senderName = $senderMiddleInitial != '' ? $senderSalutation.' '.$sender->fname.' '.$senderMiddleInitial.' '.$sender->lname : $senderSalutation.' '.$sender->fname.' '.$sender->lname;

        $staffSalutation = $staff->gender == 'Male' ? 'Mr.' : 'Ms.';
        $staffMiddleInitial = $staff->mname != '' ? strtoupper(substr($staff->mname, 0, 1)).'.' : '';
        $staffName = $staffMiddleInitial != '' ? $staffSalutation.' '.$staff->fname.' '.$staffMiddleInitial.' '.$staff->lname : $staffSalutation.' '.$staff->fname.' '.$staff->lname;

        $rtoDate = Carbon::parse($rto->date)->format('F j, Y');

        $token = (string) Str::uuid();

        $conn4->table('email_links')->insert([
            'token' => $token,
            'model' => 'RAA',
            'model_id' => $raa->id,
            'user_id' => $notifiable->id,
            'is_used' => false,
            'expires_at' => now()->addMonth(),
            'created_at' => now(),
        ]);

        $approveUrl = URL::temporarySignedRoute(
            'raa.approve.email',
            now()->addMonth(),
            ['token' => $token]
        );

        $rtoDate = Carbon::parse($rto->date)->format('F j, Y');

        $url = '/raa';

        try {
            $mail = (new MailMessage)
                    ->subject('(DEPDev RO1 HRIS) Endorsement of RAA for flexiplace arrangement of '.$staffName.' on '.$rtoDate)
                    ->markdown('emails.raa-endorsement', [
                        'senderName' => $senderName,
                        'staffName' => $staffName,
                        'rto' => $rto,
                        'outputs' => $outputs,
                        'rtoDate' => $rtoDate,
                        'url' => url('/raa'),
                        'approveUrl' => $approveUrl
                    ]);
                
            if (!empty($this->payload['submitter_email'])) {
                $mail->cc($this->payload['submitter_email']);
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
