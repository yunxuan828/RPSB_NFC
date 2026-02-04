<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'full_name',
        'customer_company_name',
        'job_title',
        'email',
        'phone',
        'whatsapp',
        'address',
        'website',
        'birthday',
        'status',
        'created_by',
        'collected_by_employee_id',
    ];

    protected $casts = [
        'birthday' => 'date',
    ];

    public function namecards()
    {
        return $this->hasMany(CustomerNamecard::class);
    }

    public function events()
    {
        return $this->hasMany(CustomerEvent::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function collectedBy()
    {
        return $this->belongsTo(Employee::class, 'collected_by_employee_id');
    }
}
