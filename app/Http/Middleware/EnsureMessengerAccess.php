<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMessengerAccess
{
    /**
     * Allow messenger access only to accounts with an IPMS ID.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || blank($user->ipms_id ?? null)) {
            abort(403, 'Messenger is only available for staff accounts.');
        }

        return $next($request);
    }
}
