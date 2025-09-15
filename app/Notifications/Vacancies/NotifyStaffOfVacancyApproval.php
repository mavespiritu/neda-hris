<?php

namespace App\Notifications\Vacancies;

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

class NotifyStaffOfVacancyApproval extends Notification implements ShouldQueue
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

        $vacancy = $conn2->table('vacancy')
            ->where('id', $this->payload['vacancy_id'])
            ->first();

        $sender = $conn3->table('tblemployee')
        ->where('emp_id', $this->payload['approver_id'])
        ->first();

        $senderSalutation = $sender->gender == 'Male' ? 'Mr.' : 'Ms.';
        $senderMiddleInitial = $sender->mname != '' ? strtoupper(substr($sender->mname, 0, 1)).'.' : '';
        $senderName = $senderMiddleInitial != '' ? $senderSalutation.' '.$sender->fname.' '.$senderMiddleInitial.' '.$sender->lname : $senderSalutation.' '.$sender->fname.' '.$sender->lname;

        $url = url('/vacancies');

        $position = $vacancy->appointment_status === 'Permanent' ? $vacancy->position_description.' ('.$vacancy->item_no.')' : $vacancy->position_description.' ('.$vacancy->appointment_status.')';

        $competencies = $conn2->table('vacancy_competencies as vc')
            ->leftJoin('competency as c', 'vc.competency_id', '=', 'c.comp_id')
            ->where('vc.vacancy_id', $vacancy->id)
            ->select(
                'c.comp_id as value',
                DB::raw('CONCAT(c.competency, " (Level ", vc.level, ")") as label'),
                'c.competency',
                'vc.level',
                'c.comp_type'
            )
            ->get()
            ->groupBy(function ($item) {
                return match ($item->comp_type) {
                    'org'  => 'Organizational',
                    'mnt'  => 'Leadership/Managerial',
                    'func' => 'Technical/Functional',
                    default => ucfirst($item->comp_type),
                };
            });

        $classifications = [
            "Executive",
            "Middle Management",
            "Professional & Supervisory & Technical",
            "Clerical & General Staff",
        ];

        try {
            $mail = (new MailMessage)
                    ->subject('(DEPDev RO1 HRIS) Your submitted CBJD for '.$position.' vacant position has been approved')
                    ->markdown('emails.vacancies.approve', [
                        'senderName' => $senderName,
                        'position' => $position,
                        'vacancy' => $vacancy,
                        'competencies' => $competencies,
                        'classifications' => $classifications,
                        'url' => $url,
                    ]);
                
            if (!empty($this->payload['supervisor_emails'])) {
                $mail->cc($this->payload['supervisor_emails']);
            }

            if (!empty($this->payload['hr_emails'])) {
                $mail->cc($this->payload['hr_emails']);
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
