<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerComment extends Model
{
    protected $fillable = [
        'customer_id',
        'body',
        'created_by',
        'employee_id'
    ];

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
}
