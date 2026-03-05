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

class VehiclesController extends Controller
{
    public function index(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $sort      = $request->get('sort', 'year');
        $direction = $request->get('direction', 'desc');

         $sortable = [
            'vehicle'      => DB::raw('vehicle'),
            'plate_no' => DB::raw('plate_no'),
            'avg_consumption'  => DB::raw('avg_consumption'),
            'fuel_type'  => DB::raw('fuel_type'),
        ];

        $sortColumn = $sortable[$sort] ?? $sortable['vehicle'];

        $vehicles = $conn2->table('travel_order_vehicles')
            ->orderBy($sortColumn, $direction)
            ->paginate(10);

        return response()->json([
            'data' => [
                'vehicles' => $vehicles,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validated = $request->validate([
            'vehicle' => 'required',
            'plate_no' => 'required',
            'avg_consumption' => 'required',
            'fuel_type' => 'required',
        ], [
            'vehicle.required' => 'The vehicle field is required.',
            'plate_no.required' => 'The plate number field is required.',
            'avg_consumption.required' => 'The average consumption field is required.',
            'fuel_type.required' => 'The fuel type field is required.',
        ]);

        try {

            $conn2->beginTransaction();

            $conn2->table('travel_order_vehicles')
            ->insert([
                'vehicle' => $validated['vehicle'],
                'plate_no' => $validated['plate_no'],
                'avg_consumption' => $validated['avg_consumption'],
                'fuel_type' => $validated['fuel_type'],
            ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vehicle saved successfully!'
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to save vehicle: ' . $e->getMessage());
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while submitting vehicle. Please try again.'
            ]);
        }    
    }

    public function update($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validated = $request->validate([
            'vehicle' => 'required',
            'plate_no' => 'required',
            'avg_consumption' => 'required',
            'fuel_type' => 'required',
        ], [
            'vehicle.required' => 'The vehicle field is required.',
            'plate_no.required' => 'The plate number field is required.',
            'avg_consumption.required' => 'The average consumption field is required.',
            'fuel_type.required' => 'The fuel type field is required.',
        ]);

        try {
            $conn2->beginTransaction();

            $conn2->table('travel_order_vehicles')
            ->where('id', $id)
            ->update([
                'vehicle' => $validated['vehicle'],
                'plate_no' => $validated['plate_no'],
                'avg_consumption' => $validated['avg_consumption'],
                'fuel_type' => $validated['fuel_type'],
            ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vehicle updated successfully!',
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to update vehicle: ' . $e->getMessage());
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating vehicle. Please try again.',
            ]);
        }
    }

    public function destroy($id)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $deleted = $conn2->table('travel_order_vehicles')->where('id', $id)->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Vehicle deleted successfully.'
                ]);
            } else {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Vehicle not found or already deleted.'
                ]);
            }

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error deleting vehicle: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting vehicle. Please try again.'
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $deleted = $conn2->table('travel_order_vehicles')->whereIn('id', $request->input('ids'))->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Selected vehicles have been deleted successfully.'
                ]);
            } else {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Selected vehicles not found or already deleted.'
                ]);
            }

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error bulk deleting vehicles: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting vehicles. Please try again.'
            ]);
        }
    }
}
