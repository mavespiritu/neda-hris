<?php

namespace App\Http\Controllers\TravelOrders;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Gate;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use App\Models\VehicleRequest;
use App\States\VehicleRequest\Draft;
use App\States\VehicleRequest\Submitted;
use App\States\VehicleRequest\Endorsed;
use App\States\VehicleRequest\Approved;
use App\States\VehicleRequest\Reviewed;
use App\States\VehicleRequest\Authorized;
use App\States\VehicleRequest\Disapproved;
use App\States\VehicleRequest\Returned;
use App\States\VehicleRequest\Resubmitted;
use App\Notifications\VehicleRequests\NotifyApproverOfVehicleRequest;
use App\Notifications\VehicleRequests\NotifyReviewerOfVehicleRequest;
use App\Notifications\VehicleRequests\NotifyStaffOfVehicleRequestAuthorization;

class VehicleRequestsController extends Controller
{

    public function endorse($id)
    {
        $conn2 = DB::connection('mysql2');

        Gate::inspect('vr.endorse', $id);

        try {

            $conn2->beginTransaction();

            $vehicleRequest = $conn2->table('travel_order')->where('id', $id)->first();

            if (!$vehicleRequest) {
                abort(404, 'Vehicle request not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'Vehicle Request',
                'model_id' => $id,
                'status' => 'Endorsed',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
            ]);

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error endorsing vehicle request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while endorsing vehicle request. Please try again.'
            ]);
        }
    }

    public function endorseViaEmail($token)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        $conn4 = DB::connection('mysql4');

        try {

            $conn2->beginTransaction();
            $conn3->beginTransaction();
            $conn4->beginTransaction();

            $link = $conn4->table('email_links')->where('token', $token)->first();
            
            if (!$link) abort(404, 'Invalid link.');

            if (now()->greaterThan($link->expires_at)) {
                return Inertia::render('ThankYou', ['message' => 'This link has expired.']);
            }

            if ($link->is_used) {
                return Inertia::render('ThankYou', ['message' => 'This link has already been used.']);
            }
            
            $vehicleRequest = $conn2->table('travel_order')->where('id', $link->model_id)->first();
            if (!$vehicleRequest) abort(404, 'Vehicle request not found');

            $user = User::find($link->user_id);
            if (!$user) abort(404, 'User not found');

            $conn2->table('submission_history')->insert([
                'model' => 'Vehicle Request',
                'model_id' => $vehicleRequest->id,
                'status' => 'Endorsed',
                'acted_by' => $user->ipms_id,
                'date_acted' => now(),
            ]);

            $conn4->table('email_links')
            ->where('token', $token)
            ->update(['is_used' => true]);

            $divisionId = $conn3->table('tblemployee')
                ->where('emp_id', $vehicleRequest->created_by)
                ->value('division_id');

            if (!$divisionId) {
                Log::warning("Staff record not found. VR ID: {$vehicleRequest->id}");
                return Inertia::render('ThankYou', ['message' => 'Staff record not found.']);
            }

            $approverId = $conn2->table('travel_order_signatories')
            ->where('type', 'Approver_VR')
            ->where('division', $divisionId)
            ->value('signatory');

            if (!$approverId) {
                Log::warning("No approving signatory found. VR ID: {$vehicleRequest->id}");
            } else {
                $approver = User::where('ipms_id', $approverId)->first();

                if (!$approver) {
                    Log::warning("No approver user found. VR ID: {$vehicleRequest->id}");
                } else {
                    Notification::send($approver, new NotifyApproverOfVehicleRequest([
                        'vehicle_request_id' => $vehicleRequest->id,
                        'recommender_id'     => $user->ipms_id,
                    ]));
                }
            }

            Log::info("VR {$vehicleRequest->id} endorsed via email by user {$user->email}");

            $conn2->commit();
            $conn3->commit();
            $conn4->commit();

            return Inertia::render('ThankYou', [
                'message' => 'You have successfully endorsed the vehicle request.',
            ]);

        } catch (\Exception $e) {
            $conn2->rollBack();
            $conn3->rollBack();
            $conn4->rollBack();
            Log::error("Failed email endorsement for VR: " . $e->getMessage());
            
            return Inertia::render('ThankYou', [
                'message' => 'Something went wrong. Please contact the ICT Unit.',
            ]);
        }
    }

    public function approve($id)
    {

        $conn2 = DB::connection('mysql2');

        Gate::inspect('vr.approve', $id);

        try {

            $conn2->beginTransaction();

            $vehicleRequest = $conn2->table('travel_order')->where('id', $id)->first();

            if (!$vehicleRequest) {
                abort(404, 'Vehicle request not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'Vehicle Request',
                'model_id' => $id,
                'status' => 'Approved',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
            ]);

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error approving vehicle request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while approving vehicle request. Please try again.'
            ]);
        }
    }

    public function approveViaEmail($token)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        $conn4 = DB::connection('mysql4');

        try {

            $conn2->beginTransaction();
            $conn3->beginTransaction();
            $conn4->beginTransaction();

            $link = $conn4->table('email_links')->where('token', $token)->first();
            
            if (!$link) abort(404, 'Invalid link.');

            if (now()->greaterThan($link->expires_at)) {
                return Inertia::render('ThankYou', ['message' => 'This link has expired.']);
            }

            if ($link->is_used) {
                return Inertia::render('ThankYou', ['message' => 'This link has already been used.']);
            }
            
            $vehicleRequest = $conn2->table('travel_order')->where('id', $link->model_id)->first();
            if (!$vehicleRequest) abort(404, 'Vehicle request not found');

            $user = User::find($link->user_id);
            if (!$user) abort(404, 'User not found');

            $conn2->table('submission_history')->insert([
                'model' => 'Vehicle Request',
                'model_id' => $vehicleRequest->id,
                'status' => 'Approved',
                'acted_by' => $user->ipms_id,
                'date_acted' => now(),
            ]);

            $conn4->table('email_links')
            ->where('token', $token)
            ->update(['is_used' => true]);

            $pruUsers = User::role('HRIS_PRU')->get();

            if (!$pruUsers) {
                Log::warning("No PRU users found. VR ID: {$vehicleRequest->id}");
            } else {
                Notification::send($pruUsers, new NotifyReviewerOfVehicleRequest([
                    'vehicle_request_id' => $vehicleRequest->id,
                ]));
            }

            Log::info("VR {$vehicleRequest->id} approved via email by user {$user->email}");

            $conn2->commit();
            $conn3->commit();
            $conn4->commit();

            return Inertia::render('ThankYou', [
                'message' => 'You have successfully approved the vehicle request.',
            ]);

        } catch (\Exception $e) {
            $conn2->rollBack();
            $conn3->rollBack();
            $conn4->rollBack();
            Log::error("Failed email approval for VR: " . $e->getMessage());
            
            return Inertia::render('ThankYou', [
                'message' => 'Something went wrong. Please contact the ICT Unit.',
            ]);
        }
    }

    public function review(Request $request, $id)
    {

        $conn2 = DB::connection('mysql2');

        Gate::inspect('vr.review', $id);

        $validated = $request->validate([
            'recommendation'     => ['required', 'in:Approved,Disapproved'],
            'prioritization_id' => [
                Rule::requiredIf(fn () => $request->input('recommendation') === 'Approved'),
                'nullable',
            ],
            'remarks' => [
                Rule::requiredIf(fn () => $request->input('recommendation') === 'Disapproved'),
                'nullable',
            ],
        ]);

        try {

            $conn2->beginTransaction();

            $vehicleRequest = $conn2->table('travel_order')->where('id', $id)->first();
            if (!$vehicleRequest) {
                $conn2->rollBack();
                return back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Vehicle request not found.',
                ]);
            }

            $reviewerId = (string) auth()->user()->ipms_id;

            $existing = $conn2->table('travel_order_review')
            ->where('travel_order_id', (int) $id)
            ->first();

            $reason = null;

            if ($validated['recommendation'] === 'Approved' && !empty($validated['prioritization_id'])) {
                $reason = $conn2->table('travel_order_prioritizations')
                    ->where('id', (int) $validated['prioritization_id'])
                    ->value('reason');
            }

            $payload = [
                'travel_order_id'   => (int) $id,
                'recommendation'    => $validated['recommendation'],
                'dispatcher'        => $reviewerId,
                'prioritization_id' => $validated['recommendation'] === 'Approved'
                    ? (int) ($validated['prioritization_id'] ?? 0)
                    : null,
                'reason'            => $validated['recommendation'] === 'Approved' ? ($reason ?? null) : null,
                'remarks'           => $validated['remarks'] ?? null,
            ];

            if ($validated['recommendation'] === 'Disapproved') {
                $payload['prioritization_id'] = null;
                $payload['reason'] = null;
            }

            if ($existing) {
                $payload['updated_by'] = $reviewerId;
                $payload['updated_at'] = now();

                $conn2->table('travel_order_review')
                    ->where('id', (int) $existing->id)
                    ->update($payload);
            } else {
                $payload['created_by'] = $reviewerId;
                $payload['created_at'] = now();

                $conn2->table('travel_order_review')->insert($payload);
            }

            $conn2->table('submission_history')->insert([
                'model' => 'Vehicle Request',
                'model_id' => $id,
                'status' => 'Reviewed',
                'acted_by' => $reviewerId,
                'date_acted' => now(),
            ]);

            $conn2->commit();

            return back()->with([
                'status' => 'success',
                'title' => 'Submitted',
                'message' => 'PRU assessment submitted.',
            ]);

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error reviewing vehicle request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while reviewing vehicle request. Please try again.'
            ]);
        }
    }

    public function authorize($id)
    {

        $conn2 = DB::connection('mysql2');

        Gate::inspect('vr.authorize', $id);

        try {

            $conn2->beginTransaction();

            $vehicleRequest = $conn2->table('travel_order')->where('id', $id)->first();
            if (!$vehicleRequest) abort(404, 'Vehicle request not found');

            $conn2->table('submission_history')->insert([
                'model' => 'Vehicle Request',
                'model_id' => $id,
                'status' => 'Authorized',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
            ]);

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error authorizing vehicle request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while authorizing vehicle request. Please try again.'
            ]);
        }
    }

    public function authorizeViaEmail($token)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        $conn4 = DB::connection('mysql4');

        try {

            $conn2->beginTransaction();
            $conn3->beginTransaction();
            $conn4->beginTransaction();

            $link = $conn4->table('email_links')->where('token', $token)->first();
            
            if (!$link) abort(404, 'Invalid link.');

            if (now()->greaterThan($link->expires_at)) {
                return Inertia::render('ThankYou', ['message' => 'This link has expired.']);
            }

            if ($link->is_used) {
                return Inertia::render('ThankYou', ['message' => 'This link has already been used.']);
            }
            
            $vehicleRequest = $conn2->table('travel_order')->where('id', $link->model_id)->first();
            if (!$vehicleRequest) abort(404, 'Vehicle request not found');

            $user = User::find($link->user_id);
            if (!$user) abort(404, 'User not found');

            $conn2->table('submission_history')->insert([
                'model' => 'Vehicle Request',
                'model_id' => $vehicleRequest->id,
                'status' => 'Authorized',
                'acted_by' => $user->ipms_id,
                'date_acted' => now(),
            ]);

            $conn4->table('email_links')
            ->where('token', $token)
            ->update(['is_used' => true]);

            $creator = User::where('ipms_id', $vehicleRequest->created_by)->first();

            if (!$creator) {
                Log::warning("User account of creator of vehicle request not found. VR ID: {$vehicleRequest->id}");
            }else{
                Notification::send($creator, new NotifyStaffOfVehicleRequestAuthorization([
                    'vehicle_request_id' => $vehicleRequest->id,
                    'recommender_id'     => $user->ipms_id,
                ]));
            }

            // Audit log (optional)
            Log::info("VR {$vehicleRequest->id} authorized via email by user {$user->email}");

            $conn2->commit();
            $conn3->commit();
            $conn4->commit();

            return Inertia::render('ThankYou', [
                'message' => 'You have successfully authorized the vehicle request.',
            ]);

        } catch (\Exception $e) {
            $conn2->rollBack();
            $conn3->rollBack();
            $conn4->rollBack();
            Log::error("Failed email authorization for VR: " . $e->getMessage());
            
            return Inertia::render('ThankYou', [
                'message' => 'Something went wrong. Please contact the ICT Unit.',
            ]);
        }
    }

    public function disapprove(Request $request, $id)
    {

        $conn2 = DB::connection('mysql2');

        Gate::inspect('vr.disapprove', $id);

        $request->validate(
            [
                'remarks' => 'required|string|max:1000',
            ],
            [
                'remarks.required' => 'Remarks are required to disapprove a vehicle request',
                'remarks.string'   => 'Remarks must be a valid text.',
                'remarks.max'      => 'Remarks cannot exceed 1000 characters.',
            ]
        );

        try {

            $conn2->beginTransaction();

            $vehicleRequest = $conn2->table('travel_order')->where('id', $id)->first();
            if (!$vehicleRequest) abort(404, 'Vehicle request not found');

            $conn2->table('submission_history')->insert([
                'model' => 'Vehicle Request',
                'model_id' => $id,
                'status' => 'Disapproved',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
                'remarks' => $request->remarks
            ]);

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error disapproving vehicle request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while disapproving vehicle request. Please try again.'
            ]);
        }
    }

    public function return(Request $request, $id)
    {

        $conn2 = DB::connection('mysql2');

        Gate::inspect('vr.return', $id);

        $request->validate(
            [
                'remarks' => 'required|string|max:1000',
            ],
            [
                'remarks.required' => 'Remarks are required to return a vehicle request',
                'remarks.string'   => 'Remarks must be a valid text.',
                'remarks.max'      => 'Remarks cannot exceed 1000 characters.',
            ]
        );

        try {

            $conn2->beginTransaction();

            $vehicleRequest = VehicleRequest::findOrFail($id);

            $vehicleRequest->state->transitionTo(
                Returned::class,
                actedBy: (string) auth()->user()->ipms_id,
                remarks: $validated['remarks'],
            );

            $conn2->commit();

            return back()->with([
                'status' => 'success',
                'title' => 'Returned',
                'message' => 'Vehicle request returned to the creator.',
            ]);

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error returning vehicle request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while returning vehicle request. Please try again.'
            ]);
        }
    }

    public function resubmit($id)
    {

        $conn2 = DB::connection('mysql2');

        Gate::inspect('vr.resubmit', $id);

        try {

            $conn2->beginTransaction();

            $vehicleRequest = VehicleRequest::find($id);

            $returnerUserId = (string)($vehicleRequest->return_to_user ?? '');

            $vehicleRequest->state->transitionTo(
                Resubmitted::class,
                actedBy: (string) auth()->user()->ipms_id,
            );

            $target = (string)($vehicleRequest->return_to_state ?? 'Submitted');

            $class = match ($target) {
                'Submitted' => Submitted::class,
                'Endorsed'  => Endorsed::class,
                'Approved'  => Approved::class,
                'Reviewed'  => Reviewed::class,
                default     => Submitted::class,
            };

            $vehicleRequest->refresh();
            $vehicleRequest->state->transitionTo(
                $class, 
                actedBy: (string) auth()->user()->ipms_id
            );

            // ✅ notify the RETURNER (receiver again)
            if ($returnerUserId) {
                // dispatch(new NotifyVehicleResubmittedJob($travelOrder->id, $returnerUserId));
            }

            $conn2->commit();

            return back()->with([
                'status' => 'success',
                'title' => 'Resubmitted',
                'message' => 'Vehicle request resubmitted to the last reviewer/returner.',
            ]);

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error resubmitting vehicle request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while resubmitting vehicle request. Please try again.'
            ]);
        }
    }
}