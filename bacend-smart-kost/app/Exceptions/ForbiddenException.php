<?php

namespace App\Exceptions;

use Exception;

class ForbiddenException extends Exception
{
    public function render()
    {
        return response()->json([
            'success' => false,
            'message' => $this->message ?: 'Unauthorized access',
        ], 403);
    }
}
