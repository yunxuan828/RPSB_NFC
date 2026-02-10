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

        // Customer Tags
        Route::get('/tags', [\App\Http\Controllers\CustomerTagController::class, 'index']);
        Route::post('/tags', [\App\Http\Controllers\CustomerTagController::class, 'store']);
        Route::post('/customers/{id}/tags', [\App\Http\Controllers\CustomerTagController::class, 'attach']);
        Route::delete('/customers/{id}/tags/{tagId}', [\App\Http\Controllers\CustomerTagController::class, 'detach']);

        // Customer Comments
        Route::get('/customers/{id}/comments', [\App\Http\Controllers\CustomerCommentController::class, 'index']);
        Route::post('/customers/{id}/comments', [\App\Http\Controllers\CustomerCommentController::class, 'store']);
        Route::delete('/comments/{commentId}', [\App\Http\Controllers\CustomerCommentController::class, 'destroy']);

        // Customer Attachments
        Route::get('/customers/{id}/attachments', [\App\Http\Controllers\CustomerAttachmentController::class, 'index']);
        Route::post('/customers/{id}/attachments', [\App\Http\Controllers\CustomerAttachmentController::class, 'store']);
        Route::delete('/attachments/{attachmentId}', [\App\Http\Controllers\CustomerAttachmentController::class, 'destroy']);

        // Customer Activities
        Route::get('/customers/{id}/activities', [\App\Http\Controllers\CustomerActivityController::class, 'index']);

        // Events
        Route::get('/customers/{id}/events', [CustomerController::class, 'listEvents']);
        Route::post('/customers/{id}/events', [CustomerController::class, 'storeEvent']);
        Route::put('/events/{eventId}', [CustomerController::class, 'updateEvent']);
        Route::delete('/events/{eventId}', [CustomerController::class, 'deleteEvent']);

        // Email Module
        Route::group(['prefix' => 'email'], function () {
            // Templates
            Route::get('/templates', [\App\Http\Controllers\Crm\EmailTemplateController::class, 'index']);
            Route::post('/templates', [\App\Http\Controllers\Crm\EmailTemplateController::class, 'store']);
            Route::get('/templates/{id}', [\App\Http\Controllers\Crm\EmailTemplateController::class, 'show']);
            Route::put('/templates/{id}', [\App\Http\Controllers\Crm\EmailTemplateController::class, 'update']);
            Route::post('/templates/{id}/duplicate', [\App\Http\Controllers\Crm\EmailTemplateController::class, 'duplicate']);

            // Campaigns
            Route::get('/campaigns', [\App\Http\Controllers\Crm\EmailCampaignController::class, 'index']);
            Route::post('/campaigns', [\App\Http\Controllers\Crm\EmailCampaignController::class, 'store']);
            Route::get('/campaigns/{id}', [\App\Http\Controllers\Crm\EmailCampaignController::class, 'show']);
            Route::get('/campaigns/{id}/recipients', [\App\Http\Controllers\Crm\EmailCampaignController::class, 'recipients']);
            Route::post('/campaigns/preview', [\App\Http\Controllers\Crm\EmailCampaignController::class, 'preview']);
            Route::post('/campaigns/{id}/send', [\App\Http\Controllers\Crm\EmailCampaignController::class, 'send']);
        });
    });
});
