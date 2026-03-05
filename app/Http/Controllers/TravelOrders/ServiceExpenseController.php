<?php

namespace App\Http\Controllers\TravelOrders;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ServiceExpenseController extends Controller
{

    public function index($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $vehicles = $conn2->table('travel_order_vehicles')
            ->select(['id', 'vehicle', 'plate_no', 'avg_consumption'])
            ->orderBy('vehicle')
            ->get();

        $serviceExpenses = $conn2->table('travel_order_service_expenses as se')
            ->select([
                'se.id',
                'se.travel_order_id',
                'se.driver',
                'se.vehicle_id',
                'se.total_km',
                'se.total_gas',
                'se.gas_price',
                'se.toll_fee',
                'se.tev',
            ])
            ->where('se.travel_order_id', (int) $id)
            ->orderBy('se.id', 'desc')
            ->get();

        $driverIds = $serviceExpenses
        ->pluck('driver')
        ->filter()
        ->unique()
        ->values();

        $drivers = $conn3->table('tblemployee')
        ->select([
            'emp_id',
            DB::raw('concat(lname, ", ", fname, " ", mname) as name')
        ])
        ->whereIn('emp_id', $driverIds)
        ->get()
        ->keyBy('emp_id');

        $serviceExpenses = $serviceExpenses->map(function ($se) use ($drivers) {
            $se->driver_name = $drivers[$se->driver]->name ?? null;
            return $se;
        });

        return response()->json([
            'vehicles' => $vehicles,
            'service_expenses' => $serviceExpenses,
        ]);
    }

    public function store(Request $request, $id)
    {
        $conn2 = DB::connection('mysql2');

        $validated = $request->validate([
            'driver'     => ['required'],
            'vehicle_id' => ['required', 'integer'],
            'total_km'   => ['required', 'numeric', 'min:0'],
            'gas_price'  => ['required', 'numeric', 'min:0'],
            'toll_fee'   => ['nullable', 'numeric', 'min:0'],
            'tev'        => ['nullable', 'numeric', 'min:0'],
        ]);

        // Ensure vehicle exists + has valid avg_consumption
        $vehicle = $conn2->table('travel_order_vehicles')
            ->select(['id', 'avg_consumption'])
            ->where('id', (int) $validated['vehicle_id'])
            ->first();

        if (!$vehicle || !$vehicle->avg_consumption || $vehicle->avg_consumption <= 0) {
            return back()->withErrors(['vehicle_id' => 'Invalid vehicle / avg consumption.']);
        }

        // total_gas = total_km * 2 / avg_consumption
        $totalGas = ($validated['total_km'] * 2) / $vehicle->avg_consumption;

        $payload = [
            'travel_order_id' => (int) $id,
            'driver'          => (string) $validated['driver'],
            'vehicle_id'      => (int) $validated['vehicle_id'],
            'total_km'        => (float) $validated['total_km'],
            'total_gas'       => (float) $totalGas,
            'gas_price'       => (float) $validated['gas_price'],
            'toll_fee'        => (float) ($validated['toll_fee'] ?? 0),
            'tev'             => (float) ($validated['tev'] ?? 0),
            'created_by'      => auth()->user()->ipms_id,
        ];

        // If your table has timestamps, keep these. If not, delete these two lines.
        if ($this->tableHasTimestamps($conn2, 'travel_order_service_expenses')) {
            $payload['created_at'] = now();
            $payload['updated_at'] = now();
        }

        $conn2->table('travel_order_service_expenses')->insert($payload);

        return back()->with([
            'status'  => 'success',
            'title'   => 'Saved',
            'message' => 'Service vehicle expense item added.',
        ]);
    }

    public function update(Request $request, $id, $expenseId)
    {
        $conn2 = DB::connection('mysql2');

        $validated = $request->validate([
            'vehicle_id' => ['required', 'integer'],
            'driver'     => ['required'],
            'total_km'   => ['required', 'numeric', 'min:0'],
            'gas_price'  => ['required', 'numeric', 'min:0'],
            'toll_fee'   => ['nullable', 'numeric', 'min:0'],
            'tev'        => ['nullable', 'numeric', 'min:0'],
        ]);

        // Ensure expense belongs to this travel order
        $exists = $conn2->table('travel_order_service_expenses')
            ->where('id', (int) $expenseId)
            ->where('travel_order_id', (int) $id)
            ->exists();

        if (!$exists) {
            return back()->withErrors(['service_expense' => 'Service expense item not found.']);
        }

        // Ensure vehicle exists + has valid avg_consumption
        $vehicle = $conn2->table('travel_order_vehicles')
            ->select(['id', 'avg_consumption'])
            ->where('id', (int) $validated['vehicle_id'])
            ->first();

        if (!$vehicle || !$vehicle->avg_consumption || $vehicle->avg_consumption <= 0) {
            return back()->withErrors(['vehicle_id' => 'Invalid vehicle / avg consumption.']);
        }

        $totalGas = ($validated['total_km'] * 2) / $vehicle->avg_consumption;

        $update = [
            'driver'     => (string) $validated['driver'],
            'vehicle_id' => (int) $validated['vehicle_id'],
            'total_km'   => (float) $validated['total_km'],
            'total_gas'  => (float) $totalGas,
            'gas_price'  => (float) $validated['gas_price'],
            'toll_fee'   => (float) ($validated['toll_fee'] ?? 0),
            'tev'        => (float) ($validated['tev'] ?? 0),
            'updated_by' => auth()->user()->ipms_id,
        ];

        if ($this->tableHasTimestamps($conn2, 'travel_order_service_expenses')) {
            $update['updated_at'] = now();
        }

        $conn2->table('travel_order_service_expenses')
            ->where('id', (int) $expenseId)
            ->where('travel_order_id', (int) $id)
            ->update($update);

        return back()->with([
            'status'  => 'success',
            'title'   => 'Updated',
            'message' => 'Service vehicle expense item updated.',
        ]);
    }

    public function destroy($id, $expenseId)
    {
        $conn2 = DB::connection('mysql2');

        // Ensure expense exists for this travel order
        $expense = $conn2->table('travel_order_service_expenses')
            ->where('id', (int) $expenseId)
            ->where('travel_order_id', (int) $id)
            ->first();

        if (!$expense) {
            return back()->withErrors(['service_expense' => 'Service expense item not found.']);
        }

        // ✅ Enforce "at least 1 entry"
        $count = $conn2->table('travel_order_service_expenses')
            ->where('travel_order_id', (int) $id)
            ->count();

        if ($count <= 1) {
            return back()->withErrors([
                'service_expense' => 'At least one Service Vehicle Expense entry is required.',
            ]);
        }

        $conn2->table('travel_order_service_expenses')
            ->where('id', (int) $expenseId)
            ->where('travel_order_id', (int) $id)
            ->delete();

        return back()->with([
            'status'  => 'success',
            'title'   => 'Deleted',
            'message' => 'Service vehicle expense item deleted.',
        ]);
    }

    /**
     * Tiny helper so your insert/update won't break if the table doesn't have timestamps.
     * If you KNOW you don't have created_at/updated_at, you can remove all timestamp logic.
     */
    private function tableHasTimestamps($conn, string $table): bool
    {
        try {
            $cols = $conn->getSchemaBuilder()->getColumnListing($table);
            return in_array('created_at', $cols, true) && in_array('updated_at', $cols, true);
        } catch (\Throwable $e) {
            return false;
        }
    }
}
