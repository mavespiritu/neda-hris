<?php

use Illuminate\Support\Facades\Route;
use App\Actions\Psgc\ListProvinces;
use App\Actions\Psgc\ListDistricts;
use App\Actions\Psgc\ListCitiesMunicipalities;
use App\Actions\Psgc\ListBarangays;
use App\Actions\Psgc\ShowDistrict;
use App\Actions\Psgc\ShowProvince;
use App\Actions\Psgc\ShowCityMunicipality;
use App\Actions\Psgc\ShowBarangay;

Route::prefix('psgc')->middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/provinces', ListProvinces::class)->name('psgc.provinces');
    Route::get('/districts', ListDistricts::class)->name('psgc.districts');

    Route::get('/cities-municipalities', ListCitiesMunicipalities::class)
        ->name('psgc.cities-municipalities');

    Route::get('/barangays/{cityMunCode}', ListBarangays::class)
        ->name('psgc.barangays');

    Route::get('/districts/{provinceCode}', ShowDistrict::class)
        ->name('psgc.district.show');

    Route::get('/provinces/{provinceCode}', ShowProvince::class)
        ->name('psgc.province.show');

    Route::get('/cities-municipalities/{cityMunCode}', ShowCityMunicipality::class)
        ->name('psgc.city-municipality.show');

    Route::get('/barangays/{barangayCode}', ShowBarangay::class)
        ->name('psgc.barangay.show');
});
