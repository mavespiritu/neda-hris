<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AccessControl
{
    public function handle($request, Closure $next)
    {
        $controller = $request->route()?->getController();
        $method = $request->route()?->getActionMethod();

        if ($controller && property_exists($controller, 'accessRules')) {
            $rules = $controller->accessRules ?? [];

            if (isset($rules[$method])) {
                $permission = $rules[$method];
                $user = Auth::user();

                // LOGGING
                \Log::info("[AccessControl] User ID: {$user?->id}, Permission Required: {$permission}");

                if (!$user || !$user->can($permission)) {
                    \Log::warning("[AccessControl] Unauthorized access attempt by user ID: {$user?->id}");
                    abort(403, 'Unauthorized.');
                }
            }
        }

        return $next($request);
    }
}
