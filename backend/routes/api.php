<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Authentication
Route::post('/login', [AuthController::class, 'login']);
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
