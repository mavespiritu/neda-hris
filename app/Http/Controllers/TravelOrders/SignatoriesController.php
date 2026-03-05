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

class SignatoriesController extends Controller
{
    public function index(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $sort      = $request->get('sort', 'year');
        $direction = $request->get('direction', 'desc');

         $sortable = [
            'type'      => DB::raw('type'),
            'division' => DB::raw('division'),
            'name'  => DB::raw('name'),
        ];

        $sortColumn = $sortable[$sort] ?? $sortable['type'];

        $signatories = $conn2->table('travel_order_signatories')
            ->orderBy($sortColumn, $direction)
            ->paginate(10);

        $allEmployees = $conn3->table('tblemployee')
        ->select([
            'emp_id as value',
            DB::raw("CONCAT(fname,' ',IF(mname IS NOT NULL AND mname!='',CONCAT(LEFT(mname,1),'. '),''),lname) as label")
        ])
        ->where('work_status','active')
        ->orderBy('lname')
        ->orderBy('fname')
        ->get();

        $empIds = $signatories
        ->pluck('signatory')
        ->filter() 
        ->unique()
        ->values();

        $employees = $conn3->table('tblemployee')
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
                ")
            ])
            ->whereIn('emp_id', $empIds)
            ->get()
            ->keyBy('emp_id');

        $signatories->getCollection()->transform(function ($item) use ($employees) {
            $item->name = $employees[$item->signatory]->name ?? null;
            return $item;
        });

        return response()->json([
            'data' => [
                'signatories' => $signatories,
                'employees' => $allEmployees,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validated = $request->validate([
            'signatory' => 'required',
            'type' => 'required',
            'division' => 'required',
            'designation' => 'required',
        ], [
            'signatory.required' => 'The signatory field is required.',
            'type.required' => 'The type field is required.',
            'division.required' => 'The division field is required.',
            'designation.required' => 'The designation field is required.',
        ]);

        try {

            $conn2->beginTransaction();

            $conn2->table('travel_order_signatories')
            ->insert([
                'signatory' => $validated['signatory'],
                'type' => $validated['type'],
                'division' => $validated['division'],
                'designation' => $validated['designation'],
            ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Signatory saved successfully!'
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to save signatory: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while submitting signatory. Please try again.'
            ]);
        }    
    }

    public function update($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validated = $request->validate([
            'signatory' => 'required',
            'type' => 'required',
            'division' => 'required',
            'designation' => 'required',
        ], [
            'signatory.required' => 'The signatory field is required.',
            'type.required' => 'The type field is required.',
            'division.required' => 'The division field is required.',
            'designation.required' => 'The designation field is required.',
        ]);

        try {
            $conn2->beginTransaction();

            $conn2->table('travel_order_signatories')
            ->where('id', $id)
            ->update([
                'signatory' => $validated['signatory'],
                'type' => $validated['type'],
                'division' => $validated['division'],
                'designation' => $validated['designation'],
            ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Signatory updated successfully!',
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to update signatory: ' . $e->getMessage());
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating signatory. Please try again.',
            ]);
        }
    }

    public function destroy($id)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $deleted = $conn2->table('travel_order_signatories')->where('id', $id)->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Signatory deleted successfully.'
                ]);
            } else {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Signatory not found or already deleted.'
                ]);
            }

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error deleting signatory: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting signatory. Please try again.'
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $deleted = $conn2->table('travel_order_signatories')->whereIn('id', $request->input('ids'))->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Selected signatories have been deleted successfully.'
                ]);
            } else {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Selected signatories not found or already deleted.'
                ]);
            }

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error bulk deleting signatories: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting signatories. Please try again.'
            ]);
        }
    }
}
