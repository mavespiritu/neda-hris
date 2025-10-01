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
use Illuminate\Validation\Rule;

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

        $validated = $request->validate([
            'requirements' => 'nullable|array',
            'requirements.*.requirement' => 'required|string|max:255',
            'requirements.*.is_default' => 'boolean',
            'requirements.*.is_multiple' => 'boolean',
            'requirements.*.id' => 'nullable|integer|exists:mysql2.recruitment_requirements,id',
        ], [
            'requirements.*.requirement.required' => 'The requirement field is required.',
            'requirements.*.is_default.boolean' => 'The "is default" value must be true or false.',
            'requirements.*.is_multiple.boolean' => 'The "is multiple" value must be true or false.',
        ]);

        $requirements = $request['requirements'];

        DB::beginTransaction();

        try {

            $incomingIds = collect($requirements)
                ->pluck('id')
                ->filter() 
                ->toArray();

            $conn2->table('recruitment_requirements')
                ->whereNotIn('id', $incomingIds)
                ->delete();

            foreach ($requirements as $req) {
                if (!empty($req['id'])) {

                    $conn2->table('recruitment_requirements')
                        ->where('id', $req['id'])
                        ->update([
                            'requirement' => $req['requirement'],
                            'is_default' => $req['is_default'] ?? false,
                            'is_multiple' => $req['is_multiple'] ?? false,
                            'connected_to' => $req['connected_to'] ?? null,
                        ]);
                } else {
 
                    $conn2->table('recruitment_requirements')
                        ->insert([
                            'requirement' => $req['requirement'],
                            'is_default' => $req['is_default'] ?? false,
                            'is_multiple' => $req['is_multiple'] ?? false,
                            'connected_to' => $req['connected_to'] ?? null,
                        ]);
                }
            }

            DB::commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Recruitment settings updated',
                'message' => 'Recruitment settings updated successfully.',
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

    public function getCgaSubmissionSchedules(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $sort      = $request->get('sort', 'year');
        $direction = $request->get('direction', 'desc');

         $sortable = [
            'year'      => DB::raw('year'),
            'from_date' => DB::raw("STR_TO_DATE(SUBSTRING_INDEX(submission_dates, ' - ', 1), '%Y-%m-%d')"),
            'end_date'  => DB::raw("STR_TO_DATE(SUBSTRING_INDEX(submission_dates, ' - ', -1), '%Y-%m-%d')"),
        ];

        $sortColumn = $sortable[$sort] ?? $sortable['year'];

        $schedules = $conn2->table('cga_submission_settings')
            ->orderBy($sortColumn, $direction)
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

        return response()->json(
        ['data' => [
            'schedules' => $schedules
        ]]);
    }

    public function getCgaSubmissionSchedulesList(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $today = Carbon::today();

        $schedules = $conn2->table('cga_submission_settings')
            ->orderByDesc('year')
            ->get()
            ->filter(function ($item) use ($today) {
                if (!empty($item->submission_dates) && str_contains($item->submission_dates, ' - ')) {
                    [$fromDate, $endDate] = explode(' - ', $item->submission_dates);
                    $from = Carbon::parse($fromDate);
                    $to = Carbon::parse($endDate);

                    return $today->between($from, $to);
                }
                return false;
            })
            ->map(function ($item) {
                [$fromDate, $endDate] = explode(' - ', $item->submission_dates);
                $item->from_date = $fromDate;
                $item->end_date = $endDate;
                $item->from_date_formatted = Carbon::parse($fromDate)->format('F j, Y');
                $item->end_date_formatted = Carbon::parse($endDate)->format('F j, Y');

                return $item;
            })
            ->values(); 
            
        return response()->json(['data' => $schedules]);
    }

    public function storeCgaSubmissionSchedules(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validated = $request->validate([
            'year' => [
                'required',
                'digits:4',
                function ($attribute, $value, $fail) use ($conn2) {
                    if ($conn2->table('cga_submission_settings')
                            ->where('year', $value)
                            ->exists()) {
                        $fail('A submission schedule already exists for this year.');
                    }
                },
            ],
            'from_date' => 'required|date',
            'end_date' => 'after_or_equal:from_date',
        ], [
            'year.required' => 'The year field is required.',
            'year.digits' => 'The year must be a 4-digit year.',

            'from_date.required' => 'The start date field is required.',
            'from_date.date' => 'The start date must be a valid date.',

            'end_date.required' => 'The end date field is required.',
            'end_date.date' => 'The end date must be a valid date.',
            'end_date.after_or_equal' => 'The end date must be a date after or equal to the start date.',
        ]);

        try {

            $conn2->beginTransaction();

            $startDate = Carbon::parse($validated['from_date'])->startOfDay()->format('Y-m-d');
            $endDate = Carbon::parse($validated['end_date'])->endOfDay()->format('Y-m-d');

            $conn2->table('cga_submission_settings')
            ->insert([
                'year' => $validated['year'],
                'submission_dates' => $startDate.' - '.$endDate,
            ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Submission schedule saved successfully!'
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to save submission schedule: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while submitting schedule. Please try again.'
            ]);
        }    
    }

    public function updateCgaSubmissionSchedules($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validated = $request->validate([
            'year' => [
                'required',
                'digits:4',
                function ($attribute, $value, $fail) use ($conn2, $id) {
                    $exists = $conn2->table('cga_submission_settings')
                        ->where('year', $value)
                        ->where('id', '!=', $id)
                        ->exists();

                    if ($exists) {
                        $fail('A submission schedule already exists for this year.');
                    }
                },
            ],
            'from_date' => 'required|date',
            'end_date' => 'after_or_equal:from_date',
        ], [
            'year.required' => 'The year field is required.',
            'year.digits' => 'The year must be a 4-digit year.',

            'from_date.required' => 'The start date field is required.',
            'from_date.date' => 'The start date must be a valid date.',

            'end_date.required' => 'The end date field is required.',
            'end_date.date' => 'The end date must be a valid date.',
            'end_date.after_or_equal' => 'The end date must be a date after or equal to the start date.',
        ]);

        try {
            $conn2->beginTransaction();

            $startDate = Carbon::parse($validated['from_date'])->startOfDay()->format('Y-m-d');
            $endDate = Carbon::parse($validated['end_date'])->endOfDay()->format('Y-m-d');

            $conn2->table('cga_submission_settings')
                ->where('id', $id)
                ->update([
                    'year' => $validated['year'],
                    'submission_dates' => $startDate . ' - ' . $endDate,
                ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Submission schedule updated successfully!',
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to update submission schedule: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating schedule. Please try again.',
            ]);
        }
    }

    public function destroyCgaSubmissionSchedules($id)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $deleted = $conn2->table('cga_submission_settings')->where('id', $id)->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Submission schedule deleted successfully.'
                ]);
            } else {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Submission schedule not found or already deleted.'
                ]);
            }

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error deleting submission schedule: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting submission schedule. Please try again.'
            ]);
        }
    }

    public function bulkDestroyCgaSubmissionSchedules(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $deleted = $conn2->table('cga_submission_settings')->whereIn('id', $request->input('ids'))->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Selected submission schedules have been deleted successfully.'
                ]);
            } else {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Selected submission schedules not found or already deleted.'
                ]);
            }

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error bulk deleting submission schedules: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting submission schedules. Please try again.'
            ]);
        }
    }
}
