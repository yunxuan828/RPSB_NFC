<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\CrmEmailTemplate;
use App\Services\Crm\TemplateService;
use Illuminate\Http\Request;

class EmailTemplateController extends Controller
{
    protected $service;

    public function __construct(TemplateService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        return CrmEmailTemplate::orderBy('id', 'desc')->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'subject' => 'required|string',
            'body_html' => 'required|string',
            'variables' => 'nullable|array'
        ]);

        return $this->service->createTemplate($data, $request->user()->id);
    }

    public function show($id)
    {
        return CrmEmailTemplate::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $template = CrmEmailTemplate::findOrFail($id);
        
        $data = $request->validate([
            'name' => 'required|string',
            'subject' => 'required|string',
            'body_html' => 'required|string',
            'variables' => 'nullable|array'
        ]);

        return $this->service->updateTemplate($template, $data, $request->user()->id);
    }

    public function duplicate(Request $request, $id)
    {
        return $this->service->duplicateTemplate($id, $request->user()->id);
    }
}
