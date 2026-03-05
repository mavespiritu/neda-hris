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

use App\Notifications\VehicleRequests\NotifyEndorserOfVehicleRequest;
use App\Notifications\VehicleRequests\NotifyApproverOfVehicleRequest;
use App\Notifications\VehicleRequests\NotifyReviewerOfVehicleRequest;
use App\Notifications\VehicleRequests\NotifyAuthorizerOfVehicleRequest;
use App\Notifications\VehicleRequests\NotifyStaffOfVehicleRequestAuthorization;
use App\Notifications\VehicleRequests\NotifyStaffOfVehicleRequestDisapproval;
use App\Notifications\VehicleRequests\NotifyStaffOfVehicleRequestReturn;

class NotificationController extends Controller
{
    public function submitTravelRequest($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            // Notify if there is vehicle request
            $travelOrder = $conn2->table('travel_order')->where('id', $id)->first();

            if (!$travelOrder) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Travel order record not found.'
                ]);
            }

            if ($travelOrder->isRequestingVehicle === 1) {

                $submitter = auth()->user();

                $employee = $conn3->table('tblemployee')
                ->select(['division_id'])
                ->where('emp_id', $travelOrder->created_by)
                ->first();

                if (!$employee || !$employee->division_id) {
                    Log::warning("Employee division not found. VR ID: {$travelOrder->id}");
                    return redirect()->back()->with([
                        'status' => 'error',
                        'title' => 'Not Found',
                        'message' => 'Employee division not found.'
                    ]);
                }

                $approvingSignatory = $conn2->table('travel_order_signatories')
                ->select(['signatory'])
                ->where('type', 'Approver_VR')
                ->where('division', $employee->division_id)
                ->first();

                $recommendingSignatory = $conn2->table('travel_order_signatories')
                ->select(['signatory'])
                ->where('type', 'Recommending_VR')
                ->where('division', $employee->division_id)
                ->first();

                $creatorId = (string) $travelOrder->created_by;

                $payload = [
                    'vehicle_request_id' => $travelOrder->id,
                    'submitter_email' => $submitter->email,
                    'submitter_id' => $submitter->ipms_id,
                ];

                // If creator is ALSO the approver -> notify PRU directly
                if ($approvingSignatory && $creatorId === (string) $approvingSignatory->signatory) {

                    $pruUsers = User::role('HRIS_PRU')->get();

                    if ($pruUsers->isEmpty()) {
                        Log::warning("No PRU users found. VR ID: {$travelOrder->id}");
                        return redirect()->back()->with([
                            'status' => 'error',
                            'title' => 'No PRU users',
                            'message' => 'No PRU users found.'
                        ]);
                    }

                    Notification::send($pruUsers, new NotifyReviewerOfVehicleRequest($payload));

                    return redirect()->back()->with([
                        'status' => 'success',
                        'title' => 'Success!',
                        'message' => 'Email notification sent to PRU'
                    ]);
                }

                // If creator is ALSO the endorser -> notify Approver directly
                if ($recommendingSignatory && $creatorId === (string) $recommendingSignatory->signatory) {

                    if (!$approvingSignatory) {
                        Log::warning("No approving signatory found. VR ID: {$travelOrder->id}");
                        return redirect()->back()->with([
                            'status' => 'error',
                            'title' => 'No approving signatory found',
                            'message' => 'No approving signatory found.'
                        ]);
                    }

                    $approverUser = User::where('ipms_id', $approvingSignatory->signatory)->first();

                    if (!$approverUser) {
                        Log::warning("Approver user not found. VR ID: {$travelOrder->id}");
                        return redirect()->back()->with([
                            'status' => 'error',
                            'title' => 'No approver users',
                            'message' => 'No approver users found.'
                        ]);
                    }

                    Notification::send($approverUser, new NotifyApproverOfVehicleRequest($payload));

                    return redirect()->back()->with([
                        'status' => 'success',
                        'title' => 'Success!',
                        'message' => 'Email notification sent to approver'
                    ]);
                }

                // Default => notify Endorser
                if (!$recommendingSignatory) {
                    Log::warning("No endorsing signatory found. VR ID: {$travelOrder->id}");
                    return redirect()->back()->with([
                        'status' => 'error',
                        'title' => 'No endorsing signatory found',
                        'message' => 'No endorsing signatory found.'
                    ]);
                }

                $endorserUser = User::where('ipms_id', $recommendingSignatory->signatory)->first();

                if (!$endorserUser) {
                    Log::warning("Endorsing user not found. VR ID: {$travelOrder->id}");
                    return redirect()->back()->with([
                        'status' => 'error',
                        'title' => 'No endorser users',
                        'message' => 'No endorser users found.'
                    ]);
                }

                Notification::send($endorserUser, new NotifyEndorserOfVehicleRequest($payload));

                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Success!',
                    'message' => 'Email notification sent to endorser'
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Failed to submit TO: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification for submitting TO. Please try again.'
            ]);
        }    
    }

    public function endorseVehicleRequest($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try {

            $user = auth()->user();

            $vehicleRequest = $conn2->table('travel_order')->where('id', $id)->first();
            if (!$vehicleRequest) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Vehicle request record not found.'
                ]);
            }

            $divisionId = $conn3->table('tblemployee')
                ->where('emp_id', $vehicleRequest->created_by)
                ->value('division_id');

            if (!$divisionId) {
                Log::warning("Staff record not found. VR ID: {$vehicleRequest->id}");
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Staff record not found.'
                ]);
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
                    
                    Log::info("VR {$vehicleRequest->id} endorsed by user {$user->email}");
                }
            }

        } catch (\Exception $e) {
            Log::error("Failed endorsement for VR: " . $e->getMessage());
            
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }
    }

    public function approveVehicleRequest($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try {

            $user = auth()->user();

            $vehicleRequest = $conn2->table('travel_order')->where('id', $id)->first();
            if (!$vehicleRequest) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Vehicle request record not found.'
                ]);
            }

            $divisionId = $conn3->table('tblemployee')
                ->where('emp_id', $vehicleRequest->created_by)
                ->value('division_id');

            if (!$divisionId) {
                Log::warning("Staff record not found. VR ID: {$vehicleRequest->id}");
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Staff record not found.'
                ]);
            }

            $pruUsers = User::role('HRIS_PRU')->get();

            if (!$pruUsers) {
                Log::warning("No PRU users found. VR ID: {$vehicleRequest->id}");
            } else {
                $approver = User::where('ipms_id', $approverId)->first();

                Notification::send($pruUsers, new NotifyReviewerOfVehicleRequest([
                    'vehicle_request_id' => $vehicleRequest->id,
                ]));

                Log::info("VR {$vehicleRequest->id} approved by user {$user->email}");
            }

        } catch (\Exception $e) {
            Log::error("Failed approval for VR: " . $e->getMessage());
            
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }
    }

    public function reviewVehicleRequest($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try {

            $user = auth()->user();

            $vehicleRequest = $conn2->table('travel_order')->where('id', $id)->first();
            if (!$vehicleRequest) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Vehicle request record not found.'
                ]);
            }

            $authorizerId = $conn2->table('travel_order_signatories')
            ->where('type', 'Approver_TT')
            ->value('signatory');

            if (!$authorizerId) {
                Log::warning("No authorizing signatory found. VR ID: {$vehicleRequest->id}");
            } else {
                $authorizer = User::where('ipms_id', $authorizerId)->first();

                if (!$authorizer) {
                    Log::warning("No authorizer user found. VR ID: {$vehicleRequest->id}");
                } else {
                    Notification::send($authorizer, new NotifyAuthorizerOfVehicleRequest([
                        'vehicle_request_id' => $vehicleRequest->id,
                        'reviewer_id'     => $user->ipms_id,
                    ]));
                    
                    Log::info("VR {$vehicleRequest->id} reviewed by user {$user->email}");
                }
            }

        } catch (\Exception $e) {
            Log::error("Failed reviewing for VR: " . $e->getMessage());
            
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }
    }

    public function authorizeVehicleRequest($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try {

            $user = auth()->user();

            $vehicleRequest = $conn2->table('travel_order')->where('id', $id)->first();
            if (!$vehicleRequest) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Vehicle request record not found.'
                ]);
            }

            $creator = User::where('ipms_id', $vehicleRequest->created_by)->first();

            if (!$creator) {
                Log::warning("User account of creator of vehicle request not found. VR ID: {$vehicleRequest->id}");
            } else {
                Notification::send($creator, new NotifyStaffOfVehicleRequestAuthorization([
                        'vehicle_request_id' => $vehicleRequest->id,
                        'recommender_id'     => $user->ipms_id,
                    ]));
                    
                Log::info("VR {$vehicleRequest->id} authorized by user {$user->email}");
            }

        } catch (\Exception $e) {
            Log::error("Failed authorizing for VR: " . $e->getMessage());
            
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }
    }

    public function disapproveVehicleRequest($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try {

            $vehicleRequest = $conn2->table('travel_order')->where('id', $id)->first();
            if (!$vehicleRequest) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Vehicle request record not found.'
                ]);
            }

            $creator = User::where('ipms_id', $vehicleRequest->created_by)->first();

            if (!$creator) {
                Log::warning("User account of creator of vehicle request not found. VR ID: {$vehicleRequest->id}");
            } else {

                $remarks = $conn2->table('submission_history')->where([
                    'model' => 'Vehicle Request',
                    'model_id' => $vehicleRequest->id,
                    'status' => 'Disapproved',
                    'acted_by' => $userId,
                ])
                ->orderBy('date_acted', 'desc')
                ->first();

                Notification::send($creator, new NotifyStaffOfVehicleRequestDisapproval([
                        'vehicle_request_id' => $vehicleRequest->id,
                        'disapprover_id'     => $userId,
                        'remarks'            => $remarks->remarks ?? 'No remarks' 
                    ]));
                    
                Log::info("VR {$vehicleRequest->id} disapproved by user {$user->email}");
            }

        } catch (\Exception $e) {
            Log::error("Failed disapproving for VR: " . $e->getMessage());
            
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }
    }

    public function returnVehicleRequest($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try {

            $vehicleRequest = $conn2->table('travel_order')->where('id', $id)->first();
            if (!$vehicleRequest) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Vehicle request record not found.'
                ]);
            }

            $creator = User::where('ipms_id', $vehicleRequest->created_by)->first();

            if (!$creator) {
                Log::warning("User account of creator of vehicle request not found. VR ID: {$vehicleRequest->id}");
            } else {

                $remarks = $conn2->table('submission_history')->where([
                    'model' => 'Vehicle Request',
                    'model_id' => $vehicleRequest->id,
                    'status' => 'Returned',
                    'acted_by' => $userId,
                ])
                ->orderBy('date_acted', 'desc')
                ->first();

                Notification::send($creator, new NotifyStaffOfVehicleRequestReturn([
                        'vehicle_request_id' => $vehicleRequest->id,
                        'returner_id'     => $userId,
                        'remarks'            => $remarks->remarks ?? 'No remarks' 
                    ]));
                    
                Log::info("VR {$vehicleRequest->id} returned by user {$user->email}");
            }

        } catch (\Exception $e) {
            Log::error("Failed returning for VR: " . $e->getMessage());
            
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }
    }
}
