<?php

namespace App\Services\TravelRequests;

use App\Support\DateRange;
use App\Traits\BuildsEmployeeNameMap;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class TravelRequestMailPayloadBuilder
{
    use BuildsEmployeeNameMap;

    public function build(
        int $travelRequestId,
        string $action,
        string $requiredAction,
        object $notifiable,
        array $meta = []
    ): array {
        $conn2 = DB::connection('mysql2');
        $conn4 = DB::connection('mysql4');

        $travelRequest = $conn2->table('travel_order')
            ->select([
                'travel_order.id as id',
                'reference_no',
                'request_type',
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
                'division',
                'travel_order_categories.title as category_title',
                'travel_order_fund_sources.title as fund_source_title',
                'approver_id',
                'created_by'
                
            ])
            ->leftJoin('travel_order_categories', 'travel_order.travel_category_id', '=', 'travel_order_categories.id')
            ->leftJoin('travel_order_fund_sources', 'travel_order.fund_source_id', '=', 'travel_order_fund_sources.id')
            ->where('travel_order.id', $travelRequestId)
            ->first();

        if (! $travelRequest) {
            return [
                'subject' => 'Travel Request Update',
                'view' => 'emails.travel-requests.action',
                'action' => $action,
                'required_action' => $requiredAction,
                'remarks' => $meta['remarks'] ?? null,
                'order' => null,
                'url' => null,
                'actionUrl' => null,
                'from_state' => $meta['from_state'] ?? null,
                'to_state' => $meta['to_state'] ?? null,
                'acted_by' => $meta['acted_by'] ?? null,
                'acted_by_name' => null,
                'return_to_state' => $meta['return_to_state'] ?? null,
                'return_to_user' => $meta['return_to_user'] ?? null,
                'review' => null,
            ];
        }

        $destinations = $conn2->table('travel_order_destinations')
            ->where('travel_order_id', $travelRequestId)
            ->get();

        $staffRows = $conn2->table('travel_order_staffs')
            ->select(['id', 'emp_id', 'recommender_id', 'approver_id'])
            ->where('travel_order_id', $travelRequestId)
            ->get();

        $empIds = collect($staffRows)
            ->flatMap(fn ($s) => [$s->emp_id, $s->recommender_id, $s->approver_id])
            ->push($travelRequest->created_by)
            ->push($meta['acted_by'] ?? null)
            ->push($notifiable->ipms_id ?? null)
            ->values();

        $employeesById = $this->employeeNamesById($empIds, 'mysql3');

        $creatorName = $this->employeeName($employeesById, $travelRequest->created_by);

        $staffs = $staffRows->map(function ($s) use ($employeesById) {
            return [
                'id' => (int) $s->id,
                'emp_id' => (string) $s->emp_id,
                'name' => $this->employeeName($employeesById, $s->emp_id),
                'recommender_id' => $s->recommender_id ? (string) $s->recommender_id : null,
                'recommender_name' => $this->employeeName($employeesById, $s->recommender_id),
                'approver_id' => $s->approver_id ? (string) $s->approver_id : null,
                'approver_name' => $this->employeeName($employeesById, $s->approver_id),
            ];
        })->values();

        $order = [
            'id' => (int) $travelRequest->id,
            'reference_no' => $travelRequest->reference_no,
            'category_title' => $travelRequest->category_title,
            'fund_source_title' => $travelRequest->fund_source_title,
            'dates' => DateRange::display($travelRequest->start_date, $travelRequest->end_date),
            'purpose' => $travelRequest->purpose,
            'creator' => $creatorName,
            'other_passengers' => $travelRequest->other_passengers,
            'other_vehicles' => $travelRequest->other_vehicles,
            'other_drivers' => $travelRequest->other_drivers,
            'isRequestingVehicle' => (bool) $travelRequest->isRequestingVehicle,
            'date_created' => Carbon::parse($travelRequest->date_created)->format('F j, Y'),
            'staffs' => $staffs,
            'destinations' => $destinations,
        ];

        $hash = '#trip-information';

            $url = url('/travel-requests/' . $travelRequest->id . $hash);
    
        $actionUrl = $this->buildSignedActionUrl(
            conn4: $conn4,
            notifiable: $notifiable,
            travelRequestId: (int) $travelRequest->id,
            requiredAction: $requiredAction
        );

        [$subject, $view] = $this->subjectAndView($requiredAction, (string) $travelRequest->reference_no);

        return [
            'subject' => $subject,
            'view' => $view,
            'order' => $order,
            'url' => $url,
            'actionUrl' => $actionUrl,
            'action' => $action,
            'required_action' => $requiredAction,
            'remarks' => $meta['remarks'] ?? null,
            'from_state' => $meta['from_state'] ?? null,
            'to_state' => $meta['to_state'] ?? null,
            'acted_by' => $meta['acted_by'] ?? null,
            'acted_by_name' => $this->employeeName($employeesById, $meta['acted_by'] ?? null),
            'return_to_state' => $meta['return_to_state'] ?? null,
            'return_to_user' => $meta['return_to_user'] ?? null,
        ];
    }

    private function subjectAndView(string $requiredAction, string $referenceNo): array
    {
        $subject = match ($requiredAction) {
            'resubmit'        => "(DEPDev RO1 HRIS) Travel Request No. {$referenceNo} has been returned",
            default           => "(DEPDev RO1 HRIS) Travel Request No. {$referenceNo} has been updated",
        };

        return [$subject, 'emails.travel-requests.action'];
    }

    private function buildSignedActionUrl($conn4, object $notifiable, int $travelRequestId, string $requiredAction): ?string
    {
        $routeByRequiredAction = [
            'endorse' => 'travel-requests.endorse.email',
            'approve' => 'travel-requests.approve.email',
            'authorize' => 'travel-requests.authorize.email',
        ];

        $routeName = $routeByRequiredAction[$requiredAction] ?? null;
        if (! $routeName || ! Route::has($routeName)) {
            return null;
        }

        $token = (string) Str::uuid();

        $conn4->table('email_links')->insert([
            'token' => $token,
            'model' => 'TO',
            'model_id' => $travelRequestId,
            'user_id' => $notifiable->id,
            'is_used' => false,
            'expires_at' => now()->addMonth(),
            'created_at' => now(),
        ]);

        return URL::temporarySignedRoute(
            $routeName,
            now()->addMonth(),
            ['token' => $token]
        );
    }
}
