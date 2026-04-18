<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Actions\TravelRequests\ListTravelRequests;
use App\Actions\TravelRequests\CreateTravelRequest;
use App\Actions\TravelRequests\StoreTravelRequest;
use App\Actions\TravelRequests\EditTravelRequest;
use App\Actions\TravelRequests\UpdateTravelRequest;
use App\Actions\TravelRequests\ShowTravelRequest;
use App\Actions\TravelRequests\GenerateTravelRequestReport;
use App\Actions\TravelRequests\SignTravelRequestReport;
use App\Actions\TravelRequests\SubmitTravelRequest;
use App\Actions\TravelRequests\DeleteTravelRequest;
use App\Actions\TravelRequests\BulkDeleteTravelRequests;
use App\Actions\TravelRequests\ReturnTravelRequest;
use App\Actions\TravelRequests\ResubmitTravelRequest;
use App\Actions\TravelRequests\ResendTravelRequestNotification;
use App\Actions\VehicleRequests\StoreVehicleExpense;
use App\Actions\VehicleRequests\UpdateVehicleExpense;
use App\Actions\VehicleRequests\DeleteVehicleExpense;
use App\Actions\VehicleRequests\ReturnVehicleRequest;
use App\Actions\VehicleRequests\ResubmitVehicleRequest;
use App\Actions\VehicleRequests\ReviewVehicleRequest;
use App\Actions\VehicleRequests\EndorseVehicleRequestViaEmail;
use App\Actions\VehicleRequests\ApproveVehicleRequestViaEmail;
use App\Actions\VehicleRequests\AuthorizeVehicleRequestViaEmail;
use App\Actions\VehicleRequests\SubmitVehicleRequest;
use App\Actions\VehicleRequests\EndorseVehicleRequest;
use App\Actions\VehicleRequests\ApproveVehicleRequest;
use App\Actions\VehicleRequests\AuthorizeVehicleRequest;
use App\Actions\VehicleRequests\DisapproveVehicleRequest;
use App\Actions\TravelRequests\ListTripTicketsData;
use App\Actions\TravelRequests\CreateTripTicket;
use App\Actions\TravelRequests\StoreTripTicket;
use App\Actions\TravelRequests\EditTripTicket;
use App\Actions\TravelRequests\UpdateTripTicket;
use App\Actions\TravelRequests\DeleteTripTicket;
use App\Actions\TravelRequests\BulkDeleteTripTickets;
use App\Actions\TravelRequests\GenerateTripTicketReport;
use App\Actions\TripTickets\ListTripTickets;
use App\Actions\TripTickets\CompleteTrip;
use App\Actions\TripTickets\StoreCompleteTrip;
use App\Actions\TripTickets\CheckDriverSchedule;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {

    Route::get('/travel-requests', [ListTravelRequests::class, 'asController'])->name('travel-requests.index');

    Route::get('/travel-requests/create', CreateTravelRequest::class)->name('travel-requests.create');
    Route::post('/travel-requests/store', StoreTravelRequest::class)->name('travel-requests.store');
    Route::get('/travel-requests/{id}/edit', EditTravelRequest::class)->name('travel-requests.edit');
    Route::put('/travel-requests/{id}/update', UpdateTravelRequest::class)->name('travel-requests.update');
    Route::get('/travel-requests/{id}', [ShowTravelRequest::class, 'asController'])->name('travel-requests.show');
    Route::delete('/travel-requests/{id}/destroy', DeleteTravelRequest::class)->name('travel-requests.destroy');
    Route::post('/travel-requests/bulk-destroy', BulkDeleteTravelRequests::class)->name('travel-requests.bulk-destroy');
    Route::get('/travel-requests/{id}/report', GenerateTravelRequestReport::class)->name('travel-requests.generate');
    Route::post('/travel-requests/{id}/report/sign', SignTravelRequestReport::class)->name('travel-requests.report.sign');
    Route::post('/travel-requests/{id}/submit', SubmitTravelRequest::class)->name('travel-requests.submit');
    Route::post('/travel-requests/{id}/return', ReturnTravelRequest::class)->name('travel-requests.return');
    Route::post('/travel-requests/{id}/resubmit', ResubmitTravelRequest::class)->name('travel-requests.resubmit');
    Route::post('/travel-requests/{id}/notifications/resend', ResendTravelRequestNotification::class)->name('travel-requests.notifications.resend');
    
    Route::post('/travel-requests/{id}/service-expense', StoreVehicleExpense::class)->name('travel-requests.service-expense.store');
    Route::put('/travel-requests/{id}/service-expense/{expenseId}', UpdateVehicleExpense::class)->name('travel-requests.service-expense.update');
    Route::delete('/travel-requests/{id}/service-expense/{expenseId}', DeleteVehicleExpense::class)->name('travel-requests.service-expense.destroy');

    Route::post('/vehicle-requests/{id}/submit', SubmitVehicleRequest::class)->name('vehicle-requests.submit');
    Route::post('/vehicle-requests/{id}/endorse', EndorseVehicleRequest::class)->name('vehicle-requests.endorse');
    Route::post('/vehicle-requests/{id}/approve', ApproveVehicleRequest::class)->name('vehicle-requests.approve');
    Route::post('/vehicle-requests/{id}/return', ReturnVehicleRequest::class)->name('vehicle-requests.return');
    Route::post('/vehicle-requests/{id}/resubmit', ResubmitVehicleRequest::class)->name('vehicle-requests.resubmit');
    Route::post('/vehicle-requests/{id}/review', ReviewVehicleRequest::class)->name('vehicle-requests.review');
    Route::post('/vehicle-requests/{id}/authorize', AuthorizeVehicleRequest::class)->name('vehicle-requests.authorize');
    Route::post('/vehicle-requests/{id}/disapprove', DisapproveVehicleRequest::class)->name('vehicle-requests.disapprove');

    Route::get('/trip-tickets', ListTripTickets::class)->name('trip-tickets.index');
    Route::get('/trip-tickets/data', ListTripTicketsData::class)->name('trip-tickets.index.data');

    Route::get('/trip-tickets/{id}', ListTripTickets::class)
        ->whereNumber('id')
        ->name('trip-tickets.index.by-id');

    Route::get('/trip-tickets/{id}/data', ListTripTicketsData::class)
        ->whereNumber('id')
        ->name('trip-tickets.index.data.by-id');

    Route::get('/trip-tickets/create', CreateTripTicket::class)->name('trip-tickets.create');
    Route::post('/trip-tickets/store', StoreTripTicket::class)->name('trip-tickets.store');

    Route::get('/trip-tickets/{id}/create', CreateTripTicket::class)
        ->whereNumber('id')
        ->name('trip-tickets.create.by-id');

    Route::post('/trip-tickets/{id}/store', StoreTripTicket::class)
        ->whereNumber('id')
        ->name('trip-tickets.store.by-id');

    Route::get('/trip-tickets/{id}/edit', EditTripTicket::class)->name('trip-tickets.edit');
    Route::put('/trip-tickets/{id}/update', UpdateTripTicket::class)->name('trip-tickets.update');
    Route::delete('/trip-tickets/{id}/destroy', DeleteTripTicket::class)->name('trip-tickets.destroy');
    Route::post('/trip-tickets/bulk-destroy', BulkDeleteTripTickets::class)->name('trip-tickets.bulk-destroy');
    Route::get('/trip-tickets/{id}/report', GenerateTripTicketReport::class)->name('trip-tickets.generate');

    Route::get('/trip-tickets/{id}/complete', CompleteTrip::class)->name('trip-tickets.complete.form');
    Route::post('/trip-tickets/{id}/complete', StoreCompleteTrip::class)->name('trip-tickets.complete');

    Route::get('/trip-tickets/check-driver-schedule', CheckDriverSchedule::class)
        ->name('trip-ticket.check-driver-schedule');
});

Route::middleware(['web', 'signed'])->group(function () {
    Route::get('/vehicle-requests/endorse/{token}', EndorseVehicleRequestViaEmail::class)->name('vehicle-requests.endorse.email');
    Route::get('/vehicle-requests/approve/{token}', ApproveVehicleRequestViaEmail::class)->name('vehicle-requests.approve.email');
    Route::get('/vehicle-requests/authorize/{token}', AuthorizeVehicleRequestViaEmail::class)->name('vehicle-requests.authorize.email');

});








