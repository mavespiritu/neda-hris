<?php

namespace App\Notifications\VehicleRequests;

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
use App\Support\DateRange;

class NotifyEndorserOfVehicleRequest extends Notification implements ShouldQueue
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

        $vehicleRequestId = $this->payload['vehicle_request_id'] ?? null;

        if (!$vehicleRequestId) {
            throw new \InvalidArgumentException('Missing payload vehicle_request_id');
        }

        $vehicleRequest = $conn2->table('travel_order')
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
        ->where('travel_order.id', $vehicleRequestId)
        ->first();


        $destinations = $conn2->table('travel_order_destinations')
            ->where('travel_order_id', $vehicleRequestId)
            ->get();

        $commutation_expenses = $conn2->table('travel_order_expenses')
            ->where('travel_order_id', $vehicleRequestId)
            ->get();

        $staffRows = $conn2->table('travel_order_staffs')
            ->select(['id', 'emp_id', 'recommender_id', 'approver_id'])
            ->where('travel_order_id', $vehicleRequestId)
            ->get();

        $empIds = collect($staffRows)
        ->flatMap(function ($s) {
            return [
                $s->emp_id,
                $s->recommender_id,
                $s->approver_id,
            ];
        })
        ->push($vehicleRequest->created_by)
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

        $creatorName = $vehicleRequest->created_by
        ? trim(optional($employeesById->get($vehicleRequest->created_by))->name)
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

        $order = [
            'id' => (int) $vehicleRequest->id,
            'reference_no' => $vehicleRequest->reference_no,
            'category_title' => $vehicleRequest->category_title,
            'fund_source_title' => $vehicleRequest->fund_source_title,
            'dates' => DateRange::display($vehicleRequest->start_date, $vehicleRequest->end_date),
            'purpose' => $vehicleRequest->purpose,
            'creator' => $creatorName,
            'other_passengers' => $vehicleRequest->other_passengers,
            'other_vehicles' => $vehicleRequest->other_vehicles,
            'other_drivers' => $vehicleRequest->other_drivers,
            'isRequestingVehicle' => (bool) $vehicleRequest->isRequestingVehicle,
            'date_created' => Carbon::parse($vehicleRequest->date_created)->format('F j, Y'),
            'staffs' => $staffs,
            'destinations' => $destinations,
        ];

        $token = (string) Str::uuid();

        $conn4->table('email_links')->insert([
            'token' => $token,
            'model' => 'Vehicle Request',
            'model_id' => $vehicleRequest->id,
            'user_id' => $notifiable->id,
            'is_used' => false,
            'expires_at' => now()->addMonth(),
            'created_at' => now(),
        ]);

        $endorseUrl = URL::temporarySignedRoute(
            'vehicle-requests.endorse.email',
            now()->addMonth(),
            ['token' => $token]
        );

        $url = $vehicleRequest->request_type === 'TO' ? url('/travel-requests/'.$vehicleRequest->id.'#vehicle-request') : url('/vehicle-requests/'.$vehicleRequest->id.'#vehicle-request');

        try {
            $mail = (new MailMessage)
                    ->subject('(DEPDev RO1 HRIS) Endorsement of Vehicle Request No. '.$vehicleRequest->reference_no)
                    ->markdown('emails.vehicle-requests.endorse', [
                        'order' => $order,
                        'endorseUrl' => $endorseUrl,
                        'url' => $url,
                    ]);

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
