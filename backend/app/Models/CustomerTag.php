<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerTag extends Model
{
    protected $fillable = ['name', 'color', 'created_by'];

    public function customers()
    {
        return $this->belongsToMany(Customer::class, 'customer_customer_tag', 'tag_id', 'customer_id');
    }
}
