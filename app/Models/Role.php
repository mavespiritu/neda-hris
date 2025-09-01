<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    use HasFactory;

    protected $connection = 'mysql4';

    public function parents()
    {
        return $this->belongsToMany(Role::class, 'role_hierarchy', 'child_id', 'parent_id');
    }

    public function children()
    {
        return $this->belongsToMany(Role::class, 'role_hierarchy', 'parent_id', 'child_id');
    }

    public function allPermissionsRecursive()
    {
        $permissions = $this->permissions;
        foreach ($this->children as $child) {
            $permissions = $permissions->merge($child->allPermissionsRecursive());
        }
        return $permissions->unique('id');
    }
}
