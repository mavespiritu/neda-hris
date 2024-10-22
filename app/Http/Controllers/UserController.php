<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function roles()
    {
        $user = Auth::user(); 

        if ($user) {
            $roles = $user->getRoleNames(); 
            return response()->json($roles); 
        }

        return response()->json(['message' => 'User not authenticated'], 401);
    }
}
