<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\NamecardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Authentication
Route::post('/login', [AuthController::class, 'login']); // Admin Login
Route::post('/employee/login', [AuthController::class, 'employeeLogin']); // Employee Login
Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/setup-admin', [AuthController::class, 'setupAdmin']); // Run this once to create user

// Dashboard
Route::get('/dashboard', [DashboardController::class, 'stats']);
Route::post('/cards/written', [DashboardController::class, 'incrementCardCount']);

// Companies
Route::get('/companies', [CompanyController::class, 'index']);
Route::post('/companies', [CompanyController::class, 'store']);
Route::put('/companies/{id}', [CompanyController::class, 'update']);
Route::delete('/companies/{id}', [CompanyController::class, 'destroy']);

// Users / Employees
Route::get('/users', [EmployeeController::class, 'index']);
Route::get('/users/{id}', [EmployeeController::class, 'show']);
Route::post('/users', [EmployeeController::class, 'store']);
Route::put('/users/{id}', [EmployeeController::class, 'update']);
Route::delete('/users/{id}', [EmployeeController::class, 'destroy']);

// CRM Module
Route::middleware('auth:web,employee')->group(function () {
    Route::group(['prefix' => 'crm'], function () {
        // Namecard Scanning
        Route::post('/namecards/scan', [NamecardController::class, 'scan']);

        // Customers
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::get('/customers/{id}', [CustomerController::class, 'show']);
        Route::put('/customers/{id}', [CustomerController::class, 'update']);
        Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);

        // Events
        Route::get('/customers/{id}/events', [CustomerController::class, 'listEvents']);
        Route::post('/customers/{id}/events', [CustomerController::class, 'storeEvent']);
        Route::put('/events/{eventId}', [CustomerController::class, 'updateEvent']);
        Route::delete('/events/{eventId}', [CustomerController::class, 'deleteEvent']);
    });
});
