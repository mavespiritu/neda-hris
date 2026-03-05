<?php

namespace App\Notifications\TravelOrders;

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

class NotifyApproverOfToEndorsement extends Notification implements ShouldQueue
{
    use Queueable;

    private $payload;

    private function formatTravelDateRange($start, $end): string
    {
        if (!$start || !$end) return '';

        $s = Carbon::parse($start);
        $e = Carbon::parse($end);

        // Same exact day: January 2, 2026
        if ($s->isSameDay($e)) {
            return $s->format('F j, Y');
        }

        // Different years: January 2, 2025 - March 6, 2026
        if ($s->year !== $e->year) {
            return $s->format('F j, Y') . ' - ' . $e->format('F j, Y');
        }

        // Same year, different months: January 2 - March 4, 2026
        if ($s->month !== $e->month) {
            return $s->format('F j') . ' - ' . $e->format('F j, Y');
        }

        // Same month, same year: January 2 - 3, 2025
        return $s->format('F j') . ' - ' . $e->format('j, Y');
    }

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

        $travelOrderId = $this->payload['travel_order_id'] ?? null;

        if (!$travelOrderId) {
            throw new \InvalidArgumentException('Missing payload travel_order_id');
        }

        $travelOrder = $conn2->table('travel_order')
        ->select([
            'travel_order.id as id',
            'reference_no',
            'travel_category_id',
            'start_date',
            'end_date',
            'purpose',
            'fund_source_id',
            'other_passengers',
            'other_vehicles',
            'other_drivers',
            'isRequestingVehicle',
            'created_by',
            'date_created',
            'travel_order_categories.title as category_title',
            'travel_order_fund_sources.title as fund_source_title',
            'approver_id',
        ])
        ->leftJoin('travel_order_categories', 'travel_order.travel_category_id', '=', 'travel_order_categories.id')
        ->leftJoin('travel_order_fund_sources', 'travel_order.fund_source_id', '=', 'travel_order_fund_sources.id')
        ->where('travel_order.id', $travelOrderId)
        ->first();


        $destinations = $conn2->table('travel_order_destinations')
            ->where('travel_order_id', $travelOrderId)
            ->get();

        $staffRows = $conn2->table('travel_order_staffs')
            ->select(['id', 'emp_id', 'recommender_id', 'approver_id'])
            ->where('travel_order_id', $travelOrderId)
            ->get();

        $empIds = collect($staffRows)
        ->flatMap(function ($s) {
            return [
                $s->emp_id,
                $s->recommender_id,
                $s->approver_id,
            ];
        })
        ->push($travelOrder->created_by)
        ->filter(fn ($v) => $v !== null && $v !== '')
        ->unique()
        ->values();

        $employeesById = $conn3->table('tblemployee')
        ->select([
            'emp_id',
            DB::raw("
                CONCAT(
                    fname,
                    ' ',
                    IF(mname IS NOT NULL AND mname != '',
                        CONCAT(LEFT(mname,1), '. '),
                        ''
                    ),
                    lname
                ) as name
            "),
            'division_id',
        ])
        ->whereIn('emp_id', $empIds)
        ->get()
        ->keyBy('emp_id');

        $empName = function ($id) use ($employeesById) {
            if (!$id) return null;
            $row = $employeesById->get($id);
            return $row?->name ? trim($row->name) : null;
        };

        $creatorName = $travelOrder->created_by
        ? trim(optional($employeesById->get($travelOrder->created_by))->name)
        : null;

        $staffs = $staffRows
        ->map(function ($s) use ($empName) {
            return [
                'id' => (int) $s->id,

                'emp_id' => (string) $s->emp_id,
                'name' => $empName($s->emp_id),

                'recommender_id' => $s->recommender_id ? (string) $s->recommender_id : null,
                'recommender_name' => $empName($s->recommender_id),

                'approver_id' => $s->approver_id ? (string) $s->approver_id : null,
                'approver_name' => $empName($s->approver_id),
            ];
        })
        ->values();

        $travelDates = $this->formatTravelDateRange($travelOrder->start_date, $travelOrder->end_date);

        $order = [
            'id' => (int) $travelOrder->id,
            'reference_no' => $travelOrder->reference_no,
            'category_title' => $travelOrder->category_title,
            'fund_source_title' => $travelOrder->fund_source_title,
            'dates' => $travelDates,
            'purpose' => $travelOrder->purpose,
            'creator' => $creatorName,
            'other_passengers' => $travelOrder->other_passengers,
            'other_vehicles' => $travelOrder->other_vehicles,
            'other_drivers' => $travelOrder->other_drivers,
            'isRequestingVehicle' => (bool) $travelOrder->isRequestingVehicle,
            'date_created' => Carbon::parse($travelOrder->date_created)->format('F j, Y'),
            'staffs' => $staffs,
            'destinations' => $destinations,
        ];

        $token = (string) Str::uuid();

        $conn4->table('email_links')->insert([
            'token' => $token,
            'model' => 'TO',
            'model_id' => $travelOrder->id,
            'user_id' => $notifiable->id,
            'is_used' => false,
            'expires_at' => now()->addMonth(),
            'created_at' => now(),
        ]);

        $approveeUrl = URL::temporarySignedRoute(
            'travel-orders.approve.email',
            now()->addMonth(),
            ['token' => $token]
        );

        $url = '/travel-orders';

        try {
            $mail = (new MailMessage)
                    ->subject('(DEPDev RO1 HRIS) Approval of Travel Order No.'.$travelOrder->reference_no)
                    ->markdown('emails.travel-orders.endorse', [
                        'order' => $order,
                        'url' => url('/travel-orders'),
                        'endorseUrl' => $approveeUrl
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
