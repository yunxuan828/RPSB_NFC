<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\CrmEmailCampaign;
use App\Services\Crm\CampaignService;
use Illuminate\Http\Request;

class EmailCampaignController extends Controller
{
    protected $service;

    public function __construct(CampaignService $service)
    {
        $this->service = $service;
    }

    public function index()
    {
        return CrmEmailCampaign::with('template')->orderBy('id', 'desc')->paginate(20);
    }

    public function preview(Request $request)
    {
        $criteria = $request->validate([
            'status' => 'nullable|array',
            'tags' => 'nullable|array',
            'search' => 'nullable|string'
        ]);

        $query = $this->service->buildAudienceQuery($criteria);
        $count = $query->count();
        // Limit sample to 20
        $sample = $query->limit(20)->get();

        return response()->json([
            'count' => $count,
            'sample' => $sample,
            'criteria' => $criteria
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'template_id' => 'required|exists:crm_email_templates,id',
            'name' => 'required|string',
            'audience_snapshot' => 'required|array'
        ]);

        return $this->service->createCampaign($data, $request->user()->id);
    }

    public function show($id)
    {
        return CrmEmailCampaign::with(['template'])->findOrFail($id);
    }
    
    public function recipients(Request $request, $id)
    {
        $campaign = CrmEmailCampaign::findOrFail($id);
        $query = $campaign->recipients()->with('customer');
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        return $query->paginate(20);
    }

    public function send(Request $request, $id)
    {
        return $this->service->sendCampaign($id);
    }
}
