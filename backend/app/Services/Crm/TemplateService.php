<?php

namespace App\Services\Crm;

use App\Models\CrmEmailTemplate;

class TemplateService
{
    public function createTemplate(array $data, $userId)
    {
        $data['template_code'] = $this->generateCode();
        $data['created_by'] = $userId;
        $data['status'] = 'draft';
        return CrmEmailTemplate::create($data);
    }

    public function updateTemplate(CrmEmailTemplate $template, array $data, $userId)
    {
        if ($template->status === 'locked') {
            throw new \Exception("Cannot edit a locked template.");
        }
        $data['updated_by'] = $userId;
        $template->update($data);
        return $template;
    }

    public function duplicateTemplate($id, $userId)
    {
        $original = CrmEmailTemplate::findOrFail($id);
        
        // Exclude system fields
        $newData = $original->replicate(['id', 'template_code', 'status', 'locked_at', 'created_at', 'updated_at', 'created_by', 'updated_by'])->toArray();
        
        $newData['template_code'] = $this->generateCode();
        $newData['name'] = $original->name . ' (Copy)';
        $newData['status'] = 'draft';
        $newData['created_by'] = $userId;
        $newData['variables'] = $original->variables; // Explicitly copy if needed, though toArray handles it if cast correctly

        return CrmEmailTemplate::create($newData);
    }

    private function generateCode()
    {
        // ET-202602-00001
        $prefix = 'ET-' . date('Ym') . '-';
        $last = CrmEmailTemplate::where('template_code', 'like', $prefix . '%')->orderBy('id', 'desc')->first();
        $num = $last ? intval(substr($last->template_code, -5)) + 1 : 1;
        return $prefix . str_pad($num, 5, '0', STR_PAD_LEFT);
    }
}
