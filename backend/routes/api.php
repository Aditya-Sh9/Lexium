<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProviderController;
use App\Http\Controllers\CitizenController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Middleware\AdminAuthMiddleware;

// ── Public routes ────────────────────────────────────────────────
Route::get('/providers', [ProviderController::class, 'index']);
Route::get('/providers/{id}', [ProviderController::class, 'show']);
Route::get('/categories', [ProviderController::class, 'categories']);

// ── Admin Auth (bypasses Firebase — direct MongoDB check) ────────
Route::post('/admin/login', [AuthController::class, 'adminLogin']);

// ── Firebase Protected Routes ────────────────────────────────────
Route::middleware('firebase.auth')->group(function () {

    // Auth Synchronization & Status
    Route::post('/auth/sync', [AuthController::class, 'sync']);
    Route::get('/auth/status', [AuthController::class, 'getStatus']);

    // ── Provider Routes ──────────────────────────────────────────
    Route::prefix('provider')->group(function () {
        Route::get('/dashboard',  [ProviderController::class, 'dashboard']);
        Route::get('/docket',     [ProviderController::class, 'docket']);
        Route::get('/ledger',     [ProviderController::class, 'ledger']);
        Route::get('/eminence',   [ProviderController::class, 'eminence']);
        Route::get('/profile',    [ProviderController::class, 'profile']);
        Route::put('/profile',    [ProviderController::class, 'updateProfile']);

        // Petition actions
        Route::post('/petitions/{id}/accept',  [ProviderController::class, 'acceptPetition']);
        Route::post('/petitions/{id}/decline', [ProviderController::class, 'declinePetition']);
        Route::put('/petitions/{id}/status',   [ProviderController::class, 'updatePetitionStatus']);

        // Appointment actions
        Route::post('/appointments/{id}/accept',   [ProviderController::class, 'acceptAppointment']);
        Route::post('/appointments/{id}/decline',  [ProviderController::class, 'declineAppointment']);
        Route::put('/appointments/{id}/complete',  [ProviderController::class, 'completeAppointment']);

        // Transaction actions
        Route::delete('/transactions/{id}', [ProviderController::class, 'deleteTransaction']);
    });

    // ── Citizen Routes ───────────────────────────────────────────
    Route::prefix('citizen')->group(function () {
        Route::get('/dashboard',  [CitizenController::class, 'dashboard']);
        Route::get('/petitions',  [CitizenController::class, 'petitions']);
        Route::get('/history',    [CitizenController::class, 'history']);

        Route::post('/petitions',        [CitizenController::class, 'createPetition']);
        Route::delete('/petitions/{id}', [CitizenController::class, 'withdrawPetition']);

        Route::post('/appointments',                   [CitizenController::class, 'createAppointment']);
        Route::put('/appointments/{id}/reschedule',    [CitizenController::class, 'rescheduleAppointment']);
        Route::delete('/appointments/{id}',            [CitizenController::class, 'cancelAppointment']);
        Route::post('/appointments/{id}/review',       [CitizenController::class, 'submitReview']);
    });
});

// ── Admin Routes (protected by admin token check) ────────────────
Route::middleware([AdminAuthMiddleware::class])->prefix('admin')->group(function () {
    Route::get('/dashboard',               [AdminController::class, 'dashboard']);
    Route::get('/providers',               [AdminController::class, 'providers']);
    Route::get('/providers/{id}/stats',    [AdminController::class, 'providerStats']);
    Route::post('/providers/{id}/approve', [AdminController::class, 'approveProvider']);
    Route::post('/providers/{id}/reject',  [AdminController::class, 'rejectProvider']);
    Route::post('/providers/{id}/award',   [AdminController::class, 'awardProvider']);
    Route::get('/users',                   [AdminController::class, 'users']);
    Route::delete('/users/{id}',           [AdminController::class, 'deleteUser']);
    Route::delete('/providers/{id}',       [AdminController::class, 'deleteProvider']);
    Route::get('/leaderboard',             [AdminController::class, 'leaderboard']);
});

// ── Public Leaderboard (accessible by provider dashboards) ───────
Route::get('/leaderboard', [AdminController::class, 'leaderboard']);
