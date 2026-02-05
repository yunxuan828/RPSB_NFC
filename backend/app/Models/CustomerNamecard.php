<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerNamecard extends Model
{
    protected $fillable = [
        'customer_id',
        'front_image_path',
        'back_image_path',
        'ocr_raw_text_front',
        'ocr_raw_text_back',
        'ocr_json',
        'created_by',
        'collected_by_employee_id',
    ];

    protected $casts = [
        'ocr_json' => 'array',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
