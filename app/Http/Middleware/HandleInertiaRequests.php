<?php

namespace App\Http\Middleware;

use App\Traits\BuildsEmployeeNameMap;
use App\Traits\UsesMessengerRedisCache;
use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class HandleInertiaRequests extends Middleware
{
    use BuildsEmployeeNameMap, UsesMessengerRedisCache;

    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $authUser = Auth::guard('web')->user() ?? Auth::guard('applicant')->user();
        $messengerUsers = function () use ($authUser) {
            if (!$authUser || blank($authUser->ipms_id ?? null)) {
                return [];
            }

            $cacheKey = 'messenger:users:' . $authUser->id;

            return $this->messengerCache()->remember($cacheKey, now()->addMinutes(10), function () use ($authUser) {
                $users = User::query()
                    ->select(['id', 'ipms_id', 'email'])
                    ->where('id', '!=', $authUser->id)
                    ->get();

                $employeesById = $this->employeeNamesById($users->pluck('ipms_id'), 'mysql3');

                return $users
                    ->map(fn ($u) => [
                        'id' => (int) $u->id,
                        'ipms_id' => (string) $u->ipms_id,
                        'name' => $this->employeeName($employeesById, $u->ipms_id) ?? (string) $u->email,
                        'email' => (string) ($u->email ?? ''),
                    ])
                    ->sortBy('name')
                    ->values();
            });
        };

        return [
            ...parent::share($request),
            'auth' => [
                'user' => fn () => $authUser ? array_merge(
                    $authUser->only(['id', 'name', 'email', 'last_name', 'first_name', 'middle_name', 'ipms_id','email_verified_at']),
                    $authUser instanceof User ? [
                        'roles' => $authUser->getAllRolesRecursive()->pluck('name')->toArray(),
                        'permissions' => $authUser->getAllPermissionsRecursive()->pluck('name')->toArray(),
                    ] : [
                        'roles' => [],
                        'permissions' => [],
                    ]
                ) : null,
            ],
            'messenger_users' => $messengerUsers,
            'flash' => function () use ($request) {
                // Get all flashed session data
                $flashed = $request->session()->get('_flash.old', []);

                // Laravel doesn’t store flash keys directly; we get values manually
                $all = collect($request->session()->all())
                    ->only($flashed)
                    ->toArray();

                // Fallback if session driver behaves differently
                if (empty($all)) {
                    $all = collect($request->session()->all())
                        ->reject(fn ($_, $key) => str_starts_with($key, '_'))
                        ->toArray();
                }

                return $all;
            },
        ];
    }
}
