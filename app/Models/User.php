<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Traits\HasRoles;
use App\Notifications\CompetenciesForReviewSubmitted;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    use HasRoles {
        HasRoles::hasPermissionTo as protected spatieHasPermissionTo;
        HasRoles::hasRole as protected spatieHasRole;
    }

    protected $connection = 'mysql4';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function sendCompetencyForReviewSubmissionNotification($staff)
    {
        $this->notify(new CompetenciesForReviewSubmitted($staff));
    }

    public function sendCompetencyForReviewApprovalNotification($staff)
    {
        $this->notify(new CompetenciesForReviewApproved($staff));
    }

    public function getAllRolesRecursive()
    {
        $roles = collect();

        foreach ($this->roles as $role) {
            $roles = $roles->merge($this->getRoleWithChildren($role));
        }

        return $roles->unique('id');
    }

    protected function getRoleWithChildren($role)
    {
        $roles = collect([$role]);
        foreach ($role->children as $child) {
            $roles = $roles->merge($this->getRoleWithChildren($child));
        }
        return $roles;
    }

    public function getAllPermissionsRecursive()
    {
        $permissions = collect();

        // Direct permissions of user
        $permissions = $permissions->merge($this->permissions);

        // Permissions from recursive roles
        foreach ($this->getAllRolesRecursive() as $role) {
            if (method_exists($role, 'allPermissionsRecursive')) {
                $permissions = $permissions->merge($role->allPermissionsRecursive());
            } else {
                $permissions = $permissions->merge($role->permissions);
            }
        }

        return $permissions->unique('id');
    }

    public function hasRole($roles, $guard = null): bool
    {
        $roles = is_array($roles) ? $roles : [$roles];

        return $this->getAllRolesRecursive()
                    ->pluck('name')
                    ->intersect($roles)
                    ->isNotEmpty();
    }

    public function hasAnyRole($roles, $guard = null): bool
    {
        $roles = is_array($roles) ? $roles : [$roles];

        foreach ($roles as $role) {
            if ($this->hasRole($role, $guard)) {
                return true;
            }
        }

        return false;
    }

    public function hasPermissionTo($permission, $guardName = null): bool
    {
        if ($this->spatieHasPermissionTo($permission, $guardName)) {
            return true;
        }

        foreach ($this->roles as $role) {
            if ($role->allPermissionsRecursive()->contains('name', $permission)) {
                return true;
            }
        }

        return false;
    }
}
