<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class HandleInertiaRequests extends Middleware
{
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

        return [
            ...parent::share($request),
            'auth' => [
                'user' => fn () => $authUser ? array_merge(
                    $authUser->only(['id', 'name', 'email', 'last_name', 'first_name', 'middle_name', 'ipms_id']),
                    $authUser instanceof User ? [
                        'roles' => $authUser->getAllRolesRecursive()->pluck('name')->toArray(),
                        'permissions' => $authUser->getAllPermissionsRecursive()->pluck('name')->toArray(),
                    ] : [
                        'roles' => [],
                        'permissions' => [],
                    ]
                ) : null,
            ],
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
