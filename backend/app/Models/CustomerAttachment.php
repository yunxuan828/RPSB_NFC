<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CustomerAttachment extends Model
{
    protected $fillable = [
        'customer_id',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
        'note',
        'created_by',
        'employee_id'
    ];

    protected $appends = ['url'];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function getUrlAttribute()
    {
        return Storage::url($this->file_path);
    }
}
