<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utility_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('utility_setting_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->integer('period_month');
            $table->integer('period_year');
            $table->decimal('reading_start', 12, 2);
            $table->decimal('reading_end', 12, 2)->nullable();
            $table->decimal('usage_amount', 12, 2)->nullable();
            $table->decimal('amount', 12, 2)->nullable();
            $table->foreignId('input_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('input_at')->nullable();
            $table->timestamps();

            $table->unique(['room_id', 'utility_setting_id', 'period_month', 'period_year'], 'ur_room_util_period_unique');
            $table->index('property_id');
            $table->index(['period_month', 'period_year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utility_readings');
    }
};
