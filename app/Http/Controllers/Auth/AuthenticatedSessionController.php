<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        /* $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false)); */

        // attempt employee login first

        if (Auth::guard('web')->attempt($request->only('email', 'password'), $request->boolean('remember'))) {

            $request->session()->regenerate();

            return redirect()->intended(route('dashboard'));

        }

        // if employee login failed, try applicant login

        if (Auth::guard('applicant')->attempt($request->only('email', 'password'), $request->boolean('remember'))) {

            $request->session()->regenerate();

            return redirect()->intended(route('dashboard'));
            
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        if (Auth::guard('web')->check()) {

            Auth::guard('web')->logout();

        } elseif (Auth::guard('applicant')->check()) {

            Auth::guard('applicant')->logout();
            
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
