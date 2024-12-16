<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

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
        return [
            ...parent::share($request),
            'auth' => [
                'user' => fn () => $request->user() ? array_merge(
                    $request->user()->toArray(),
                    [
                        'roles' => $request->user()->roles->pluck('name')->toArray(), 
                    ],
                    [
                        'permissions' => $request->user()->getAllPermissions()->pluck('name')->toArray(),
                    ]
                ) : null,
            ],
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
                'title' => fn () => $request->session()->get('title'),
                'message' => fn () => $request->session()->get('message')
            ],
        ];
    }
}
