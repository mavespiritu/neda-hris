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
use Illuminate\Validation\Rule;

class FundSourcesController extends Controller
{
    public function index(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $sort      = $request->get('sort', 'year');
        $direction = $request->get('direction', 'desc');

         $sortable = [
            'title'      => DB::raw('title'),
        ];

        $sortColumn = $sortable[$sort] ?? $sortable['title'];

        $fundSources = $conn2->table('travel_order_fund_sources')
            ->orderBy($sortColumn, $direction)
            ->paginate(10);

        return response()->json([
            'data' => [
                'fundSources' => $fundSources,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validated = $request->validate([
            'title' => 'required',
        ], [
            'title.required' => 'The title for fund source field is required.',
        ]);

        try {

            $conn2->beginTransaction();

            $conn2->table('travel_order_fund_sources')->insert([
                'title' => $validated['title'],
            ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Fund source saved successfully!'
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to save fund source: ' . $e->getMessage());
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while submitting fund source. Please try again.'
            ]);
        }    
    }

    public function update($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validated = $request->validate([
            'title' => 'required',
        ], [
            'title.required' => 'The title for category field is required.',
        ]);

        try {
            $conn2->beginTransaction();

            $conn2->table('travel_order_fund_sources')
            ->where('id', $id)
            ->update([
                'title' => $validated['title'],
            ]);     

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Fund source updated successfully!',
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to update fund source: ' . $e->getMessage());
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating fund source. Please try again.',
            ]);
        }
    }

    public function destroy($id)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $deleted = $conn2->table('travel_order_fund_sources')->where('id', $id)->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Fund source deleted successfully.'
                ]);
            } else {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Fund source not found or already deleted.'
                ]);
            }

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error deleting fund source: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting fund source. Please try again.'
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $deleted = $conn2->table('travel_order_fund_sources')->whereIn('id', $request->input('ids'))->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Selected fund sources have been deleted successfully.'
                ]);
            } else {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Selected fund sources not found or already deleted.'
                ]);
            }

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error bulk deleting fund sources: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting fund sources. Please try again.'
            ]);
        }
    }
}
