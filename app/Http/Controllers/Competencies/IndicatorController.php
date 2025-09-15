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

class IndicatorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $hasHRRole = Auth::user()->hasRole('HRIS_HR');

        $sort      = $request->get('sort', 'competency');
        $direction = $request->get('direction', 'asc');

        $sortable = [
            'competency' => DB::raw('competency'),
            'proficiency' => DB::raw('proficiency'),       
            'indicator' => DB::raw('indicator'),             
        ];

        if(!$hasHRRole){
            abort(404, 'Page not found');
        }

        $indicators = $conn2->table('competency_indicator as ci')
            ->select([
                'ci.id as id',
                'c.comp_id as competency_id',
                'c.competency as competency',
                'ci.proficiency',
                'ci.indicator',
            ])
            ->leftJoin('competency as c','c.comp_id','=','ci.competency_id');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $indicators->where(function ($q) use ($search) {
                $q->where('c.competency', 'LIKE', "%{$search}%")
                  ->orWhere('ci.proficiency', 'LIKE', "%{$search}%")
                  ->orWhere('ci.indicator', 'LIKE', "%{$search}%");
            });
        }

        if ($request->filled('competency')) {
            $indicators->where('ci.competency_id', $request->input('competency'));
        }

        if ($request->filled('proficiency')) {
            $indicators->where('proficiency', $request->input('proficiency'));
        }


        if ($sort && isset($sortable[$sort]) && in_array(strtolower($direction), ['asc', 'desc'])) {
            $indicators->orderBy($sortable[$sort], $direction);
        }

        $indicators = $indicators->paginate(20)->withQueryString();

        return response()->json($indicators);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $request->validate([
            'competency_id' => 'required',
            'proficiency' => 'required',
            'indicator' => 'required|string',
        ],[
            'competency_id.required' => 'The competency field is required.',
            'proficiency.required' => 'The proficiency field is required.',
            'indicator.required' => 'The indicator field is required.',
            'indicator.string' => 'The indicator field must be an acceptable text.',
        ]);

        $exists = $conn2->table('competency_indicator')
            ->where('competency_id', $request->input('competency_id'))
            ->where('proficiency', $request->input('proficiency'))
            ->where('indicator', $request->input('indicator'))
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors([
                'indicator' => 'This indicator already exists.'
            ])->withInput();
        }

        try {
            $conn2->beginTransaction();

            $data = [
                'competency_id' => $request->input('competency_id'),
                'proficiency' => $request->input('proficiency'),
                'indicator' => $request->input('indicator'),
            ];

            $conn2->table('competency_indicator')->insert($data);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Indicator created successfully.'
            ]);

        } catch (Exception $e) {
            $conn2->rollBack();
            Log::error('Error creating indicator: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while creating indicator. Please try again.'
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
            'competency_id' => 'required',
            'proficiency' => 'required',
            'indicator' => 'required|string',
        ],[
            'competency_id.required' => 'The competency field is required.',
            'proficiency.required' => 'The proficiency field is required.',
            'indicator.required' => 'The indicator field is required.',
            'indicator.string' => 'The indicator field must be an acceptable text.',
        ]);

        $exists = $conn2->table('competency')
            ->where('competency_id', $request->input('competency_id'))
            ->where('proficiency', $request->input('proficiency'))
            ->where('indicator', $request->input('indicator'))
            ->where('comp_id', '!=', $id)
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors([
                'indicator' => 'This indicator already exists.'
            ])->withInput();
        }

        try {
            $conn2->beginTransaction();

            $data = [
                'competency_id' => $request->input('competency_id'),
                'proficiency' => $request->input('proficiency'),
                'indicator' => $request->input('indicator'),
            ];

            $conn2->table('competency_indicator')->where('id', $id)->update($data);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Indicator updated successfully.'
            ]);

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error updating indicator: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating indicator. Please try again.'
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

            $deleted = $conn2->table('competency_indicator')->where('id', $id)->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Indicator has been deleted successfully.'
                ]);
            } else {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Indicator not found or already deleted.'
                ]);
            }

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error deleting indicator: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting indicator. Please try again.'
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $deleted = $conn2->table('competency_indicator')->whereIn('id', $request->input('ids'))->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Selected indicators have been deleted successfully.'
                ]);
            } else {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Selected indicators not found or already deleted.'
                ]);
            }

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error bulk deleting indicators: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting indicators. Please try again.'
            ]);
        }
    }

    public function getCompetencyList(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $search = $request->get('search');

        $query = $conn2->table('competency')
            ->select([
                'comp_id as id',
                'competency'
            ])
            ->orderBy('competency.competency', 'asc');

        if ($search) {
            $query->where('competency', 'like', "%{$search}%");
        }

        $competencies = $query->get();

        return response()->json([
            'data' => $competencies
        ]);
    }
}
