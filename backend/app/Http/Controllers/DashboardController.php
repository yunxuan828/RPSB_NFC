<?php

namespace App\Http\Controllers;


use App\Models\Company;
use App\Models\Employee;
use App\Models\CardActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats()
    {
        $totalCompanies = Company::count();
        $totalUsers = Employee::where('status', 'active')->count();
        
        // System stats provided legacy total, we can keep using it or switch to counting logs.
        // For consistency with legacy data, we keep legacy counter but augment it with logs.
        $cardStat = DB::table('system_stats')->where('key', 'total_cards_written')->first();
        $totalCardsWritten = $cardStat ? (int)$cardStat->value : 0;

        return response()->json([
            'totalUsers' => $totalUsers,
            'totalCompanies' => $totalCompanies,
            'totalCardsWritten' => $totalCardsWritten,
            'charts' => [
                'weeklyCards' => $this->getWeeklyCardsData()
            ],
            'activity' => $this->getRecentActivity()
        ]);
    }

    private function getWeeklyCardsData()
    {
        // Fetch logs from the last 7 days
        $logs = CardActivityLog::where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->get()
            ->groupBy(function($date) {
                return Carbon::parse($date->created_at)->format('D'); // Mon, Tue...
            });

        // Structure for the last 7 days
        $days = collect(range(6, 0))->map(function ($daysAgo) use ($logs) {
            $date = now()->subDays($daysAgo);
            $dayName = $date->format('D');
            
            return [
                'name' => $dayName,
                'cards' => isset($logs[$dayName]) ? $logs[$dayName]->count() : 0
            ];
        });

        return $days;
    }

    private function getRecentActivity()
    {
        // Aggregate recent events from Users, Companies, and Card Logs
        $limit = 5;

        $latestCards = CardActivityLog::latest()
            ->take($limit)
            ->get()
            ->map(function ($log) {
                return [
                    'type' => 'card_written',
                    'description' => $log->description ?: "Card written via ACR122U",
                    'time' => $log->created_at->diffForHumans(),
                    'user' => $log->user_id ? "User #{$log->user_id}" : 'System',
                    // Helper for sorting
                    'timestamp' => $log->created_at->timestamp
                ];
            });

        $latestUsers = Employee::with('company')
            ->latest()
            ->take($limit)
            ->get()
            ->map(function ($user) {
                return [
                    'type' => 'user_created',
                    'description' => "New user {$user->full_name} added to {$user->company->name}",
                    'time' => $user->created_at->diffForHumans(),
                    'user' => $user->full_name,
                    'timestamp' => $user->created_at->timestamp
                ];
            });

        $latestCompanies = Company::latest()
            ->take($limit)
            ->get()
            ->map(function ($company) {
                return [
                    'type' => 'company_created',
                    'description' => "New company {$company->name} onboarded",
                    'time' => $company->created_at->diffForHumans(),
                    'user' => 'System',
                    'timestamp' => $company->created_at->timestamp
                ];
            });

        // Merge collections, sort by timestamp desc, and take top 5
        $merged = collect([])
            ->merge($latestCards->toArray())
            ->merge($latestUsers->toArray())
            ->merge($latestCompanies->toArray());
        
        return collect($merged)
            ->sortByDesc('timestamp')
            ->take($limit)
            ->map(function($item) {
                unset($item['timestamp']); // Clean up internal field
                return $item;
            })
            ->values()
            ->all();
    }
    
    public function incrementCardCount(Request $request)
    {
        // Increment global counter
        DB::table('system_stats')
            ->where('key', 'total_cards_written')
            ->increment('value');
            
        // Log individual activity for weekly charts
        // The request might contain user_id if we passed it from frontend.
        $userId = $request->input('user_id');
        $userName = $request->input('user_name', 'Unknown User');
        
        CardActivityLog::create([
            'user_id' => $userId,
            'description' => $userId ? "Card written for {$userName}" : "Card written via ACR122U"
        ]);
        
        return response()->json(['success' => true]);
    }
}