<?php

namespace App\Http\Controllers\Competencies;

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
use App\Notifications\CompetenciesForReviewSubmitted;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

class CompetencyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $hasHRRole = Auth::user()->hasRole('HRIS_HR');

        $sort      = $request->get('sort');
        $direction = $request->get('direction', 'asc');

        $sortable = [
            'competency' => DB::raw('competency'),
            'comp_type_value' => DB::raw('comp_type_value'),       
            'description' => DB::raw('description'),             
        ];

        if(!$hasHRRole){
            abort(404, 'Page not found');
        }

        $competencies = $conn2->table('competency')
            ->select([
                'comp_id as id',
                'comp_type',
                'competency',
                'description',
                DB::raw("
                    CASE comp_type
                        WHEN 'func' THEN 'Technical/Functional'
                        WHEN 'org' THEN 'Organizational'
                        WHEN 'mnt' THEN 'Managerial'
                        ELSE comp_type
                    END AS comp_type_value
                ")
            ]);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $competencies->where(function ($q) use ($search) {
                $q->where('competency', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%")
                  ->orWhereRaw("
                        CASE comp_type
                            WHEN 'func' THEN 'Technical/Functional'
                            WHEN 'org' THEN 'Organizational'
                            WHEN 'mnt' THEN 'Managerial'
                            ELSE comp_type
                        END LIKE ?
                    ", ["%{$search}%"]);
                    });
        }

        if ($request->filled('comp_type')) {
            $competencies->where('comp_type', $request->input('comp_type'));
        }

        if ($request->filled('status')) {
            $competencies->where('status', $request->input('status'));
        }

        if ($sort && isset($sortable[$sort]) && in_array(strtolower($direction), ['asc', 'desc'])) {
            $competencies->orderBy($sortable[$sort], $direction);
        }

        $competencies = $competencies->paginate(20)->withQueryString();

        return response()->json($competencies);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $request->validate([
            'competency' => 'required',
            'comp_type' => 'required',
            'description' => 'required|string',
        ],[
            'competency.required' => 'The competency field is required.',

            'comp_type.required' => 'The competency type field is required.',

            'description.required' => 'The description field is required.',
            'description.string' => 'The description field must be an acceptable text.',
        ]);

        $exists = $conn2->table('competency')
            ->where('competency', $request->input('competency'))
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors([
                'competency' => 'This competency already exists.'
            ])->withInput();
        }

        try {
            $conn2->beginTransaction();

            $data = [
                'competency' => $request->input('competency'),
                'comp_type' => $request->input('comp_type'),
                'description' => $request->input('description'),
            ];

            $conn2->table('competency')->insert($data);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Competency created successfully.'
            ]);

        } catch (Exception $e) {
            $conn2->rollBack();
            Log::error('Error creating competency: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while creating competency. Please try again.'
            ]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $conn2 = DB::connection('mysql2');

        $request->validate([
            'competency' => 'required',
            'comp_type' => 'required',
            'description' => 'required|string',
        ], [
            'competency.required' => 'The competency field is required.',
            'comp_type.required' => 'The competency type field is required.',
            'description.required' => 'The description field is required.',
            'description.string' => 'The description field must be an acceptable text.',
        ]);


        $exists = $conn2->table('competency')
            ->where('competency', $request->input('competency'))
            ->where('comp_id', '!=', $id)
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors([
                'competency' => 'This competency already exists.'
            ])->withInput();
        }

        try {
            $conn2->beginTransaction();

            $data = [
                'competency' => $request->input('competency'),
                'comp_type' => $request->input('comp_type'),
                'description' => $request->input('description'),
            ];

            $conn2->table('competency')->where('comp_id', $id)->update($data);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Competency updated successfully.'
            ]);

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error updating competency: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating competency. Please try again.'
            ]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $deleted = $conn2->table('competency')->where('comp_id', $id)->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Competency has been deleted successfully.'
                ]);
            } else {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Competency not found or already deleted.'
                ]);
            }

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error deleting competency: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting competency. Please try again.'
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $deleted = $conn2->table('competency')->whereIn('comp_id', $request->input('ids'))->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Selected competencies have been deleted successfully.'
                ]);
            } else {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Selected competencies not found or already deleted.'
                ]);
            }

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error bulk deleting competencies: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting competencies. Please try again.'
            ]);
        }
    }
}
