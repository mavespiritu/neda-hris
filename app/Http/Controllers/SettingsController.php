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
        $conn3 = DB::connection('mysql3');

        $request->validate([
            'startDate' => 'required|date',
            'endDate' => 'after_or_equal:startDate',
        ], [
            'startDate.required' => 'The start date field is required.',
            'startDate.date' => 'The start date must be a valid date.',
            
            'endDate.after_or_equal' => 'The end date must be a date after or equal to the start date.',
        ]);

        try {

            $startDate = Carbon::parse($request->startDate)->startOfDay()->addDay();
            $endDate = Carbon::parse($request->endDate)->endOfDay()->addDay();

            $conn2->table('settings')
            ->where('title', 'CGA Enable Updating Dates')
            ->update([
                'value' => $startDate->format('Y-m-d').' - '.$endDate->format('Y-m-d'),
                'updated_by' => Auth::user()->ipms_id,
            ]);

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'CGA enable updating dates updated successfully!'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update cga enable updating dates: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating CGA enable updating dates. Please try again.'
            ]);
        }    
    }
}
