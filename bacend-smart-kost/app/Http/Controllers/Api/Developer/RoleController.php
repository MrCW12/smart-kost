<?php

namespace App\Http\Controllers\Api\Developer;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::orderBy('id')->get(['id', 'name']);

        return $this->success($roles);
    }
}
