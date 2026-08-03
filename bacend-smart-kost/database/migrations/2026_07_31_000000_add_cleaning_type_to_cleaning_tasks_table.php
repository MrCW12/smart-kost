<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE cleaning_tasks MODIFY COLUMN type ENUM('cleaning','checkout','periodic','maintenance','request') NOT NULL DEFAULT 'checkout'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE cleaning_tasks MODIFY COLUMN type ENUM('checkout','periodic','maintenance','request') NOT NULL DEFAULT 'checkout'");
    }
};
