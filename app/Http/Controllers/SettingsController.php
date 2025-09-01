<?php

namespace App\Http\Controllers;

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
use App\Notifications\CompetenciesForReviewSubmitted;

class SettingsController extends Controller
{
    public function index()
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');


        return inertia('Settings/index');
    }

    public function getCgaEnableUpdatingDates()
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $dates = $conn2->table('settings')
                    ->where('title', 'CGA Enable Updating Dates')
                    ->value('value');

        try {
            if ($dates) {
                [$startDate, $endDate] = explode(' - ', $dates);
                
                return response()->json([
                    'startDate' => $startDate,
                    'endDate' => $endDate,
                ]);
            }else{
                return response()->json([
                    'startDate' => null,
                    'endDate' => null,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to retrieve cga enable updating dates: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while retrieving CGA enable updating dates. Please try again.'
            ]);
        }    
    }

    public function setCgaEnableUpdatingDates(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $request->validate([
            'startDate' => 'required|date',
            'endDate' => 'after_or_equal:startDate',
        ], [
            'startDate.required' => 'The start date field is required.',
            'startDate.date' => 'The start date must be a valid date.',
            
            'endDate.after_or_equal' => 'The end date must be a date after or equal to the start date.',
        ]);

        try {

            $conn2->beginTransaction();

            $startDate = Carbon::parse($request->startDate)->startOfDay()->format('Y-m-d');
            $endDate = Carbon::parse($request->endDate)->endOfDay()->format('Y-m-d');

            $conn2->table('settings')
            ->where('title', 'CGA Enable Updating Dates')
            ->update([
                'value' => $startDate.' - '.$endDate,
                'updated_by' => Auth::user()->ipms_id,
            ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'CGA enable updating dates updated successfully!'
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to update cga enable updating dates: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating CGA enable updating dates. Please try again.'
            ]);
        }    
    }

    public function organization()
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try {
            $settings = $conn2->table('settings')
                ->whereIn('title', [
                    'Agency Title Long',
                    'Agency Title Short',
                    'Agency Head',
                    'Agency Head Position',
                    'Agency Sub-Head',
                    'Agency Sub-Head Position',
                    'Agency Address',
                    'Agency Main Long',
                    'Agency Main Short',
                ])
                ->pluck('value', 'title');

                return response()->json([
                    'agency_main_name_long' => $settings['Agency Main Long'] ?? '',
                    'agency_main_name_short' => $settings['Agency Main Short'] ?? '',
                    'agency_name_long' => $settings['Agency Title Long'] ?? '',
                    'agency_name_short' => $settings['Agency Title Short'] ?? '',
                    'agency_head' => $settings['Agency Head'] ?? '',
                    'agency_head_position' => $settings['Agency Head Position'] ?? '',
                    'agency_sub_head' => $settings['Agency Sub-Head'] ?? '',
                    'agency_sub_head_position' => $settings['Agency Sub-Head Position'] ?? '',
                    'agency_address' => $settings['Agency Address'] ?? '',
                ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve organization settings: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while retrieving organization settings. Please try again.'
            ]);
        }    
    }

    public function updateOrganization(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $fields = [
            'Agency Main Long'      => $request->input('agency_main_name_long'),
            'Agency Main Short'      => $request->input('agency_main_name_short'),
            'Agency Title Long'      => $request->input('agency_name_long'),
            'Agency Title Short'     => $request->input('agency_name_short'),
            'Agency Head'            => $request->input('agency_head'),
            'Agency Head Position'   => $request->input('agency_head_position'),
            'Agency Sub-Head'            => $request->input('agency_sub_head'),
            'Agency Sub-Head Position'   => $request->input('agency_sub_head_position'),
            'Agency Address'         => $request->input('agency_address'),
        ];

        try {
            $conn2->beginTransaction();

            foreach ($fields as $title => $value) {
                $conn2->table('settings')->updateOrInsert(
                    ['title' => $title],
                    ['value' => $value]
                );
            }

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Organization settings updated',
                'message' => 'Organization settings were successfully updated.',
            ]);

        } catch (\Exception $e) {
            $conn2->rollBack();

            Log::error('Failed to update organization settings: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Update failed',
                'message' => 'An error occurred while updating organization settings.',
            ]);
        }
    }

    public function account()
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not authenticated.',
                ], 401);
            }

            $signature = null;
            if ($user->signature) {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mimeType = finfo_buffer($finfo, $user->signature);
                finfo_close($finfo);
                $signature = 'data:' . $mimeType . ';base64,' . base64_encode($user->signature);
            }

            return response()->json([
                'last_name'   => $user->last_name ?? '',
                'first_name'  => $user->first_name ?? '',
                'middle_name' => $user->middle_name ?? '',
                'signature'   => $signature,
                'digital_sig'   => $user->digital_sig ? 'exists' : null,
            ]);
        } catch (\Throwable $e) {
            \Log::error('Account fetch failed: ' . $e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'Could not fetch account.',
            ], 500);
        }
    }

    public function updateAccount(Request $request)
    {
        $conn4 = DB::connection('mysql4');

        $validated = $request->validate([
            'last_name'   => 'required|string|max:255',
            'first_name'  => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'signature'   => auth()->user()->signature 
                     ? 'nullable'
                     : 'nullable|file|mimes:png,jpg,jpeg|max:4096',
            'digital_sig'   => auth()->user()->digital_sig 
                     ? 'nullable'
                     : 'nullable|file|mimetypes:application/x-pkcs12,application/octet-stream|max:4096',
        ], [
            'last_name.required'   => 'The last name is required.',
            'first_name.required'  => 'The first name is required.',
            'middle_name.string'   => 'The middle name must be a valid string.',
            'signature.file'       => 'The signature must be a valid file.',
            'signature.mimes'      => 'The signature must be a PNG or JPG image.',
            'signature.max'        => 'The signature must not be larger than 4MB.',
            'digital_sig.file'       => 'The digital signature must be a valid file.',
            'digital_sig.mimes'      => 'The digital signature must be a p12 file.',
            'digital_sig.max'        => 'The digital signature must not be larger than 4MB.',
        ]);

        try {
            $conn4->beginTransaction();

            $updateData = [
                'last_name'   => $validated['last_name'],
                'first_name'  => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
            ];

            if ($request->hasFile('signature')) {
                $updateData['signature'] = file_get_contents($request->file('signature')->getRealPath());
            }

            if ($request->hasFile('digital_sig')) {
                $updateData['digital_sig'] = file_get_contents($request->file('digital_sig')->getRealPath());
            }

            $conn4->table('users')
                ->where('id', auth()->user()->id)
                ->update($updateData);

            $conn4->commit();

            return redirect()->back()->with([
                'status'  => 'success',
                'title'   => 'Account updated',
                'message' => 'Account settings were successfully updated.',
            ]);

        } catch (\Exception $e) {
            $conn4->rollBack();

            Log::error('Failed to update account settings: ' . $e->getMessage());

            return redirect()->back()->with([
                'status'  => 'error',
                'title'   => 'Update failed',
                'message' => 'An error occurred while updating account settings.',
            ]);
        }
    }

    public function recruitment()
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try {
            $requirements = $conn2->table('recruitment_requirements')->get();

            return response()->json([
                'requirements' => $requirements
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve recruitment settings: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while retrieving recruitment settings. Please try again.'
            ]);
        }    
    }

    public function updateRecruitment(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $validated = $request->validate([
            'requirements' => 'required|array',
            'requirements.*.requirement' => 'required|string|max:255',
            'requirements.*.is_default' => 'boolean',
            'requirements.*.is_multiple' => 'boolean',
            'requirements.*.id' => 'nullable|integer|exists:mysql2.recruitment_requirements,id',
        ],[
            'requirements.required' => 'At least one requirement is required.',
            'requirements.*.requirement.required' => 'The requirement field is required.',
            'requirements.*.is_default.boolean' => 'The "is default" value must be true or false.',
            'requirements.*.is_multiple.boolean' => 'The "is multiple" value must be true or false.',
        ]);

        $requirements = $request->requirements;

        DB::beginTransaction();

        try {
            foreach ($requirements as $req) {
                if (isset($req['id'])) {
                    $conn2->table('recruitment_requirements')
                        ->where('id', $req['id'])
                        ->update([
                            'requirement' => $req['requirement'],
                            'is_default' => $req['is_default'] ?? false,
                            'is_multiple' => $req['is_multiple'] ?? false,
                            'connected_to' => $req['connected_to'],
                        ]);
                } else {
                    $conn2->table('recruitment_requirements')
                        ->insert([
                            'requirement' => $req['requirement'],
                            'is_default' => $req['is_default'] ?? false,
                            'is_multiple' => $req['is_multiple'] ?? false,
                            'connected_to' => $req['connected_to'],
                        ]);
                }
            }

            DB::commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Recruitment settings updated',
                'message' => 'Recruitment settings updated successfully..',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Update failed',
                'message' => 'An error occurred while updating recruitment settings.',
            ]);
        }
    }

    public function getCgaSubmissionSchedules()
    {
        $conn2 = DB::connection('mysql2');

        $schedules = $conn2->table('cga_submission_settings')
            ->orderBy('year', 'desc')
            ->paginate(5);

        $schedules->getCollection()->transform(function ($item) {
            if (!empty($item->submission_dates) && str_contains($item->submission_dates, ' - ')) {
                [$fromDate, $endDate] = explode(' - ', $item->submission_dates);
                $item->from_date = $fromDate;
                $item->end_date = $endDate;
            } else {
                $item->from_date = null;
                $item->end_date = null;
            }

            return $item;
        });

        return response()->json($schedules);
    }
}
