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

class CategoriesController extends Controller
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

        $categories = $conn2->table('travel_order_categories')
            ->orderBy($sortColumn, $direction)
            ->paginate(10);

        return response()->json([
            'data' => [
                'categories' => $categories,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validated = $request->validate([
            'title' => 'required',
        ], [
            'title.required' => 'The title for category field is required.',
        ]);

        try {

            $conn2->beginTransaction();

            $conn2->table('travel_order_categories')->insert([
                'title' => $validated['title'],
            ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Category saved successfully!'
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to save category: ' . $e->getMessage());
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while submitting category. Please try again.'
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

            $conn2->table('travel_order_categories')
            ->where('id', $id)
            ->update([
                'title' => $validated['title'],
            ]);     

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Category updated successfully!',
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to update category: ' . $e->getMessage());
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating category. Please try again.',
            ]);
        }
    }

    public function destroy($id)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $deleted = $conn2->table('travel_order_categories')->where('id', $id)->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Category deleted successfully.'
                ]);
            } else {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Category not found or already deleted.'
                ]);
            }

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error deleting category: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting category. Please try again.'
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $deleted = $conn2->table('travel_order_categories')->whereIn('id', $request->input('ids'))->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Selected categories have been deleted successfully.'
                ]);
            } else {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Selected categories not found or already deleted.'
                ]);
            }

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error bulk deleting categories: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting categories. Please try again.'
            ]);
        }
    }
}
