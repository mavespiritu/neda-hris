<?php

namespace App\Http\Controllers\Vacancies;

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
use Illuminate\Support\Arr;
use App\Notifications\Vacancies\NotifyStaffOfVacancyApproval;

class RequirementsController extends Controller
{
    public function index($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $sort      = $request->get('sort');
        $direction = strtolower($request->get('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $search    = $request->input('search', '');

        $sortable = [
            'requirement' => DB::raw('requirement'),      
        ];

        $searchable = [
            'requirement',
        ];

        $filterable = [];
        
        $requirementsQuery = $conn2->table('vacancy_requirements as vr')
            ->select('vr.*')
            ->where('vr.vacancy_id', $id);

        foreach ($filterable as $param => $column) {
            if ($request->filled($param)) {
                $requirementsQuery->where($column, $request->input($param));
            }
        }

        if ($sort && isset($sortable[$sort]) && in_array(strtolower($direction), ['asc', 'desc'])) {
            $requirementsQuery->orderBy($sortable[$sort], $direction);
        }

        $requirements = $requirementsQuery->paginate(20);

        if ($search) {
            $searchLower = strtolower($search);

            $requirements->setCollection(
                $requirements->getCollection()->filter(function ($requirement) use ($searchable, $searchLower) {
                    foreach ($searchable as $field) {
                        if (str_contains(strtolower($requirement->{$field} ?? ''), $searchLower)) {
                            return true;
                        }
                    }
                    return false;
                })->values()
            );

        }

        return response()->json($requirements);
    }

    public function store(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validator = Validator::make($request->all(), [
            'requirement' => 'required',
        ], [
            'requirement.required' => 'The requirement is required.',
        ]);

        $validator->validate();

        try{
            
            $conn2->beginTransaction();

            $conn2->table('vacancy_requirements')
            ->insert([
                'vacancy_id' => $request->vacancy_id,
                'requirement' => $request->requirement,
            ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Requirement saved successfully.'
            ]);

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to save requirement: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving requirement. Please try again.'
            ]);
        }
    }

    public function update($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validator = Validator::make($request->all(), [
            'requirement' => 'required',
        ], [
            'requirement.required' => 'The requirement is required.',
        ]);

        $validator->validate();

        try {

            $conn2->beginTransaction();

            $data = $request->all();

            $conn2->table('vacancy_requirements')
            ->where('id', $id)
            ->update($data);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Requirement updated successfully.'
            ]);

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to update requirement: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating the requirement. Please try again.'
            ]);
        }
    }

    public function destroy($id)
    {
        $conn2 = DB::connection('mysql2');

        try {

            $conn2->beginTransaction();

            $deleted = $conn2->table('vacancy_requirements')->where('id', $id)->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Requirement has been deleted successfully.'
                ]);
            } else {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Requirement not found or already deleted.'
                ]);
            }

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to delete requirement: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the requirement. Please try again.'
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $ids = $request->input('ids');

        try {

            $conn2->beginTransaction();

            $deleted = $conn2->table('vacancy_requirements')->whereIn('id', $request->input('ids'))->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Selected requirements have been deleted successfully.'
                ]);
            } else {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Selected requirements not found or already deleted.'
                ]);
            }
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to delete requirements: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the requirements. Please try again.'
            ]);
        }
    }
}
