<?php

namespace App\Exceptions;

use Exception;

class NotFoundException extends Exception
{
    public function render()
    {
        return response()->json([
            'success' => false,
            'message' => $this->message ?: 'Data not found',
        ], 404);
    }
}
